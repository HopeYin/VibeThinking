/**
 * lib/ai/errors.ts — 统一错误规范化（PRD 7.5）
 *
 * 职责：把 HTTP 状态码与各家错误体翻译为 AIError，UI 层只认
 * kind + message，不感知服务商差异。
 */

export type AIErrorKind = 'auth' | 'rate_limit' | 'network' | 'cors' | 'unknown';

export class AIError extends Error {
  readonly kind: AIErrorKind;
  constructor(kind: AIErrorKind, message: string) {
    super(message);
    this.name = 'AIError';
    this.kind = kind;
  }
}

/** 从各家错误体里尽力抠出可读 message */
function extractMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const obj = body as Record<string, unknown>;
  const err = obj['error'];
  if (typeof err === 'object' && err !== null) {
    const msg = (err as Record<string, unknown>)['message'];
    if (typeof msg === 'string') return msg;
  }
  if (typeof obj['message'] === 'string') return obj['message'];
  return null;
}

export async function readErrorBody(res: Response): Promise<unknown> {
  try {
    const text = await res.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text ? { message: text } : null;
    }
  } catch {
    return null;
  }
}

export function normalizeHTTPError(status: number, body: unknown): AIError {
  const detail = extractMessage(body) ?? `HTTP ${status}`;
  if (status === 401 || status === 403) {
    return new AIError('auth', `鉴权失败：${detail}（请检查 API Key）`);
  }
  if (status === 429) {
    return new AIError('rate_limit', `触发限流：${detail}（稍后再试）`);
  }
  return new AIError('unknown', detail);
}

/** fetch 抛出的异常 → AIError。AbortError 不应走到这里（调用方先判 signal.aborted）。 */
export function normalizeException(e: unknown): AIError {
  if (e instanceof AIError) return e;
  const msg = e instanceof Error ? e.message : String(e);
  if (/cors|cross[- ]origin/i.test(msg)) {
    return new AIError(
      'cors',
      '浏览器跨域被拦截：可在 vite.config.ts 启用 proxy，并把 Base URL 改为本地代理路径（见 README）',
    );
  }
  // fetch 网络失败在浏览器里统一表现为 TypeError
  if (e instanceof TypeError) {
    return new AIError(
      'network',
      '网络请求失败：可能是断网、Base URL 错误，或该服务商拦截了浏览器跨域（CORS）',
    );
  }
  return new AIError('unknown', msg);
}

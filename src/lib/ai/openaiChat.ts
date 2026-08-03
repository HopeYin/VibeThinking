/**
 * lib/ai/openaiChat.ts — OpenAI Chat Completions 格式适配器
 * （DeepSeek / Kimi 预设走它；POST {baseUrl}/chat/completions）
 *
 * 解析：SSE `data:` 行 → choices[0].delta.content 增量，`data: [DONE]` 结束。
 */
import type { ProviderConfig } from '../../types';
import type { ChatRequest, ChatChunk, ProviderAdapter, TestResult } from './types';
import { AIError, normalizeException, normalizeHTTPError, readErrorBody } from './errors';
import { iterateSSEData, joinUrl } from './sse';

function pickModel(cfg: ProviderConfig): string {
  return cfg.defaultModel || cfg.models[0] || '';
}

async function* chatStream(
  cfg: ProviderConfig,
  req: ChatRequest,
): AsyncGenerator<ChatChunk> {
  let res: Response;
  try {
    res = await fetch(joinUrl(cfg.baseUrl, '/chat/completions'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ model: req.model, messages: req.messages, stream: true }),
      signal: req.signal,
    });
  } catch (e) {
    throw normalizeException(e);
  }

  if (!res.ok) {
    throw normalizeHTTPError(res.status, await readErrorBody(res));
  }
  if (!res.body) {
    throw new AIError('unknown', '响应没有内容流');
  }

  for await (const data of iterateSSEData(res.body)) {
    if (data === '[DONE]') return;
    let text: unknown;
    try {
      const obj = JSON.parse(data) as {
        choices?: Array<{ delta?: { content?: unknown } }>;
      };
      text = obj.choices?.[0]?.delta?.content;
    } catch {
      continue; // 心跳 / 注释行等非 JSON 数据
    }
    if (typeof text === 'string' && text.length > 0) {
      yield { text };
    }
  }
}

async function testConnection(cfg: ProviderConfig): Promise<TestResult> {
  const started = performance.now();
  try {
    const res = await fetch(joinUrl(cfg.baseUrl, '/chat/completions'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: pickModel(cfg),
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        stream: false,
      }),
    });
    const latencyMs = Math.round(performance.now() - started);
    if (!res.ok) {
      const err = normalizeHTTPError(res.status, await readErrorBody(res));
      return { ok: false, latencyMs, error: err.message };
    }
    return { ok: true, latencyMs };
  } catch (e) {
    const err = normalizeException(e);
    return { ok: false, latencyMs: Math.round(performance.now() - started), error: err.message };
  }
}

export const openAIChatAdapter: ProviderAdapter = {
  format: 'openai-chat',
  chatStream,
  testConnection,
};

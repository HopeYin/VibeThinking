/**
 * lib/ai/openaiResponses.ts — OpenAI Responses 格式适配器
 * （POST {baseUrl}/responses）
 *
 * 解析：SSE 事件流中 `response.output_text.delta` 事件的 delta 字段为增量，
 * `response.completed` 结束；`response.failed` / `error` 抛错。
 */
import type { ProviderConfig } from '../../types';
import type { ChatRequest, ChatChunk, ProviderAdapter, TestResult } from './types';
import { AIError, normalizeException, normalizeHTTPError, readErrorBody } from './errors';
import { iterateSSEData, joinUrl } from './sse';

interface ResponsesEvent {
  type?: string;
  delta?: unknown;
  response?: { error?: { message?: string } };
  error?: { message?: string };
}

async function* chatStream(cfg: ProviderConfig, req: ChatRequest): AsyncGenerator<ChatChunk> {
  let res: Response;
  try {
    res = await fetch(joinUrl(cfg.baseUrl, '/responses'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        // Chat Completions 的消息形态可直接作为 Responses 的 input
        input: req.messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
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
    let event: ResponsesEvent;
    try {
      event = JSON.parse(data) as ResponsesEvent;
    } catch {
      continue;
    }
    switch (event.type) {
      case 'response.output_text.delta':
        if (typeof event.delta === 'string' && event.delta.length > 0) {
          yield { text: event.delta };
        }
        break;
      case 'response.completed':
        return;
      case 'response.failed':
      case 'error': {
        const msg =
          event.response?.error?.message ?? event.error?.message ?? 'Responses 流式请求失败';
        throw new AIError('unknown', msg);
      }
      default:
        break; // 其余事件（response.created 等）忽略
    }
  }
}

async function testConnection(cfg: ProviderConfig): Promise<TestResult> {
  const started = performance.now();
  try {
    const res = await fetch(joinUrl(cfg.baseUrl, '/responses'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.defaultModel || cfg.models[0] || '',
        input: 'ping',
        max_output_tokens: 16,
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

export const openAIResponsesAdapter: ProviderAdapter = {
  format: 'openai-responses',
  chatStream,
  testConnection,
};

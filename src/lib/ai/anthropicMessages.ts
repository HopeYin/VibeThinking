/**
 * lib/ai/anthropicMessages.ts — Anthropic Messages 格式适配器
 * （POST {baseUrl}/messages）
 *
 * 要点：system 消息抽出为顶层 system 字段；浏览器直连需要
 * `anthropic-dangerous-direct-browser-access: true` 头。
 * 解析：SSE `content_block_delta` 事件的 delta.text 增量，`message_stop` 结束。
 */
import type { ProviderConfig } from '../../types';
import type { ChatRequest, ChatChunk, ProviderAdapter, TestResult } from './types';
import { AIError, normalizeException, normalizeHTTPError, readErrorBody } from './errors';
import { iterateSSEData, joinUrl } from './sse';

interface AnthropicEvent {
  type?: string;
  delta?: { type?: string; text?: unknown };
  error?: { type?: string; message?: string };
}

function buildHeaders(cfg: ProviderConfig): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-api-key': cfg.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

async function* chatStream(
  cfg: ProviderConfig,
  req: ChatRequest,
): AsyncGenerator<ChatChunk> {
  const systemText = req.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const turns = req.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  let res: Response;
  try {
    res = await fetch(joinUrl(cfg.baseUrl, '/messages'), {
      method: 'POST',
      headers: buildHeaders(cfg),
      body: JSON.stringify({
        model: req.model,
        max_tokens: 4096,
        ...(systemText ? { system: systemText } : {}),
        messages: turns,
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
    let event: AnthropicEvent;
    try {
      event = JSON.parse(data) as AnthropicEvent;
    } catch {
      continue;
    }
    if (event.type === 'content_block_delta') {
      const text = event.delta?.text;
      if (typeof text === 'string' && text.length > 0) {
        yield { text };
      }
    } else if (event.type === 'message_stop') {
      return;
    } else if (event.type === 'error') {
      throw new AIError('unknown', event.error?.message ?? 'Anthropic 流式请求失败');
    }
    // message_start / content_block_start / ping 等事件忽略
  }
}

async function testConnection(cfg: ProviderConfig): Promise<TestResult> {
  const started = performance.now();
  try {
    const res = await fetch(joinUrl(cfg.baseUrl, '/messages'), {
      method: 'POST',
      headers: buildHeaders(cfg),
      body: JSON.stringify({
        model: cfg.defaultModel || cfg.models[0] || '',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
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

export const anthropicMessagesAdapter: ProviderAdapter = {
  format: 'anthropic-messages',
  chatStream,
  testConnection,
};

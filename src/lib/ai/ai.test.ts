/**
 * lib/ai 单测：mock fetch，覆盖三种 API 格式的 SSE 解析与错误规范化（PRD M3 验收）
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '../../types';
import { openAIChatAdapter } from './openaiChat';
import { openAIResponsesAdapter } from './openaiResponses';
import { anthropicMessagesAdapter } from './anthropicMessages';
import { AIError } from './errors';
import type { ChatRequest } from './types';

const cfg: ProviderConfig = {
  id: 'p1',
  name: 'Test',
  apiFormat: 'openai-chat',
  baseUrl: 'https://api.example.com/v1/',
  apiKey: 'sk-test',
  models: ['m1'],
  defaultModel: 'm1',
};

const req: ChatRequest = {
  messages: [{ role: 'user', content: 'hi' }],
  model: 'm1',
  signal: new AbortController().signal,
};

function sseResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (const l of lines) c.enqueue(encoder.encode(l));
      c.close();
    },
  });
  return new Response(stream, { status: 200 });
}

async function collect(gen: AsyncGenerator<{ text: string }>): Promise<string> {
  let out = '';
  for await (const chunk of gen) out += chunk.text;
  return out;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenAIChatCompletionsAdapter', () => {
  it('解析 delta.content 增量并在 [DONE] 结束', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        sseResponse([
          'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"你"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"好"}}]}\n\n',
          'data: [DONE]\n\n',
        ]),
      ),
    );
    expect(await collect(openAIChatAdapter.chatStream(cfg, req))).toBe('你好');
  });

  it('Base URL 末尾斜杠容错', async () => {
    const spy = vi.fn(async (_input: unknown, _init?: RequestInit) =>
      sseResponse(['data: [DONE]\n\n']),
    );
    vi.stubGlobal('fetch', spy);
    await collect(openAIChatAdapter.chatStream({ ...cfg, baseUrl: 'https://a.com/v1/' }, req));
    expect(String(spy.mock.calls[0]?.[0])).toBe('https://a.com/v1/chat/completions');
  });

  it('401 → auth 错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"error":{"message":"Invalid API key"}}', { status: 401 })),
    );
    const err = await collect(openAIChatAdapter.chatStream(cfg, req)).catch((e) => e);
    expect(err).toBeInstanceOf(AIError);
    expect((err as AIError).kind).toBe('auth');
  });

  it('网络异常（TypeError）→ network 错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const err = await collect(openAIChatAdapter.chatStream(cfg, req)).catch((e) => e);
    expect((err as AIError).kind).toBe('network');
  });
});

describe('OpenAIResponsesAdapter', () => {
  it('解析 response.output_text.delta 并在 response.completed 结束', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        sseResponse([
          'data: {"type":"response.created"}\n\n',
          'data: {"type":"response.output_text.delta","delta":"思"}\n\n',
          'data: {"type":"response.output_text.delta","delta":"考"}\n\n',
          'data: {"type":"response.completed"}\n\n',
        ]),
      ),
    );
    expect(await collect(openAIResponsesAdapter.chatStream(cfg, req))).toBe('思考');
  });

  it('response.failed 抛出错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        sseResponse([
          'data: {"type":"response.failed","response":{"error":{"message":"boom"}}}\n\n',
        ]),
      ),
    );
    const err = await collect(openAIResponsesAdapter.chatStream(cfg, req)).catch((e) => e);
    expect((err as AIError).message).toBe('boom');
  });
});

describe('AnthropicMessagesAdapter', () => {
  const anthropicCfg: ProviderConfig = { ...cfg, apiFormat: 'anthropic-messages' };

  it('解析 content_block_delta 并在 message_stop 结束', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        sseResponse([
          'data: {"type":"message_start"}\n\n',
          'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"想"}}\n\n',
          'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"法"}}\n\n',
          'data: {"type":"message_stop"}\n\n',
        ]),
      ),
    );
    expect(await collect(anthropicMessagesAdapter.chatStream(anthropicCfg, req))).toBe('想法');
  });

  it('system 消息被抽出为顶层字段，且不进入 messages', async () => {
    const spy = vi.fn(async (_input: unknown, _init?: RequestInit) =>
      sseResponse(['data: {"type":"message_stop"}\n\n']),
    );
    vi.stubGlobal('fetch', spy);
    const reqWithSystem: ChatRequest = {
      ...req,
      messages: [
        { role: 'system', content: '你是陪练' },
        { role: 'user', content: 'hi' },
      ],
    };
    await collect(anthropicMessagesAdapter.chatStream(anthropicCfg, reqWithSystem));
    const body = JSON.parse(String(spy.mock.calls[0]?.[1]?.body)) as {
      system?: string;
      messages: Array<{ role: string }>;
    };
    expect(body.system).toBe('你是陪练');
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0]?.role).toBe('user');
  });

  it('429 → rate_limit 错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"error":{"message":"rate limited"}}', { status: 429 })),
    );
    const err = await collect(anthropicMessagesAdapter.chatStream(anthropicCfg, req)).catch(
      (e) => e,
    );
    expect((err as AIError).kind).toBe('rate_limit');
  });
});

describe('testConnection', () => {
  it('成功返回 ok 与延迟', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })),
    );
    const result = await openAIChatAdapter.testConnection(cfg);
    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('鉴权失败返回可读错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"error":{"message":"bad key"}}', { status: 403 })),
    );
    const result = await openAIChatAdapter.testConnection(cfg);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('bad key');
  });
});

/**
 * lib/ai/index.ts — AI Provider 抽象层入口（可复用资产）
 *
 * 职责：按 ProviderConfig.apiFormat 分发到具体适配器；UI 只从这里拿能力。
 * 架构红线：UI 组件不直接发 fetch，一律经由本层。
 */
import type { ApiFormat, ProviderConfig } from '../../types';
import type { ChatMessage, ChatRequest, ChatChunk, ProviderAdapter, TestResult } from './types';
import { openAIChatAdapter } from './openaiChat';
import { openAIResponsesAdapter } from './openaiResponses';
import { anthropicMessagesAdapter } from './anthropicMessages';

const ADAPTERS: Record<ApiFormat, ProviderAdapter> = {
  'openai-chat': openAIChatAdapter,
  'openai-responses': openAIResponsesAdapter,
  'anthropic-messages': anthropicMessagesAdapter,
};

export function getAdapter(format: ApiFormat): ProviderAdapter {
  return ADAPTERS[format];
}

export async function* streamChat(
  cfg: ProviderConfig,
  req: ChatRequest,
): AsyncGenerator<ChatChunk> {
  yield* getAdapter(cfg.apiFormat).chatStream(cfg, req);
}

export function testProviderConnection(cfg: ProviderConfig): Promise<TestResult> {
  return getAdapter(cfg.apiFormat).testConnection(cfg);
}

/**
 * 一次性生成（非流式场景：标签建议 / 总结 / 复盘）。
 * 内部仍走流式接口攒全文，避免为每家再写一套非流式解析。
 */
export async function generateText(
  cfg: ProviderConfig,
  model: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  let out = '';
  for await (const chunk of streamChat(cfg, {
    messages,
    model,
    signal: signal ?? new AbortController().signal,
  })) {
    out += chunk.text;
  }
  return out;
}

export const API_FORMAT_LABELS: Record<ApiFormat, string> = {
  'openai-chat': 'OpenAI Chat Completions',
  'openai-responses': 'OpenAI Responses',
  'anthropic-messages': 'Anthropic Messages',
};

/** 预设模板（PRD F6）：一键填充 Base URL 与格式，Key 一律留空 */
export interface ProviderPreset {
  name: string;
  apiFormat: ApiFormat;
  baseUrl: string;
  modelsText: string;
  defaultModel: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: 'DeepSeek',
    apiFormat: 'openai-chat',
    baseUrl: 'https://api.deepseek.com',
    modelsText: 'deepseek-chat, deepseek-reasoner',
    defaultModel: 'deepseek-chat',
  },
  {
    name: 'Kimi（Moonshot）',
    apiFormat: 'openai-chat',
    baseUrl: 'https://api.moonshot.cn/v1',
    modelsText: '', // 模型名以官方文档为准，用户自填（如 kimi-k2 系列）
    defaultModel: '',
  },
];

export { AIError, normalizeException } from './errors';
export type { ChatMessage, ChatRequest, ChatChunk, TestResult } from './types';

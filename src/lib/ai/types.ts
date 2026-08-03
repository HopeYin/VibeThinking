/**
 * lib/ai/types.ts — AI Provider 抽象层的公共类型（可复用资产，见 PRD 7.5）
 *
 * 三种 API 格式（openai-chat / openai-responses / anthropic-messages）
 * 对上表现为同一抽象：调用方只面对 ChatMessage / ChatChunk / AIError。
 */
import type { ApiFormat, ProviderConfig } from '../../types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  signal: AbortSignal; // 停止生成 = abort
}

export interface ChatChunk {
  text: string; // 增量文本
}

export interface TestResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface ProviderAdapter {
  readonly format: ApiFormat;
  chatStream(cfg: ProviderConfig, req: ChatRequest): AsyncGenerator<ChatChunk>;
  testConnection(cfg: ProviderConfig): Promise<TestResult>;
}

export type { ApiFormat, ProviderConfig };

/**
 * types/index.ts — 全部数据模型（见 VibeThinking.md 7.3）
 * 职责：公共数据结构的唯一定义处；新增字段先改这里。
 */

// ===== 思维链 =====

export interface Session {
  id: string;
  title: string;
  sortOrder: number;
  blocks: Block[]; // 按时间正序
  aiThread: AIMessage[]; // AI 讨论记录
  instructionPrompt: string; // 会话级指令 prompt
  reports: ReviewReport[]; // 复盘报告历史
  createdAt: number;
  updatedAt: number;
}

export type Block = OutputBlock | BreakpointBlock;

export interface OutputBlock {
  id: string;
  kind: 'output';
  content: string;
  tagIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BreakpointBlock {
  id: string;
  kind: 'breakpoint';
  note: string; // 阶段备注，可为空
  createdAt: number;
}

export type TagColor = 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export interface Tag {
  id: string;
  name: string;
  color: TagColor; // 8 色板之一
  isPreset: boolean;
}

// ===== AI =====

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'done' | 'streaming' | 'error' | 'stopped';
  createdAt: number;
}

export interface ReviewReport {
  id: string;
  content: string; // Markdown
  createdAt: number;
}

// ===== 设置 =====

export type ApiFormat = 'openai-chat' | 'openai-responses' | 'anthropic-messages';

export interface ProviderConfig {
  id: string;
  name: string;
  apiFormat: ApiFormat;
  baseUrl: string;
  apiKey: string; // 仅存 localStorage，见 PRD D3
  models: string[];
  defaultModel: string;
}

export interface Settings {
  providers: ProviderConfig[];
  activeProviderId: string | null;
  activeModel: string | null;
  sidebarCollapsed: boolean;
}

// ===== 存储 =====

export interface StorageMeta {
  schemaVersion: number;
  appVersion: string;
}

/**
 * lib/prompts.ts — 全部 prompt 模板集中管理（PRD 7.6，方便迭代）
 *
 * 核心决策（PRD D2）：AI 的上下文 = 完整思维链，而不是对话历史。
 * 每次请求都携带当前会话全部输出块 + 断点 + 标签序列化后的上下文。
 */
import type { Block, Session, Tag } from '../types';
import type { ChatMessage } from './ai';

// ── 思维链序列化 ─────────────────────────────────────────────

function fmtHM(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function serializeBlock(block: Block, tags: Tag[]): string {
  if (block.kind === 'breakpoint') {
    return `[断点] ${block.note || '（无备注）'}`;
  }
  const names = block.tagIds
    .map((id) => tags.find((t) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n));
  return `[输出块 ${fmtHM(block.createdAt)}]（标签：${names.join('、') || '无'}）${block.content}`;
}

export function serializeThoughtChain(blocks: Block[], tags: Tag[]): string {
  return blocks.map((b) => serializeBlock(b, tags)).join('\n');
}

// ── 截断策略（PRD 7.6.1）────────────────────────────────────
// 思维链超过 ~12000 字符时：保留最近 5 个块全文 + 更早内容的
// 「AI 总结」（无总结则保留最早 2 块 + 省略提示），并在 system 中说明。

export const CHAIN_CHAR_LIMIT = 12000;
const RECENT_FULL_BLOCKS = 5;
const OLDER_KEEP_BLOCKS = 2;

export interface ChainContext {
  system: string;
  truncated: boolean;
  outputCount: number;
  breakpointCount: number;
}

export function buildChainContext(
  session: Session,
  tags: Tag[],
  olderSummary?: string,
): ChainContext {
  const serialized = serializeThoughtChain(session.blocks, tags);
  let body = serialized;
  let truncated = false;

  if (serialized.length > CHAIN_CHAR_LIMIT) {
    truncated = true;
    const recent = session.blocks.slice(-RECENT_FULL_BLOCKS);
    const older = session.blocks.slice(0, Math.max(0, session.blocks.length - RECENT_FULL_BLOCKS));

    let olderText: string;
    if (olderSummary) {
      olderText = `【早期思维内容总结】${olderSummary}`;
    } else {
      const kept = older.slice(0, OLDER_KEEP_BLOCKS);
      const omitted = Math.max(0, older.length - kept.length);
      olderText =
        serializeThoughtChain(kept, tags) + (omitted > 0 ? `\n……（中间省略 ${omitted} 个块）` : '');
    }

    body = [
      olderText,
      `（思维链过长，已截断：以上是最早内容与省略提示，以下是最近 ${recent.length} 个块的完整内容）`,
      serializeThoughtChain(recent, tags),
    ].join('\n');
  }

  const system = [
    '你正在使用思维记录工具 VibeThinking 与用户一起思考。以下是用户当前会话的完整思维记录：',
    body,
    '---',
    truncated
      ? '（注：思维链过长，以上内容经过截断。）请基于以上思维脉络回应，不要复述记录，直接针对最新进展思考。'
      : '请基于以上思维脉络回应，不要复述记录，直接针对最新进展思考。',
  ].join('\n');

  return {
    system,
    truncated,
    outputCount: session.blocks.filter((b) => b.kind === 'output').length,
    breakpointCount: session.blocks.filter((b) => b.kind === 'breakpoint').length,
  };
}

// ── 默认指令 prompt（会话级，用户可改，PRD 7.6.2）─────────────

export const DEFAULT_INSTRUCTION_PROMPT =
  '你是我的思考陪练。请指出我思维链条中的漏洞、盲区与可推进的下一步，风格直接、具体。';

// ── AI 讨论：组装完整消息列表 ────────────────────────────────

export function buildDiscussionMessages(input: {
  session: Session;
  tags: Tag[];
  thread: Array<{ role: 'user' | 'assistant'; content: string }>;
}): ChatMessage[] {
  const ctx = buildChainContext(input.session, input.tags);
  const instruction = input.session.instructionPrompt.trim() || DEFAULT_INSTRUCTION_PROMPT;
  return [
    { role: 'system', content: `${ctx.system}\n\n${instruction}` },
    ...input.thread.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
  ];
}

// ── 自动标签建议（PRD 7.6.3 / F7）────────────────────────────

export function buildSuggestTagsMessages(blockContent: string, tagNames: string[]): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        '你是思维方法标签助手。从给定标签列表中选出最贴合用户想法的标签。',
        `标签列表：${tagNames.join('、')}`,
        '只返回 JSON：{"suggestions": ["标签名", ...]}，最多 3 个，必须全部来自列表，不要输出任何其他内容。',
      ].join('\n'),
    },
    { role: 'user', content: blockContent },
  ];
}

/**
 * 解析标签建议的模型输出：容错地抠出第一个 JSON 对象并校验结构。
 * 解析失败抛出 Error，调用方静默降级为 toast 报错（PRD F7）。
 */
export function parseTagSuggestions(text: string): string[] {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI 返回中没有 JSON');
  const parsed = JSON.parse(match[0]) as unknown;
  if (typeof parsed !== 'object' || parsed === null) throw new Error('AI 返回结构不正确');
  const suggestions = (parsed as Record<string, unknown>)['suggestions'];
  if (!Array.isArray(suggestions)) throw new Error('AI 返回缺少 suggestions 数组');
  return suggestions.filter((s): s is string => typeof s === 'string').slice(0, 3);
}

// ── 会话总结（PRD 7.6.4 / F8）────────────────────────────────

export function buildSummaryMessages(session: Session, tags: Tag[]): ChatMessage[] {
  const ctx = buildChainContext(session, tags);
  return [
    { role: 'system', content: ctx.system },
    {
      role: 'user',
      content:
        '请总结以上思维记录：按断点分阶段概括（无断点则整体概括），最后给一段总览。总字数 300 字以内，用简体中文，直接给结果，不要复述要求。',
    },
  ];
}

// ── 思维复盘报告（PRD 7.6.5 / F9）────────────────────────────

export function buildReviewMessages(session: Session, tags: Tag[]): ChatMessage[] {
  const ctx = buildChainContext(session, tags);

  // 标签分布统计（作为事实数据喂给模型，避免它自己数错）
  const counts = new Map<string, number>();
  for (const b of session.blocks) {
    if (b.kind !== 'output') continue;
    for (const id of b.tagIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const stats =
    [...counts.entries()]
      .map(([id, n]) => `${tags.find((t) => t.id === id)?.name ?? '未知'}×${n}`)
      .join('、') || '（无标签使用）';

  return [
    { role: 'system', content: ctx.system },
    {
      role: 'user',
      content: [
        '请基于以上思维记录生成一份思维复盘报告，用简体中文 Markdown 输出，严格按以下五段结构：',
        '',
        '## 思维轨迹',
        '各阶段（按断点）主题各用一句话概括。',
        '',
        '## 思维模式使用',
        `标签分布统计：${stats}。请对使用模式做简要点评。`,
        '',
        '## 亮点',
        '最有价值的 1~3 个想法，各说明原因。',
        '',
        '## 卡点与盲区',
        '反复出现但未推进的问题，以及思维上明显回避的角落。',
        '',
        '## 下一步建议',
        '可执行的 3 条建议，具体、不空泛。',
      ].join('\n'),
    },
  ];
}

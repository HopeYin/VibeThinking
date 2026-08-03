/**
 * lib/export/markdown.ts — 会话 → Markdown（PRD F10）
 * 纯函数，不碰 DOM；下载由 download.ts 负责。
 */
import type { Session, Tag } from '../../types';

function fmtDateTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export interface SessionMarkdownOptions {
  /** 末尾附 AI 讨论记录（F10 可选勾选） */
  includeAIThread: boolean;
}

export function sessionToMarkdown(
  session: Session,
  tags: Tag[],
  opts: SessionMarkdownOptions,
): string {
  const tagName = (id: string) => tags.find((t) => t.id === id)?.name;

  const lines: string[] = [
    `# ${session.title}`,
    '',
    `- 创建时间：${fmtDateTime(session.createdAt)}`,
    `- 导出时间：${fmtDateTime(Date.now())}`,
    `- 输出块 ${session.blocks.filter((b) => b.kind === 'output').length} 个 · 断点 ${session.blocks.filter((b) => b.kind === 'breakpoint').length} 个`,
    '',
  ];

  for (const block of session.blocks) {
    lines.push('---', '');
    if (block.kind === 'output') {
      const names = block.tagIds
        .map(tagName)
        .filter((n): n is string => Boolean(n))
        .join('、');
      lines.push(`**${fmtTime(block.createdAt)}** ｜ 标签：${names || '无'}`, '', block.content, '');
    } else {
      lines.push(`**▍断点** ${block.note || ''}`.trimEnd(), '');
    }
  }

  if (opts.includeAIThread && session.aiThread.length > 0) {
    lines.push('---', '', '## AI 讨论记录', '');
    for (const msg of session.aiThread) {
      lines.push(`**${msg.role === 'user' ? '用户' : 'AI'} · ${fmtTime(msg.createdAt)}**`, '', msg.content, '');
    }
  }

  return lines.join('\n').trimEnd() + '\n';
}

/** 复盘报告 → 独立 Markdown 文件内容（PRD F9） */
export function reportToMarkdown(sessionTitle: string, content: string, createdAt: number): string {
  return [
    `# 思维复盘报告 · ${sessionTitle}`,
    '',
    `- 生成时间：${fmtDateTime(createdAt)}`,
    '',
    '---',
    '',
    content,
  ].join('\n');
}

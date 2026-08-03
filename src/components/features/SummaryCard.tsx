/**
 * SummaryCard — AI 会话总结卡片（PRD F8：插入 AI 讨论抽屉顶部，不落进思维流）
 */
import { Copy, RefreshCw, Sparkles, X } from 'lucide-react';
import type { Session } from '../../types';
import { useSessionsStore } from '../../stores/sessions';
import { useAITasksStore } from '../../stores/aiTasks';
import { useToast } from '../ui/Toast';
import { formatRelativeTime } from '../../lib/time';
import { MarkdownView } from './MarkdownView';
import { runSummarize } from './aiActions';

export function SummaryCard({ session }: { session: Session }) {
  const toast = useToast();
  const setSummary = useSessionsStore((s) => s.setSummary);
  const summaryFor = useAITasksStore((s) => s.summaryFor);
  const generating = summaryFor === session.id;

  if (!session.summary && !generating) return null;

  return (
    <div className="mb-3 rounded-md border border-accent/30 bg-accent-subtle px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-13 text-text-secondary">
        <Sparkles size={12} className="text-accent" />
        <span className="font-medium">会话总结</span>
        {session.summary && (
          <span className="text-text-tertiary">
            {formatRelativeTime(session.summary.createdAt)}
          </span>
        )}
        <span className="flex-1" />
        {session.summary && (
          <button
            title="复制 Markdown"
            className="rounded-sm p-1 text-text-tertiary hover:bg-bg-muted hover:text-text"
            onClick={() => {
              void navigator.clipboard.writeText(session.summary!.content);
              toast('已复制总结 Markdown', 'success');
            }}
          >
            <Copy size={12} />
          </button>
        )}
        <button
          title="重新生成"
          disabled={generating}
          className="rounded-sm p-1 text-text-tertiary hover:bg-bg-muted hover:text-text disabled:opacity-40"
          onClick={() => void runSummarize(session.id, toast)}
        >
          <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
        </button>
        {session.summary && !generating && (
          <button
            title="关闭总结卡片"
            className="rounded-sm p-1 text-text-tertiary hover:bg-bg-muted hover:text-text"
            onClick={() => setSummary(session.id, null)}
          >
            <X size={12} />
          </button>
        )}
      </div>
      {session.summary ? (
        <MarkdownView content={session.summary.content} />
      ) : (
        <p className="text-13 text-text-tertiary">正在生成总结…</p>
      )}
    </div>
  );
}

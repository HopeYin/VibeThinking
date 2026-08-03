/**
 * ReportsDialog — 复盘报告查看 / 再生成 / 单篇导出（PRD F9）
 */
import { useState } from 'react';
import { Download, FileClock, RefreshCw } from 'lucide-react';
import { useSessionsStore } from '../../stores/sessions';
import { useAITasksStore } from '../../stores/aiTasks';
import { useUIStore } from '../../stores/ui';
import { useToast } from '../ui/Toast';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { downloadTextFile, reportToMarkdown, sanitizeFilename } from '../../lib/export';
import { formatRelativeTime } from '../../lib/time';
import { cn } from '../../lib/cn';
import { MarkdownView } from './MarkdownView';
import { runReview } from './aiActions';

export function ReportsDialog() {
  const open = useUIStore((s) => s.reportsOpen);
  const onClose = () => useUIStore.getState().setReportsOpen(false);
  const sessions = useSessionsStore((s) => s.sessions);
  const activeSessionId = useSessionsStore((s) => s.activeSessionId);
  const reviewFor = useAITasksStore((s) => s.reviewFor);
  const toast = useToast();

  const session = sessions.find((s) => s.id === activeSessionId) ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reports = session?.reports ?? [];
  const selected = reports.find((r) => r.id === selectedId) ?? reports[reports.length - 1];
  const generating = session !== null && reviewFor === session.id;

  const exportReport = () => {
    if (!session || !selected) return;
    const md = reportToMarkdown(session.title, selected.content, selected.createdAt);
    downloadTextFile(`复盘报告-${sanitizeFilename(session.title)}.md`, md, 'text/markdown');
    toast('已导出复盘报告', 'success');
  };

  return (
    <Dialog open={open} onClose={onClose} title="思维复盘报告" widthClassName="max-w-2xl">
      {!session ? (
        <p className="py-2 text-sm">当前没有选中的会话。</p>
      ) : reports.length === 0 && !generating ? (
        <EmptyState
          icon={<FileClock size={28} />}
          title="还没有复盘报告"
          description="基于这条思维链的完整记录，生成五段式复盘：思维轨迹、模式使用、亮点、卡点、下一步。"
          action={
            <Button size="sm" onClick={() => void runReview(session.id, toast)}>
              生成复盘报告
            </Button>
          }
        />
      ) : (
        <div className="py-1">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex flex-1 flex-wrap items-center gap-1">
              {reports.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    'rounded-sm px-2 py-1 text-13 transition-colors',
                    selected?.id === r.id
                      ? 'bg-accent-subtle text-text'
                      : 'text-text-tertiary hover:bg-bg-muted',
                  )}
                >
                  第 {i + 1} 篇 · {formatRelativeTime(r.createdAt)}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={generating}
              onClick={() => void runReview(session.id, toast)}
            >
              <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
              {generating ? '生成中…' : '再生成'}
            </Button>
            {selected && (
              <Button variant="ghost" size="sm" onClick={exportReport}>
                <Download size={13} /> 导出本篇
              </Button>
            )}
          </div>

          {generating && (
            <p className="mb-2 rounded-sm bg-bg-subtle px-3 py-2 text-13 text-text-secondary">
              AI 正在通读整条思维链，生成新的复盘报告…
            </p>
          )}

          {selected && (
            <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border bg-bg-subtle px-4 py-3">
              <MarkdownView content={selected.content} />
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

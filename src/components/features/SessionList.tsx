/**
 * SessionList — 会话列表：按 sortOrder 排序，搜索过滤，双击重命名，
 * HTML5 拖拽排序（持久化），删除二次确认（PRD F1）。
 */
import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Session } from '../../types';
import { selectSortedSessions, useSessionsStore } from '../../stores/sessions';
import { useTagsStore } from '../../stores/tags';
import { formatRelativeTime } from '../../lib/time';
import { downloadTextFile, sanitizeFilename, sessionToMarkdown } from '../../lib/export';
import { cn } from '../../lib/cn';
import { IconButton } from '../ui/IconButton';
import { Popover } from '../ui/Popover';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

interface SessionListProps {
  query: string;
}

export function SessionList({ query }: SessionListProps) {
  const sessions = useSessionsStore((s) => s.sessions);
  const activeSessionId = useSessionsStore((s) => s.activeSessionId);
  const setActiveSession = useSessionsStore((s) => s.setActiveSession);
  const moveSession = useSessionsStore((s) => s.moveSession);

  const sorted = selectSortedSessions(sessions);
  const filtered = query ? sorted.filter((s) => s.title.toLowerCase().includes(query.toLowerCase())) : sorted;

  return (
    <div className="flex-1 overflow-y-auto px-2 pb-3">
      {filtered.length === 0 && (
        <p className="px-2 py-6 text-center text-13 text-text-tertiary">
          {query ? '没有匹配的会话' : '还没有会话，点上方 + 新建'}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {filtered.map((session, index) => (
          <SessionItem
            key={session.id}
            session={session}
            active={session.id === activeSessionId}
            onSelect={() => setActiveSession(session.id)}
            onDrop={(draggedId) => moveSession(draggedId, index)}
            dragDisabled={query !== ''}
          />
        ))}
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: Session;
  active: boolean;
  onSelect: () => void;
  onDrop: (draggedId: string) => void;
  dragDisabled: boolean;
}

function SessionItem({ session, active, onSelect, onDrop, dragDisabled }: SessionItemProps) {
  const renameSession = useSessionsStore((s) => s.renameSession);
  const deleteSession = useSessionsStore((s) => s.deleteSession);
  const tags = useTagsStore((s) => s.tags);
  const toast = useToast();
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(session.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exportMarkdown = () => {
    const md = sessionToMarkdown(session, tags, { includeAIThread: false });
    downloadTextFile(`${sanitizeFilename(session.title)}.md`, md, 'text/markdown');
    toast('已导出 Markdown（如需附 AI 讨论记录请走顶栏导出）', 'success');
  };

  const commitRename = () => {
    const title = draftTitle.trim();
    if (title && title !== session.title) renameSession(session.id, title);
    setRenaming(false);
  };

  return (
    <>
      <div
        draggable={!dragDisabled && !renaming}
        onDragStart={(e) => e.dataTransfer.setData('text/vt-session-id', session.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const draggedId = e.dataTransfer.getData('text/vt-session-id');
          if (draggedId && draggedId !== session.id) onDrop(draggedId);
        }}
        onClick={onSelect}
        className={cn(
          'group cursor-pointer rounded-sm px-2 py-1.5 transition-colors duration-150',
          active ? 'bg-accent-subtle' : 'hover:bg-bg-muted',
        )}
      >
        <div className="flex items-center justify-between gap-1">
          {renaming ? (
            <Input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') {
                  setDraftTitle(session.title);
                  setRenaming(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-7 px-1.5 text-13"
            />
          ) : (
            <span
              className="min-w-0 flex-1 truncate text-sm"
              title="双击重命名"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setDraftTitle(session.title);
                setRenaming(true);
              }}
            >
              {session.title}
            </span>
          )}
          {!renaming && (
            <span
              className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <Popover
                align="right"
                trigger={
                  <IconButton label="会话操作" className="p-1">
                    <MoreHorizontal size={14} />
                  </IconButton>
                }
              >
                {(close) => (
                  <div className="w-32 p-1">
                    <button
                      className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-bg-muted"
                      onClick={() => {
                        setDraftTitle(session.title);
                        setRenaming(true);
                        close();
                      }}
                    >
                      重命名
                    </button>
                    <button
                      className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-bg-muted"
                      onClick={() => {
                        exportMarkdown();
                        close();
                      }}
                    >
                      导出 Markdown
                    </button>
                    <button
                      className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-danger hover:bg-bg-muted"
                      onClick={() => {
                        setConfirmDelete(true);
                        close();
                      }}
                    >
                      删除
                    </button>
                  </div>
                )}
              </Popover>
            </span>
          )}
        </div>
        <div className="mt-0.5 text-13 text-text-tertiary">
          {formatRelativeTime(session.updatedAt)} · {session.blocks.length} 块
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteSession(session.id)}
        title="删除会话"
        confirmText="删除"
      >
        「{session.title}」删除后不可恢复。如需保留，请先在顶栏导出备份。
      </ConfirmDialog>
    </>
  );
}

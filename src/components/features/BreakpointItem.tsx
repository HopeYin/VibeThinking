/**
 * BreakpointItem — 断点：思维流中的阶段分隔（PRD F4）
 * 一条横线 + 可编辑备注；hover 可删除。
 */
import { useState } from 'react';
import { Flag, Trash2 } from 'lucide-react';
import type { BreakpointBlock } from '../../types';
import { useSessionsStore } from '../../stores/sessions';
import { IconButton } from '../ui/IconButton';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface BreakpointItemProps {
  block: BreakpointBlock;
}

export function BreakpointItem({ block }: BreakpointItemProps) {
  const updateBreakpointNote = useSessionsStore((s) => s.updateBreakpointNote);
  const deleteBlock = useSessionsStore((s) => s.deleteBlock);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.note);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const commit = () => {
    updateBreakpointNote(block.id, draft.trim());
    setEditing(false);
  };

  return (
    <div className="group flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <div className="flex items-center gap-1.5">
        <Flag size={12} className="text-text-tertiary" />
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(block.note);
                setEditing(false);
              }
            }}
            placeholder="阶段备注，如「第一阶段：问题定义完毕」"
            className="w-56 rounded-sm border border-border bg-bg px-1.5 py-0.5 text-13 text-text-secondary focus:outline-2 focus:outline-accent"
          />
        ) : (
          <button
            onClick={() => {
              setDraft(block.note);
              setEditing(true);
            }}
            title="点击编辑备注"
            className="text-13 text-text-tertiary transition-colors duration-150 hover:text-text-secondary"
          >
            {block.note || '断点 · 添加阶段备注'}
          </button>
        )}
        <span className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <IconButton label="删除断点" className="p-1" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={12} />
          </IconButton>
        </span>
      </div>
      <div className="h-px flex-1 bg-border" />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteBlock(block.id)}
        title="删除断点"
        confirmText="删除"
      >
        删除这个断点？思维流内容不受影响。
      </ConfirmDialog>
    </div>
  );
}

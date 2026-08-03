/**
 * OutputBlockItem — 输出块：阅读态 / 编辑态切换（PRD F2）
 *
 * 阅读态：内容 + 标签 chips + 相对时间 + hover 操作（标签 / 删除）
 * 编辑态：自适应高度 Textarea，实时保存，Esc/失焦回到阅读态；空块删除
 */
import { useEffect, useState } from 'react';
import { Plus, Tags, Trash2 } from 'lucide-react';
import type { OutputBlock } from '../../types';
import { useSessionsStore } from '../../stores/sessions';
import { useTagsStore } from '../../stores/tags';
import { formatRelativeTime } from '../../lib/time';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { Textarea } from '../ui/Textarea';
import { IconButton } from '../ui/IconButton';
import { Popover } from '../ui/Popover';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TagPicker } from './TagPicker';

interface OutputBlockItemProps {
  block: OutputBlock;
}

export function OutputBlockItem({ block }: OutputBlockItemProps) {
  const updateBlockContent = useSessionsStore((s) => s.updateBlockContent);
  const finalizeBlock = useSessionsStore((s) => s.finalizeBlock);
  const setBlockTags = useSessionsStore((s) => s.setBlockTags);
  const deleteBlock = useSessionsStore((s) => s.deleteBlock);
  const tags = useTagsStore((s) => s.tags);

  const [editing, setEditing] = useState(block.content === '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 外部内容变化（如恢复备份）时同步编辑态
  useEffect(() => {
    if (block.content === '') setEditing(true);
  }, [block.content]);

  const blockTags = tags.filter((t) => block.tagIds.includes(t.id));

  const toggleTag = (tagId: string) => {
    const next = block.tagIds.includes(tagId)
      ? block.tagIds.filter((id) => id !== tagId)
      : [...block.tagIds, tagId];
    setBlockTags(block.id, next);
  };

  const exitEdit = () => {
    setEditing(false);
    finalizeBlock(block.id);
  };

  if (editing) {
    return (
      <Card className="border-accent px-4 py-3">
        <Textarea
          autoFocus
          value={block.content}
          onChange={(e) => updateBlockContent(block.id, e.target.value)}
          onBlur={exitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') exitEdit();
          }}
          placeholder="写下你的想法…（Esc 完成）"
          className="border-0 px-0 py-0 text-15 leading-relaxed shadow-none hover:border-0 focus:outline-none focus:border-0"
        />
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {blockTags.map((t) => (
            <Chip key={t.id} color={t.color}>
              {t.name}
            </Chip>
          ))}
          <Popover
            placement="top"
            trigger={
              <span className="inline-flex cursor-pointer items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-13 text-text-tertiary hover:bg-bg-muted hover:text-text-secondary">
                <Plus size={12} /> 标签
              </span>
            }
          >
            <TagPicker selectedIds={block.tagIds} onToggle={toggleTag} />
          </Popover>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="group relative cursor-text px-4 py-3 transition-shadow duration-150 hover:shadow-md"
      onClick={() => setEditing(true)}
    >
      <div
        className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Popover
          align="right"
          trigger={
            <IconButton label="编辑标签">
              <Tags size={14} />
            </IconButton>
          }
        >
          <TagPicker selectedIds={block.tagIds} onToggle={toggleTag} />
        </Popover>
        <IconButton label="删除块" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={14} />
        </IconButton>
      </div>

      <p className="whitespace-pre-wrap pr-14 text-15 leading-relaxed">{block.content}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {blockTags.map((t) => (
          <Chip key={t.id} color={t.color}>
            {t.name}
          </Chip>
        ))}
        <span
          onClick={(e) => e.stopPropagation()}
          className="inline-flex"
        >
          <Popover
            placement="top"
            trigger={
              <span className="inline-flex cursor-pointer items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-13 text-text-tertiary hover:bg-bg-muted hover:text-text-secondary">
                <Plus size={12} /> 标签
              </span>
            }
          >
            <TagPicker selectedIds={block.tagIds} onToggle={toggleTag} />
          </Popover>
        </span>
        <span className="flex-1" />
        <span className="text-13 text-text-tertiary">{formatRelativeTime(block.updatedAt)}</span>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteBlock(block.id)}
        title="删除输出块"
        confirmText="删除"
      >
        这条想法将被删除，不可恢复。
      </ConfirmDialog>
    </Card>
  );
}

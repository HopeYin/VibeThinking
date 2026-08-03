/**
 * TagPicker — 输出块标签选择层（PRD F3：已选排前；支持层内新建标签）
 *
 * 最小示例：
 *   <Popover trigger={...}><TagPicker selectedIds={ids} onToggle={toggle} /></Popover>
 */
import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { TagColor } from '../../types';
import { useTagsStore } from '../../stores/tags';
import { TAG_COLOR_DOT, TAG_COLORS } from '../../lib/tagColors';
import { cn } from '../../lib/cn';
import { Input } from '../ui/Input';

interface TagPickerProps {
  selectedIds: string[];
  onToggle: (tagId: string) => void;
}

export function TagPicker({ selectedIds, onToggle }: TagPickerProps) {
  const tags = useTagsStore((s) => s.tags);
  const addTag = useTagsStore((s) => s.addTag);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<TagColor>('gray');
  const [creating, setCreating] = useState(false);

  // 已选排前，组内保持原顺序
  const sorted = [...tags].sort(
    (a, b) => Number(selectedIds.includes(b.id)) - Number(selectedIds.includes(a.id)),
  );

  const submitNewTag = () => {
    const name = newName.trim();
    if (!name) return;
    const tag = addTag(name, newColor);
    onToggle(tag.id); // 新建后直接选中
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="w-60 p-2">
      <div className="max-h-56 space-y-0.5 overflow-y-auto">
        {sorted.map((tag) => {
          const selected = selectedIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => onToggle(tag.id)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-bg-muted"
            >
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', TAG_COLOR_DOT[tag.color])} />
              <span className="min-w-0 flex-1 truncate">{tag.name}</span>
              {selected && <Check size={14} className="shrink-0 text-accent" />}
            </button>
          );
        })}
        {tags.length === 0 && (
          <p className="px-2 py-3 text-center text-13 text-text-tertiary">还没有标签，先建一个</p>
        )}
      </div>

      <div className="mt-1 border-t border-border pt-2">
        {creating ? (
          <div className="space-y-2 px-1 pb-1">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewTag();
                if (e.key === 'Escape') setCreating(false);
              }}
              placeholder="标签名称"
              className="h-8 text-13"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    title={c}
                    onClick={() => setNewColor(c)}
                    className={cn(
                      'h-4 w-4 rounded-full',
                      TAG_COLOR_DOT[c],
                      newColor === c && 'ring-2 ring-accent ring-offset-1',
                    )}
                  />
                ))}
              </div>
              <button
                onClick={submitNewTag}
                disabled={!newName.trim()}
                className="rounded-sm px-2 py-1 text-13 font-medium text-accent hover:bg-accent-subtle disabled:opacity-40"
              >
                添加
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-13 text-text-secondary hover:bg-bg-muted"
          >
            <Plus size={13} /> 新建标签
          </button>
        )}
      </div>
    </div>
  );
}

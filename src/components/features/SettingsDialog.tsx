/**
 * SettingsDialog — 设置页（M1：标签管理 + 存储占用；M3 增加「模型服务」分区）
 *
 * 标签删除红线：若被输出块引用，提示「N 个输出块正在使用」，确认后从所有块移除（PRD F3）。
 */
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Tag, TagColor } from '../../types';
import { useTagsStore } from '../../stores/tags';
import { useSessionsStore } from '../../stores/sessions';
import { estimateStorageUsage } from '../../lib/storage';
import { TAG_COLOR_DOT, TAG_COLORS } from '../../lib/tagColors';
import { cn } from '../../lib/cn';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconButton } from '../ui/IconButton';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="设置" widthClassName="max-w-xl">
      <div className="max-h-[65vh] space-y-6 overflow-y-auto py-2 pr-1">
        <TagManageSection />
        <StorageSection />
        <p className="text-13 text-text-tertiary">
          「模型服务」分区将在下一阶段（M3）上线，届时可在这里配置 DeepSeek / Kimi 等 Provider。
        </p>
      </div>
    </Dialog>
  );
}

// ── 标签管理 ────────────────────────────────────────────────

function TagManageSection() {
  const tags = useTagsStore((s) => s.tags);
  const addTag = useTagsStore((s) => s.addTag);
  const updateTag = useTagsStore((s) => s.updateTag);
  const deleteTag = useTagsStore((s) => s.deleteTag);
  const sessions = useSessionsStore((s) => s.sessions);
  const removeTagFromAllBlocks = useSessionsStore((s) => s.removeTagFromAllBlocks);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<TagColor>('blue');
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);

  const usageCount = (tagId: string) =>
    sessions.reduce(
      (n, s) =>
        n + s.blocks.filter((b) => b.kind === 'output' && b.tagIds.includes(tagId)).length,
      0,
    );

  const submitNew = () => {
    const name = newName.trim();
    if (!name) return;
    addTag(name, newColor);
    setNewName('');
  };

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-text">思维方法标签</h3>
      <p className="mb-3 text-13 text-text-tertiary">预设标签可改可删；标签本身也是思维资产。</p>

      <div className="space-y-1.5">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2">
            <div className="flex gap-1">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => updateTag(tag.id, { color: c })}
                  className={cn(
                    'h-3.5 w-3.5 rounded-full',
                    TAG_COLOR_DOT[c],
                    tag.color === c && 'ring-2 ring-accent ring-offset-1',
                  )}
                />
              ))}
            </div>
            <Input
              value={tag.name}
              onChange={(e) => updateTag(tag.id, { name: e.target.value })}
              className="h-8 flex-1 border-transparent bg-transparent hover:border-border focus:border-accent"
            />
            <span className="w-16 shrink-0 text-right text-13 text-text-tertiary">
              {usageCount(tag.id)} 块引用
            </span>
            <IconButton label="删除标签" onClick={() => setPendingDelete(tag)}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex gap-1">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => setNewColor(c)}
              className={cn(
                'h-3.5 w-3.5 rounded-full',
                TAG_COLOR_DOT[c],
                newColor === c && 'ring-2 ring-accent ring-offset-1',
              )}
            />
          ))}
        </div>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitNew();
          }}
          placeholder="新标签名称"
          className="h-8 flex-1"
        />
        <Button variant="secondary" size="sm" onClick={submitNew} disabled={!newName.trim()}>
          新建标签
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteTag(pendingDelete.id);
          removeTagFromAllBlocks(pendingDelete.id);
        }}
        title="删除标签"
        confirmText="删除"
      >
        {pendingDelete && usageCount(pendingDelete.id) > 0
          ? `「${pendingDelete.name}」正被 ${usageCount(pendingDelete.id)} 个输出块使用，删除后将从这些块移除。`
          : `确定删除标签「${pendingDelete?.name}」？`}
      </ConfirmDialog>
    </section>
  );
}

// ── 存储占用 ────────────────────────────────────────────────

function StorageSection() {
  const usage = estimateStorageUsage();
  const pct = Math.min(100, (usage.bytes / (5 * 1024 * 1024)) * 100);

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-text">本地存储</h3>
      <p className="mb-2 text-13 text-text-secondary">
        数据保存在本机浏览器 localStorage，当前占用约 {usage.text}（上限约 5 MB）。
        建议定期通过顶栏「导出」做 JSON 备份。
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}

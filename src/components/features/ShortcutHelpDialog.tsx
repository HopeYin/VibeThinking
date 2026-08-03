/**
 * ShortcutHelpDialog — 快捷键帮助面板（Ctrl/⌘+/，PRD F12）
 */
import { Dialog } from '../ui/Dialog';

const SHORTCUTS: Array<{ keys: string; desc: string }> = [
  { keys: 'Ctrl/⌘ + K', desc: '命令面板' },
  { keys: 'Alt + N', desc: '新输出块' },
  { keys: 'Alt + B', desc: '插入断点' },
  { keys: 'Alt + I', desc: '打开 / 关闭 AI 讨论' },
  { keys: 'Ctrl/⌘ + /', desc: '本帮助面板' },
  { keys: 'Esc', desc: '结束编辑 / 关闭弹层' },
];

interface ShortcutHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutHelpDialog({ open, onClose }: ShortcutHelpDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="快捷键" widthClassName="max-w-sm">
      <div className="space-y-1 py-1">
        {SHORTCUTS.map((s) => (
          <div key={s.keys} className="flex items-center justify-between py-1">
            <span className="text-sm text-text">{s.desc}</span>
            <kbd className="rounded-sm border border-border bg-bg-subtle px-2 py-0.5 font-mono text-13 text-text-secondary">
              {s.keys}
            </kbd>
          </div>
        ))}
        <p className="pt-2 text-13 text-text-tertiary">
          输入框聚焦时 Alt 系快捷键不生效（命令面板除外）。
        </p>
      </div>
    </Dialog>
  );
}

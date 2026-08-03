/**
 * CommandPalette — 命令面板（ui 组件资产，PRD D1/F12）
 *
 * 职责：模糊搜索全部动作，↑↓ 选择，Enter 执行，Esc 关闭。
 * 动作由调用方组装（含动态项如「切换到某会话」），组件只负责交互。
 *
 * 最小示例：
 *   <CommandPalette open={open} onClose={...} actions={[{ id, title, run }]} />
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface CommandAction {
  id: string;
  title: string;
  /** 右侧辅助说明（如快捷键） */
  hint?: string;
  /** 额外搜索词（英文/拼音等） */
  keywords?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

/**
 * 子序列模糊匹配评分：返回 null 表示不匹配，数值越小越好。
 * 连续匹配加分，开头匹配加分。
 */
function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (q === '') return 0;
  if (t.includes(q)) return t.indexOf(q); // 直接包含最优
  let ti = 0;
  let score = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;
    score += found - ti + 10; // 不连续惩罚
    ti = found + 1;
  }
  return score;
}

export function CommandPalette({ open, onClose, actions }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return actions;
    return actions
      .map((a) => ({
        action: a,
        score: fuzzyScore(q, `${a.title} ${a.keywords ?? ''}`),
      }))
      .filter((x): x is { action: CommandAction; score: number } => x.score !== null)
      .sort((a, b) => a.score - b.score)
      .map((x) => x.action);
  }, [actions, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filtered.length]);

  // 保持选中项可见
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const runAction = (action: CommandAction | undefined) => {
    if (!action) return;
    onClose();
    action.run();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/30"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto mt-[16vh] w-full max-w-lg rounded-lg bg-bg shadow-lg animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search size={15} className="shrink-0 text-text-tertiary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                runAction(filtered[activeIndex]);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="输入命令或搜索会话…"
            className="h-12 w-full bg-transparent text-sm text-text placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-13 text-text-tertiary">没有匹配的命令</p>
          )}
          {filtered.map((action, i) => (
            <button
              key={action.id}
              data-index={i}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => runAction(action)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm',
                i === activeIndex ? 'bg-accent-subtle text-text' : 'text-text-secondary',
              )}
            >
              <span className="min-w-0 flex-1 truncate">{action.title}</span>
              {action.hint && (
                <span className="shrink-0 text-13 text-text-tertiary">{action.hint}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-13 text-text-tertiary">
          <span>↑↓ 选择</span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft size={12} /> 执行
          </span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

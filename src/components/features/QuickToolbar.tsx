/**
 * QuickToolbar — 主区底部常驻快捷工具条（PRD D1）
 * 新输出块 / 插断点 / AI 讨论（快捷键提示见 M2 帮助面板）
 */
import { Flag, MessageSquarePlus, Sparkles } from 'lucide-react';
import { useSessionsStore } from '../../stores/sessions';
import { useUIStore } from '../../stores/ui';

export function QuickToolbar() {
  const addOutputBlock = useSessionsStore((s) => s.addOutputBlock);
  const addBreakpoint = useSessionsStore((s) => s.addBreakpoint);
  const toggleAIDrawer = useUIStore((s) => s.toggleAIDrawer);

  const item =
    'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-13 text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text';

  return (
    <div className="pointer-events-none sticky bottom-4 z-10 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1 rounded-md border border-border bg-bg px-1.5 py-1 shadow-md">
        <button className={item} onClick={() => addOutputBlock()} title="新输出块（Alt+N）">
          <MessageSquarePlus size={14} />
          新输出块
        </button>
        <button className={item} onClick={() => addBreakpoint()} title="插入断点（Alt+B）">
          <Flag size={14} />
          插入断点
        </button>
        <div className="h-4 w-px bg-border" />
        <button className={item} onClick={toggleAIDrawer} title="AI 讨论（Alt+I）">
          <Sparkles size={14} />
          AI 讨论
        </button>
      </div>
    </div>
  );
}

/**
 * Popover — 轻量弹出层（ui 组件资产）
 *
 * 最小示例：
 *   <Popover trigger={<IconButton label="更多"><MoreHorizontal size={15} /></IconButton>}>
 *     {(close) => <button onClick={() => { act(); close(); }}>动作</button>}
 *   </Popover>
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'left' | 'right';
  /** 面板向上展开（用于底部工具条等场景） */
  placement?: 'bottom' | 'top';
  panelClassName?: string;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({
  trigger,
  children,
  align = 'left',
  placement = 'bottom',
  panelClassName,
  onOpenChange,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) changeOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') changeOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-block">
      <span className="inline-flex cursor-pointer" onClick={() => changeOpen(!open)}>
        {trigger}
      </span>
      {open && (
        <div
          className={cn(
            'absolute z-40 rounded-md border border-border bg-bg shadow-md',
            'animate-in fade-in zoom-in-95 duration-150',
            placement === 'bottom' ? 'mt-1 top-full' : 'mb-1 bottom-full',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {typeof children === 'function' ? children(() => changeOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

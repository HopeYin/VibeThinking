/**
 * Dialog — 模态对话框（ui 组件资产）
 *
 * 最小示例：
 *   <Dialog open={open} onClose={() => setOpen(false)} title="删除会话"
 *     footer={<><Button variant="secondary" onClick={...}>取消</Button><Button variant="danger">删除</Button></>}>
 *     删除后不可恢复，确定吗？
 *   </Dialog>
 */
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** 点击遮罩是否关闭，默认 true */
  closeOnOverlay?: boolean;
  widthClassName?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnOverlay = true,
  widthClassName = 'max-w-md',
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'w-full rounded-lg bg-bg shadow-lg',
          'animate-in fade-in zoom-in-95 duration-200',
          widthClassName,
        )}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          {title ? <h2 className="text-base font-semibold">{title}</h2> : <span />}
          <button
            onClick={onClose}
            aria-label="关闭"
            className="rounded-sm p-1 text-text-tertiary hover:bg-bg-muted hover:text-text transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-2 text-sm text-text-secondary">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 pt-3 pb-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

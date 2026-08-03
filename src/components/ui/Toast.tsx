/**
 * Toast — 轻量提示（ui 组件资产）
 *
 * 最小示例：
 *   // main.tsx 里包一层 <ToastProvider>
 *   const toast = useToast();
 *   toast('已导出 Markdown', 'success');
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ToastKind = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function useToast(): (message: string, kind?: ToastKind) => void {
  return useContext(ToastContext);
}

const KIND_STYLE: Record<ToastKind, { icon: ReactNode; className: string }> = {
  info: { icon: <Info size={15} />, className: 'text-text-secondary' },
  success: { icon: <CheckCircle2 size={15} />, className: 'text-success' },
  error: { icon: <AlertTriangle size={15} />, className: 'text-danger' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                'flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 shadow-md',
                'text-sm text-text animate-in fade-in slide-in-from-bottom-2 duration-200',
              )}
            >
              <span className={KIND_STYLE[t.kind].className}>{KIND_STYLE[t.kind].icon}</span>
              {t.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

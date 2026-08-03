/**
 * Textarea — 自适应高度多行输入（ui 组件资产）
 *
 * 最小示例：
 *   <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="写下想法…" />
 */
import { forwardRef, useRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { useAutoResize } from '../../hooks/useAutoResize';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 关闭自适应高度（默认开启） */
  fixedHeight?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, fixedHeight = false, value = '', ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  useAutoResize(innerRef, fixedHeight ? '' : String(value));

  return (
    <textarea
      ref={(node) => {
        innerRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      rows={rest.rows ?? 1}
      value={value}
      className={cn(
        'w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm text-text',
        'placeholder:text-text-tertiary resize-none',
        'transition-colors duration-150 ease-out',
        'hover:border-text-tertiary/50',
        'focus:outline-2 focus:outline-accent focus:border-accent',
        fixedHeight ? 'overflow-y-auto' : 'overflow-hidden',
        className,
      )}
      {...rest}
    />
  );
});

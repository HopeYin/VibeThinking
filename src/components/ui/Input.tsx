/**
 * Input — 单行输入框（ui 组件资产）
 *
 * 最小示例：
 *   <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="会话标题" />
 */
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-sm border border-border bg-bg px-3 text-sm text-text',
        'placeholder:text-text-tertiary',
        'transition-colors duration-150 ease-out',
        'hover:border-text-tertiary/50',
        'focus:outline-2 focus:outline-accent focus:border-accent',
        className,
      )}
      {...rest}
    />
  );
});

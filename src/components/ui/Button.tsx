/**
 * Button — 通用按钮（ui 组件资产）
 *
 * 最小示例：
 *   <Button variant="primary" size="md" onClick={save}>保存</Button>
 *   <Button variant="danger" size="sm">删除</Button>
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm',
  secondary: 'bg-bg-subtle text-text border border-border hover:bg-bg-muted',
  ghost: 'text-text-secondary hover:bg-bg-muted hover:text-text',
  danger: 'bg-danger text-white hover:opacity-90',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-13',
  md: 'h-9 px-3.5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-sm font-medium',
        'transition-colors duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    />
  );
});

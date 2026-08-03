/**
 * IconButton — 图标按钮（ui 组件资产）
 *
 * 最小示例：
 *   <IconButton label="删除" onClick={del}><Trash2 size={15} /></IconButton>
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 无障碍标签，同时作为 tooltip */
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-sm p-1.5',
        'text-text-tertiary hover:bg-bg-muted hover:text-text',
        'transition-colors duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-accent',
        'disabled:opacity-40 disabled:pointer-events-none',
        className,
      )}
      {...rest}
    />
  );
});

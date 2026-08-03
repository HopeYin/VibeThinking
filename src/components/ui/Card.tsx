/**
 * Card — 卡片容器（ui 组件资产）
 *
 * 最小示例：
 *   <Card className="p-4">内容</Card>
 */
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...rest }: CardProps) {
  return (
    <div className={cn('rounded-md border border-border bg-bg shadow-sm', className)} {...rest} />
  );
}

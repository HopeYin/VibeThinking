/**
 * EmptyState — 空状态（ui 组件资产）
 *
 * 最小示例：
 *   <EmptyState title="还没有会话" description="新建一个开始记录" action={<Button>新建会话</Button>} />
 */
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
      {icon && <div className="mb-1 text-text-tertiary">{icon}</div>}
      <p className="text-base font-medium text-text-secondary">{title}</p>
      {description && <p className="text-sm text-text-tertiary">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

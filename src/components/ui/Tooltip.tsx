/**
 * Tooltip — 轻量提示（ui 组件资产，CSS-only）
 *
 * 最小示例：
 *   <Tooltip content="快捷键 Alt+N"><button>新块</button></Tooltip>
 */
import type { ReactNode } from 'react';

export interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 rounded-sm bg-text px-2 py-0.5 text-13 whitespace-nowrap text-bg opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}

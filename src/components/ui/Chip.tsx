/**
 * Chip — 标签 chip（ui 组件资产）
 *
 * 最小示例：
 *   <Chip color="blue">第一性原理</Chip>
 *   <Chip color="red" dashed onClick={accept}>AI 建议：逆向思考</Chip>
 */
import type { ReactNode } from 'react';
import type { TagColor } from '../../types';
import { TAG_COLOR_DASHED, TAG_COLOR_SOLID } from '../../lib/tagColors';
import { cn } from '../../lib/cn';

export interface ChipProps {
  color: TagColor;
  children: ReactNode;
  /** 虚线样式（AI 建议等未确认状态） */
  dashed?: boolean;
  onClick?: () => void;
  title?: string;
}

export function Chip({ color, children, dashed = false, onClick, title }: ChipProps) {
  return (
    <span
      title={title}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-13 leading-5 select-none',
        dashed ? TAG_COLOR_DASHED[color] : TAG_COLOR_SOLID[color],
        onClick && 'cursor-pointer transition-opacity duration-150 hover:opacity-75',
      )}
    >
      {children}
    </span>
  );
}

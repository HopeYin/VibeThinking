/**
 * lib/tagColors.ts — 标签 8 色板 → Tailwind 类名映射
 *
 * 注意：类名必须是字面量（Tailwind 编译期扫描），禁止动态拼接。
 */
import type { TagColor } from '../types';

export const TAG_COLORS: TagColor[] = [
  'gray',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
];

/** 浅底深字 chip（已选标签） */
export const TAG_COLOR_SOLID: Record<TagColor, string> = {
  gray: 'bg-tag-gray-bg text-tag-gray',
  red: 'bg-tag-red-bg text-tag-red',
  orange: 'bg-tag-orange-bg text-tag-orange',
  yellow: 'bg-tag-yellow-bg text-tag-yellow',
  green: 'bg-tag-green-bg text-tag-green',
  blue: 'bg-tag-blue-bg text-tag-blue',
  purple: 'bg-tag-purple-bg text-tag-purple',
  pink: 'bg-tag-pink-bg text-tag-pink',
};

/** 虚线 chip（AI 建议标签，未采纳状态） */
export const TAG_COLOR_DASHED: Record<TagColor, string> = {
  gray: 'border border-dashed border-tag-gray/70 text-tag-gray',
  red: 'border border-dashed border-tag-red/70 text-tag-red',
  orange: 'border border-dashed border-tag-orange/70 text-tag-orange',
  yellow: 'border border-dashed border-tag-yellow/70 text-tag-yellow',
  green: 'border border-dashed border-tag-green/70 text-tag-green',
  blue: 'border border-dashed border-tag-blue/70 text-tag-blue',
  purple: 'border border-dashed border-tag-purple/70 text-tag-purple',
  pink: 'border border-dashed border-tag-pink/70 text-tag-pink',
};

/** 色板圆点（标签管理 / 新建标签） */
export const TAG_COLOR_DOT: Record<TagColor, string> = {
  gray: 'bg-tag-gray',
  red: 'bg-tag-red',
  orange: 'bg-tag-orange',
  yellow: 'bg-tag-yellow',
  green: 'bg-tag-green',
  blue: 'bg-tag-blue',
  purple: 'bg-tag-purple',
  pink: 'bg-tag-pink',
};

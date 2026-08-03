/**
 * cn — 极简 className 拼接工具（clsx 的子集，够本项目用）
 * 用法：cn('base', cond && 'conditional', maybeUndefined)
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

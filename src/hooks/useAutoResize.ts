/**
 * useAutoResize — textarea 自适应高度 hook
 *
 * 职责：内容变化时把高度设为 scrollHeight，收起时回到 minRows 高度。
 * 仅用于纯文本无摩擦记录场景（输出块、AI 输入框）。
 */
import { useLayoutEffect, type RefObject } from 'react';

export function useAutoResize(ref: RefObject<HTMLTextAreaElement | null>, value: string): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}

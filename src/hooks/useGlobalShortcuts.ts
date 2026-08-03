/**
 * useGlobalShortcuts — 全局快捷键（PRD F12）
 *
 * 规则：焦点在输入框 / textarea / contentEditable 时不触发 Alt 系快捷键；
 * Ctrl/⌘+K（命令面板）与 Ctrl/⌘+/（帮助）始终可用。
 */
import { useEffect } from 'react';
import { useSessionsStore } from '../stores/sessions';
import { useUIStore } from '../stores/ui';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

export function useGlobalShortcuts(): void {
  const addOutputBlock = useSessionsStore((s) => s.addOutputBlock);
  const addBreakpoint = useSessionsStore((s) => s.addBreakpoint);
  const hasActiveSession = useSessionsStore((s) => s.activeSessionId !== null);
  const toggleAIDrawer = useUIStore((s) => s.toggleAIDrawer);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setShortcutHelpOpen = useUIStore((s) => s.setShortcutHelpOpen);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if (mod && e.key === '/') {
        e.preventDefault();
        setShortcutHelpOpen(true);
        return;
      }

      if (isEditableTarget(e.target)) return;

      if (e.altKey && key === 'n') {
        e.preventDefault();
        if (hasActiveSession) addOutputBlock();
      } else if (e.altKey && key === 'b') {
        e.preventDefault();
        if (hasActiveSession) addBreakpoint();
      } else if (e.altKey && key === 'i') {
        e.preventDefault();
        toggleAIDrawer();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [
    addOutputBlock,
    addBreakpoint,
    hasActiveSession,
    toggleAIDrawer,
    setCommandPaletteOpen,
    setShortcutHelpOpen,
  ]);
}

/**
 * stores/ui.ts — 瞬时 UI 状态（不持久化；侧栏折叠等偏好存 settings store）
 * 职责：各面板/抽屉/对话框的开关，避免层层 props 传递。
 */
import { create } from 'zustand';

interface UIState {
  aiDrawerOpen: boolean;
  settingsOpen: boolean;
  commandPaletteOpen: boolean;
  shortcutHelpOpen: boolean;

  toggleAIDrawer: () => void;
  setAIDrawerOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutHelpOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  aiDrawerOpen: false,
  settingsOpen: false,
  commandPaletteOpen: false,
  shortcutHelpOpen: false,

  toggleAIDrawer: () => set((s) => ({ aiDrawerOpen: !s.aiDrawerOpen })),
  setAIDrawerOpen: (open) => set({ aiDrawerOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setShortcutHelpOpen: (open) => set({ shortcutHelpOpen: open }),
}));

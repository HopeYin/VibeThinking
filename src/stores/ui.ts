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
  /** 导出当前会话 Markdown 对话框（顶栏/命令面板共用） */
  exportMarkdownOpen: boolean;
  /** 导出全局备份对话框 */
  exportBackupOpen: boolean;
  /** 复盘报告对话框 */
  reportsOpen: boolean;

  toggleAIDrawer: () => void;
  setAIDrawerOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutHelpOpen: (open: boolean) => void;
  setExportMarkdownOpen: (open: boolean) => void;
  setExportBackupOpen: (open: boolean) => void;
  setReportsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  aiDrawerOpen: false,
  settingsOpen: false,
  commandPaletteOpen: false,
  shortcutHelpOpen: false,
  exportMarkdownOpen: false,
  exportBackupOpen: false,
  reportsOpen: false,

  toggleAIDrawer: () => set((s) => ({ aiDrawerOpen: !s.aiDrawerOpen })),
  setAIDrawerOpen: (open) => set({ aiDrawerOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setShortcutHelpOpen: (open) => set({ shortcutHelpOpen: open }),
  setExportMarkdownOpen: (open) => set({ exportMarkdownOpen: open }),
  setExportBackupOpen: (open) => set({ exportBackupOpen: open }),
  setReportsOpen: (open) => set({ reportsOpen: open }),
}));

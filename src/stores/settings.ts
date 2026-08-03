/**
 * stores/settings.ts — 设置 store（Provider 管理见 PRD F6，M3 补全 UI）
 * 持久化：vt:v1:settings。API Key 仅存于此（localStorage，BYOK，PRD D3）。
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ProviderConfig, Settings } from '../types';
import { VT_KEYS, createRawValueStorage } from '../lib/storage';

interface SettingsState extends Settings {
  setSidebarCollapsed: (collapsed: boolean) => void;
  upsertProvider: (provider: ProviderConfig) => void;
  removeProvider: (id: string) => void;
  setActive: (providerId: string | null, model: string | null) => void;
  replaceAll: (settings: Settings) => void;
}

const DEFAULT_SETTINGS: Settings = {
  providers: [],
  activeProviderId: null,
  activeModel: null,
  sidebarCollapsed: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      upsertProvider: (provider) =>
        set((st) => {
          const exists = st.providers.some((p) => p.id === provider.id);
          return {
            providers: exists
              ? st.providers.map((p) => (p.id === provider.id ? provider : p))
              : [...st.providers, provider],
          };
        }),

      removeProvider: (id) => {
        const st = get();
        set({
          providers: st.providers.filter((p) => p.id !== id),
          // 删除当前生效的 Provider 时同时清空生效组合
          ...(st.activeProviderId === id ? { activeProviderId: null, activeModel: null } : {}),
        });
      },

      setActive: (providerId, model) => set({ activeProviderId: providerId, activeModel: model }),

      replaceAll: (settings) => set({ ...settings }),
    }),
    {
      name: VT_KEYS.settings,
      storage: createJSONStorage(() => createRawValueStorage()),
      partialize: (s) => ({
        providers: s.providers,
        activeProviderId: s.activeProviderId,
        activeModel: s.activeModel,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(typeof persisted === 'object' && persisted !== null ? persisted : {}),
      }),
    },
  ),
);

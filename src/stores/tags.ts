/**
 * stores/tags.ts — 思维方法标签 store（预设 + 自定义，PRD D4）
 * 持久化：vt:v1:tags（lib/storage 裸值桥接）。
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Tag, TagColor } from '../types';
import { VT_KEYS, createRawValueStorage } from '../lib/storage';

interface TagsState {
  tags: Tag[];
  addTag: (name: string, color: TagColor) => Tag;
  updateTag: (id: string, patch: Partial<Pick<Tag, 'name' | 'color'>>) => void;
  deleteTag: (id: string) => void;
  replaceAll: (tags: Tag[]) => void;
}

export const useTagsStore = create<TagsState>()(
  persist(
    (set) => ({
      tags: [],

      addTag: (name, color) => {
        const tag: Tag = { id: nanoid(), name, color, isPreset: false };
        set((st) => ({ tags: [...st.tags, tag] }));
        return tag;
      },

      updateTag: (id, patch) =>
        set((st) => ({ tags: st.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      deleteTag: (id) => set((st) => ({ tags: st.tags.filter((t) => t.id !== id) })),

      replaceAll: (tags) => set({ tags }),
    }),
    {
      name: VT_KEYS.tags,
      storage: createJSONStorage(() => createRawValueStorage()),
      partialize: (s) => s.tags,
      merge: (persisted, current) => ({
        ...current,
        tags: Array.isArray(persisted) ? (persisted as Tag[]) : current.tags,
      }),
    },
  ),
);

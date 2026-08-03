/**
 * stores/sessions.ts — 会话 / 思维链 store
 *
 * 职责：Session[] 的全部变更（会话 CRUD、输出块、断点、AI 讨论记录、
 * 复盘报告）。持久化经 lib/storage（vt:v1:sessions，500ms 防抖落盘）；
 * activeSessionId 单独镜像到 vt:v1:active-session（PRD 7.4 键设计）。
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { AIMessage, Block, ReviewReport, Session } from '../types';
import { VT_KEYS, localStorageAdapter, createRawValueStorage } from '../lib/storage';

function defaultSessionTitle(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `未命名会话 ${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

function patchSession(sessions: Session[], id: string, fn: (s: Session) => Session): Session[] {
  return sessions.map((s) => (s.id === id ? { ...fn(s), updatedAt: Date.now() } : s));
}

function patchBlock(blocks: Block[], blockId: string, fn: (b: Block) => Block): Block[] {
  return blocks.map((b) => (b.id === blockId ? fn(b) : b));
}

interface SessionsState {
  sessions: Session[];
  activeSessionId: string | null;

  // ── 会话 ──
  createSession: () => string;
  renameSession: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  moveSession: (id: string, targetIndex: number) => void;

  // ── 输出块 / 断点（作用于当前会话）──
  addOutputBlock: () => string | null;
  updateBlockContent: (blockId: string, content: string) => void;
  /** 退出编辑态：空块（从未有内容）则删除，保证空块不落盘 */
  finalizeBlock: (blockId: string) => void;
  setBlockTags: (blockId: string, tagIds: string[]) => void;
  deleteBlock: (blockId: string) => void;
  addBreakpoint: () => string | null;
  updateBreakpointNote: (blockId: string, note: string) => void;
  removeTagFromAllBlocks: (tagId: string) => void;

  // ── AI 讨论 / 复盘（M3/M4 使用，先随模型落地）──
  setInstructionPrompt: (sessionId: string, prompt: string) => void;
  addAIMessage: (sessionId: string, msg: AIMessage) => void;
  patchAIMessage: (sessionId: string, msgId: string, patch: Partial<AIMessage>) => void;
  clearAIThread: (sessionId: string) => void;
  addReport: (sessionId: string, content: string) => void;

  // ── 备份恢复（M2 使用）──
  replaceAll: (sessions: Session[], activeSessionId: string | null) => void;
}

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: localStorageAdapter.read<string | null>(VT_KEYS.activeSession),

      createSession: () => {
        const now = Date.now();
        const session: Session = {
          id: nanoid(),
          title: defaultSessionTitle(),
          sortOrder: Math.max(-1, ...get().sessions.map((s) => s.sortOrder)) + 1,
          blocks: [],
          aiThread: [],
          instructionPrompt: '',
          reports: [],
          createdAt: now,
          updatedAt: now,
        };
        set((st) => ({ sessions: [...st.sessions, session], activeSessionId: session.id }));
        return session.id;
      },

      renameSession: (id, title) =>
        set((st) => ({ sessions: patchSession(st.sessions, id, (s) => ({ ...s, title })) })),

      deleteSession: (id) =>
        set((st) => {
          const sessions = st.sessions.filter((s) => s.id !== id);
          const activeSessionId =
            st.activeSessionId === id
              ? ([...sessions].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.id ?? null)
              : st.activeSessionId;
          return { sessions, activeSessionId };
        }),

      setActiveSession: (id) => set({ activeSessionId: id }),

      moveSession: (id, targetIndex) =>
        set((st) => {
          const sorted = [...st.sessions].sort((a, b) => a.sortOrder - b.sortOrder);
          const from = sorted.findIndex((s) => s.id === id);
          if (from < 0) return st;
          const [moved] = sorted.splice(from, 1);
          if (!moved) return st;
          const clamped = Math.max(0, Math.min(targetIndex, sorted.length));
          sorted.splice(clamped, 0, moved);
          // 重排后重写 sortOrder 为连续序号，保证持久化稳定
          const reindexed = sorted.map((s, i) => ({ ...s, sortOrder: i }));
          return { sessions: reindexed };
        }),

      addOutputBlock: () => {
        const { activeSessionId } = get();
        if (!activeSessionId) return null;
        const now = Date.now();
        const block: Block = {
          id: nanoid(),
          kind: 'output',
          content: '',
          tagIds: [],
          createdAt: now,
          updatedAt: now,
        };
        set((st) => ({
          sessions: patchSession(st.sessions, activeSessionId, (s) => ({
            ...s,
            blocks: [...s.blocks, block],
          })),
        }));
        return block.id;
      },

      updateBlockContent: (blockId, content) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set((st) => ({
          sessions: patchSession(st.sessions, activeSessionId, (s) => ({
            ...s,
            blocks: patchBlock(s.blocks, blockId, (b) =>
              b.kind === 'output' ? { ...b, content, updatedAt: Date.now() } : b,
            ),
          })),
        }));
      },

      finalizeBlock: (blockId) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set((st) => ({
          sessions: patchSession(st.sessions, activeSessionId, (s) => ({
            ...s,
            blocks: s.blocks.filter((b) =>
              b.id === blockId ? !(b.kind === 'output' && b.content.trim() === '') : true,
            ),
          })),
        }));
      },

      setBlockTags: (blockId, tagIds) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set((st) => ({
          sessions: patchSession(st.sessions, activeSessionId, (s) => ({
            ...s,
            blocks: patchBlock(s.blocks, blockId, (b) =>
              b.kind === 'output' ? { ...b, tagIds } : b,
            ),
          })),
        }));
      },

      deleteBlock: (blockId) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set((st) => ({
          sessions: patchSession(st.sessions, activeSessionId, (s) => ({
            ...s,
            blocks: s.blocks.filter((b) => b.id !== blockId),
          })),
        }));
      },

      addBreakpoint: () => {
        const { activeSessionId } = get();
        if (!activeSessionId) return null;
        const block: Block = { id: nanoid(), kind: 'breakpoint', note: '', createdAt: Date.now() };
        set((st) => ({
          sessions: patchSession(st.sessions, activeSessionId, (s) => ({
            ...s,
            blocks: [...s.blocks, block],
          })),
        }));
        return block.id;
      },

      updateBreakpointNote: (blockId, note) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set((st) => ({
          sessions: patchSession(st.sessions, activeSessionId, (s) => ({
            ...s,
            blocks: patchBlock(s.blocks, blockId, (b) =>
              b.kind === 'breakpoint' ? { ...b, note } : b,
            ),
          })),
        }));
      },

      removeTagFromAllBlocks: (tagId) =>
        set((st) => ({
          sessions: st.sessions.map((s) => ({
            ...s,
            blocks: s.blocks.map((b) =>
              b.kind === 'output' ? { ...b, tagIds: b.tagIds.filter((t) => t !== tagId) } : b,
            ),
          })),
        })),

      setInstructionPrompt: (sessionId, prompt) =>
        set((st) => ({
          sessions: patchSession(st.sessions, sessionId, (s) => ({
            ...s,
            instructionPrompt: prompt,
          })),
        })),

      addAIMessage: (sessionId, msg) =>
        set((st) => ({
          sessions: patchSession(st.sessions, sessionId, (s) => ({
            ...s,
            aiThread: [...s.aiThread, msg],
          })),
        })),

      patchAIMessage: (sessionId, msgId, patch) =>
        set((st) => ({
          sessions: patchSession(st.sessions, sessionId, (s) => ({
            ...s,
            aiThread: s.aiThread.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
          })),
        })),

      clearAIThread: (sessionId) =>
        set((st) => ({
          sessions: patchSession(st.sessions, sessionId, (s) => ({ ...s, aiThread: [] })),
        })),

      addReport: (sessionId, content) =>
        set((st) => ({
          sessions: patchSession(st.sessions, sessionId, (s) => ({
            ...s,
            reports: [...s.reports, { id: nanoid(), content, createdAt: Date.now() } as ReviewReport],
          })),
        })),

      replaceAll: (sessions, activeSessionId) => set({ sessions, activeSessionId }),
    }),
    {
      name: VT_KEYS.sessions,
      storage: createJSONStorage(() => createRawValueStorage(500)),
      partialize: (s) => s.sessions,
      merge: (persisted, current) => ({
        ...current,
        sessions: Array.isArray(persisted) ? (persisted as Session[]) : current.sessions,
      }),
    },
  ),
);

// activeSessionId 镜像到独立键（PRD 7.4）
useSessionsStore.subscribe((s, prev) => {
  if (s.activeSessionId !== prev.activeSessionId) {
    localStorageAdapter.write(VT_KEYS.activeSession, s.activeSessionId);
  }
});

/** 按 sortOrder 排序的会话列表选择器 */
export function selectSortedSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => a.sortOrder - b.sortOrder);
}

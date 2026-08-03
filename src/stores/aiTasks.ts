/**
 * stores/aiTasks.ts — AI 生成任务的进行中状态（瞬时，不持久化）
 * 职责：让总结卡片 / 复盘弹层 / 命令面板多处能感知「正在生成」。
 */
import { create } from 'zustand';

interface AITasksState {
  /** 正在为哪个会话生成总结（null = 无） */
  summaryFor: string | null;
  /** 正在为哪个会话生成复盘报告 */
  reviewFor: string | null;
  setSummaryFor: (sessionId: string | null) => void;
  setReviewFor: (sessionId: string | null) => void;
}

export const useAITasksStore = create<AITasksState>((set) => ({
  summaryFor: null,
  reviewFor: null,
  setSummaryFor: (sessionId) => set({ summaryFor: sessionId }),
  setReviewFor: (sessionId) => set({ reviewFor: sessionId }),
}));

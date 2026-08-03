/**
 * aiActions.ts — 会话级 AI 动作（总结 / 复盘），供命令面板、会话菜单、
 * AI 抽屉卡片共用。不走 React 状态，直接读写 stores。
 */
import { useSessionsStore } from '../../stores/sessions';
import { useSettingsStore } from '../../stores/settings';
import { useTagsStore } from '../../stores/tags';
import { useAITasksStore } from '../../stores/aiTasks';
import { generateText, normalizeException } from '../../lib/ai';
import { buildReviewMessages, buildSummaryMessages } from '../../lib/prompts';

type ToastFn = (message: string, kind?: 'info' | 'success' | 'error') => void;

function activeProvider() {
  const { providers, activeProviderId, activeModel } = useSettingsStore.getState();
  const provider = providers.find((p) => p.id === activeProviderId) ?? null;
  return provider && activeModel ? { provider, model: activeModel } : null;
}

/** 生成（或重新生成）会话总结，结果存 session.summary，由 AI 抽屉顶部卡片展示 */
export async function runSummarize(sessionId: string, toast: ToastFn): Promise<void> {
  const active = activeProvider();
  if (!active) {
    toast('尚未配置模型，请先在设置页添加 Provider', 'error');
    return;
  }
  const session = useSessionsStore.getState().sessions.find((s) => s.id === sessionId);
  if (!session) return;
  if (session.blocks.length === 0) {
    toast('会话还没有内容，先写点想法再总结', 'error');
    return;
  }

  const aiTasks = useAITasksStore.getState();
  if (aiTasks.summaryFor) return; // 避免并发重复生成
  aiTasks.setSummaryFor(sessionId);
  try {
    const tags = useTagsStore.getState().tags;
    const text = await generateText(
      active.provider,
      active.model,
      buildSummaryMessages(session, tags),
    );
    useSessionsStore
      .getState()
      .setSummary(sessionId, { content: text.trim(), createdAt: Date.now() });
    toast('总结已生成', 'success');
  } catch (e) {
    toast(normalizeException(e).message, 'error');
  } finally {
    useAITasksStore.getState().setSummaryFor(null);
  }
}

/** 生成复盘报告，追加到 session.reports（历史报告保留，可再生成） */
export async function runReview(sessionId: string, toast: ToastFn): Promise<void> {
  const active = activeProvider();
  if (!active) {
    toast('尚未配置模型，请先在设置页添加 Provider', 'error');
    return;
  }
  const session = useSessionsStore.getState().sessions.find((s) => s.id === sessionId);
  if (!session) return;
  if (session.blocks.length === 0) {
    toast('会话还没有内容，先写点想法再复盘', 'error');
    return;
  }

  const aiTasks = useAITasksStore.getState();
  if (aiTasks.reviewFor) return;
  aiTasks.setReviewFor(sessionId);
  try {
    const tags = useTagsStore.getState().tags;
    const text = await generateText(
      active.provider,
      active.model,
      buildReviewMessages(session, tags),
    );
    useSessionsStore.getState().addReport(sessionId, text.trim());
    toast('复盘报告已生成', 'success');
  } catch (e) {
    toast(normalizeException(e).message, 'error');
  } finally {
    useAITasksStore.getState().setReviewFor(null);
  }
}

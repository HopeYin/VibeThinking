/**
 * AIDrawer — AI 讨论抽屉（PRD F5 / D2）
 *
 * - 右侧抽屉（400px，窄屏全屏覆盖），不离开思维流
 * - 上下文 = 完整思维链（每次请求携带序列化后的全部输出块 + 断点 + 标签）
 * - 流式输出 / 停止 / 重试上一条 / 清空对话（二次确认）
 * - 指令 prompt 会话级编辑；上下文指示常驻
 */
import { useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  ChevronDown,
  ChevronRight,
  Eraser,
  RotateCcw,
  SendHorizonal,
  Settings2,
  Square,
  X,
} from 'lucide-react';
import type { AIMessage, Session } from '../../types';
import { useSessionsStore } from '../../stores/sessions';
import { useSettingsStore } from '../../stores/settings';
import { useTagsStore } from '../../stores/tags';
import { useUIStore } from '../../stores/ui';
import { streamChat, normalizeException } from '../../lib/ai';
import { buildChainContext, buildDiscussionMessages, DEFAULT_INSTRUCTION_PROMPT } from '../../lib/prompts';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { IconButton } from '../ui/IconButton';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';
import { MarkdownView } from './MarkdownView';
import { SummaryCard } from './SummaryCard';

export function AIDrawer() {
  const open = useUIStore((s) => s.aiDrawerOpen);
  const setOpen = useUIStore((s) => s.setAIDrawerOpen);
  const sessions = useSessionsStore((s) => s.sessions);
  const activeSessionId = useSessionsStore((s) => s.activeSessionId);
  const session = sessions.find((s) => s.id === activeSessionId) ?? null;

  if (!open) return null;

  return (
    <aside className="fixed right-0 top-12 bottom-0 z-30 flex w-full flex-col border-l border-border bg-bg shadow-lg sm:w-[400px] animate-in slide-in-from-right duration-200">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold">AI 讨论</span>
        <IconButton label="关闭" onClick={() => setOpen(false)}>
          <X size={16} />
        </IconButton>
      </div>
      {session ? (
        <DrawerBody key={session.id} session={session} />
      ) : (
        <EmptyState title="先选择一个会话" description="AI 讨论基于当前会话的完整思维链。" />
      )}
    </aside>
  );
}

function DrawerBody({ session }: { session: Session }) {
  const tags = useTagsStore((s) => s.tags);
  const providers = useSettingsStore((s) => s.providers);
  const activeProviderId = useSettingsStore((s) => s.activeProviderId);
  const activeModel = useSettingsStore((s) => s.activeModel);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const toast = useToast();

  const addAIMessage = useSessionsStore((s) => s.addAIMessage);
  const removeAIMessage = useSessionsStore((s) => s.removeAIMessage);
  const patchAIMessage = useSessionsStore((s) => s.patchAIMessage);
  const clearAIThread = useSessionsStore((s) => s.clearAIThread);
  const setInstructionPrompt = useSessionsStore((s) => s.setInstructionPrompt);

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const provider = providers.find((p) => p.id === activeProviderId) ?? null;
  const configured = provider !== null && activeModel !== null;

  const ctx = buildChainContext(session, tags);

  // 新消息 / 流式增量时贴底
  const lastMsg = session.aiThread[session.aiThread.length - 1];
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [session.aiThread.length, lastMsg?.content]);

  /** 发起（或重发）一轮生成：history 为 placeholder 之前、状态为 done 的对话 */
  const runStream = async (assistantMsgId: string) => {
    if (!provider || !activeModel) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    try {
      const fresh = useSessionsStore.getState().sessions.find((s) => s.id === session.id);
      const history = (fresh?.aiThread ?? [])
        .filter((m) => m.id !== assistantMsgId && m.status === 'done')
        .map((m) => ({ role: m.role, content: m.content }));

      const messages = buildDiscussionMessages({
        session: fresh ?? session,
        tags,
        thread: history,
      });

      let accumulated = '';
      for await (const chunk of streamChat(provider, {
        messages,
        model: activeModel,
        signal: controller.signal,
      })) {
        accumulated += chunk.text;
        patchAIMessage(session.id, assistantMsgId, { content: accumulated });
      }
      patchAIMessage(session.id, assistantMsgId, { status: 'done' });
    } catch (e) {
      if (controller.signal.aborted) {
        patchAIMessage(session.id, assistantMsgId, { status: 'stopped' });
      } else {
        const err = normalizeException(e);
        patchAIMessage(session.id, assistantMsgId, { status: 'error' });
        toast(err.message, 'error');
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || streaming || !configured) return;
    setInput('');
    const now = Date.now();
    const userMsg: AIMessage = { id: nanoid(), role: 'user', content: text, status: 'done', createdAt: now };
    const aiMsg: AIMessage = { id: nanoid(), role: 'assistant', content: '', status: 'streaming', createdAt: now };
    addAIMessage(session.id, userMsg);
    addAIMessage(session.id, aiMsg);
    void runStream(aiMsg.id);
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  const retry = () => {
    if (streaming) return;
    // 重试上一条：删掉最近一条失败/停止的 assistant 消息，重新生成
    const thread = session.aiThread;
    const last = thread[thread.length - 1];
    if (last && last.role === 'assistant' && (last.status === 'error' || last.status === 'stopped')) {
      removeAIMessage(session.id, last.id);
      const aiMsg: AIMessage = {
        id: nanoid(),
        role: 'assistant',
        content: '',
        status: 'streaming',
        createdAt: Date.now(),
      };
      addAIMessage(session.id, aiMsg);
      void runStream(aiMsg.id);
    }
  };

  const lastFailed =
    session.aiThread[session.aiThread.length - 1]?.role === 'assistant' &&
    ['error', 'stopped'].includes(session.aiThread[session.aiThread.length - 1]?.status ?? '');

  if (!configured) {
    return (
      <EmptyState
        icon={<Settings2 size={28} />}
        title="还没有配置模型"
        description="AI 讨论需要自带 API Key（BYOK）。Key 只存在本机浏览器。"
        action={
          <Button size="sm" onClick={() => setSettingsOpen(true)}>
            去设置页配置
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <SummaryCard session={session} />
        {session.aiThread.length === 0 && (
          <p className="mt-8 text-center text-13 text-text-tertiary">
            我已经读过这条思维链。问点什么，或让我帮你挑漏洞。
          </p>
        )}
        <div className="flex flex-col gap-3">
          {session.aiThread.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-border px-3 pt-2 pb-3">
        {/* 指令 prompt 编辑（会话级持久化） */}
        <button
          onClick={() => setInstructionOpen((o) => !o)}
          className="mb-1.5 flex items-center gap-1 text-13 text-text-tertiary transition-colors hover:text-text-secondary"
        >
          {instructionOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          指令 prompt{session.instructionPrompt.trim() ? '（已自定义）' : ''}
        </button>
        {instructionOpen && (
          <Textarea
            value={session.instructionPrompt}
            onChange={(e) => setInstructionPrompt(session.id, e.target.value)}
            placeholder={DEFAULT_INSTRUCTION_PROMPT}
            className="mb-2 text-13"
          />
        )}

        {/* 上下文指示（PRD F5：常驻、透明可见） */}
        <p className="mb-1.5 text-13 text-text-tertiary">
          AI 已读取本会话 {ctx.outputCount} 个输出块 / {ctx.breakpointCount} 个断点
          {ctx.truncated && <span className="text-warning">（过长已截断）</span>}
        </p>

        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="继续思考…（Enter 发送，Shift+Enter 换行）"
            className="max-h-36 text-sm"
            fixedHeight={input.split('\n').length > 6}
          />
          {streaming ? (
            <IconButton label="停止生成" onClick={stop} className="mb-0.5 text-danger">
              <Square size={16} />
            </IconButton>
          ) : (
            <IconButton label="发送" onClick={send} disabled={!input.trim()} className="mb-0.5 text-accent">
              <SendHorizonal size={16} />
            </IconButton>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-3">
          {lastFailed && !streaming && (
            <button
              onClick={retry}
              className="inline-flex items-center gap-1 text-13 text-accent hover:underline"
            >
              <RotateCcw size={12} /> 重试上一条
            </button>
          )}
          <span className="flex-1" />
          {session.aiThread.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1 text-13 text-text-tertiary hover:text-text-secondary"
            >
              <Eraser size={12} /> 清空对话
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => clearAIThread(session.id)}
        title="清空对话"
        confirmText="清空"
      >
        仅清空 AI 讨论记录，思维流（输出块 / 断点）不受影响。
      </ConfirmDialog>
    </>
  );
}

function MessageBubble({ msg }: { msg: AIMessage }) {
  if (msg.role === 'user') {
    return (
      <div className="self-end max-w-[85%] rounded-md bg-accent-subtle px-3 py-2">
        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
      </div>
    );
  }
  return (
    <div
      className={cn(
        'self-start max-w-[92%] rounded-md bg-bg-subtle px-3 py-2',
        msg.status === 'error' && 'border border-danger/40',
      )}
    >
      {msg.content ? (
        <MarkdownView content={msg.content} />
      ) : msg.status === 'streaming' ? (
        <span className="text-text-tertiary">思考中…</span>
      ) : (
        <span className="text-text-tertiary">（无内容）</span>
      )}
      {msg.status === 'streaming' && msg.content && (
        <span className="ml-0.5 inline-block animate-pulse text-text-tertiary">▍</span>
      )}
      {msg.status === 'error' && (
        <p className="mt-1 text-13 text-danger">生成失败，可点下方「重试上一条」。</p>
      )}
      {msg.status === 'stopped' && <p className="mt-1 text-13 text-text-tertiary">已停止生成。</p>}
    </div>
  );
}

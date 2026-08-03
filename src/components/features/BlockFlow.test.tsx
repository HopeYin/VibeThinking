/**
 * 关键组件交互测试（PRD 测试策略：组件只测关键交互）
 * - 输出块空内容不保存（退出编辑态即删除）
 * - 500 块思维流渲染不崩（性能冒烟）
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OutputBlockItem } from './OutputBlockItem';
import { BlockList } from './BlockList';
import { useSessionsStore } from '../../stores/sessions';
import type { OutputBlock, Session } from '../../types';

// jsdom 没有 scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

function makeSession(blocks: OutputBlock[]): Session {
  return {
    id: 's1',
    title: '测试会话',
    sortOrder: 0,
    blocks,
    aiThread: [],
    instructionPrompt: '',
    reports: [],
    createdAt: 0,
    updatedAt: 0,
  };
}

const emptyBlock: OutputBlock = {
  id: 'b-empty',
  kind: 'output',
  content: '',
  tagIds: [],
  createdAt: 1,
  updatedAt: 1,
};

beforeEach(() => {
  window.localStorage.clear();
  useSessionsStore.setState({ sessions: [], activeSessionId: null });
});

describe('输出块空内容不保存', () => {
  it('空块退出编辑态（失焦）后被删除', () => {
    useSessionsStore.setState({
      sessions: [makeSession([emptyBlock])],
      activeSessionId: 's1',
    });
    render(<OutputBlockItem block={emptyBlock} />);

    const textarea = screen.getByPlaceholderText(/写下你的想法/);
    fireEvent.blur(textarea);

    const session = useSessionsStore.getState().sessions[0];
    expect(session?.blocks).toHaveLength(0);
  });

  it('写入内容后失焦，块保留且内容已保存', () => {
    useSessionsStore.setState({
      sessions: [makeSession([emptyBlock])],
      activeSessionId: 's1',
    });
    render(<OutputBlockItem block={emptyBlock} />);

    const textarea = screen.getByPlaceholderText(/写下你的想法/);
    fireEvent.change(textarea, { target: { value: '第一个想法' } });
    fireEvent.blur(textarea);

    const session = useSessionsStore.getState().sessions[0];
    expect(session?.blocks).toHaveLength(1);
    expect(session?.blocks[0]?.kind === 'output' && session.blocks[0].content).toBe('第一个想法');
  });
});

describe('思维流性能冒烟', () => {
  it('500 个输出块渲染不崩', () => {
    const blocks: OutputBlock[] = Array.from({ length: 500 }, (_, i) => ({
      id: `b${i}`,
      kind: 'output' as const,
      content: `想法 ${i}`,
      tagIds: [],
      createdAt: i,
      updatedAt: i,
    }));
    const session = makeSession(blocks);
    render(<BlockList session={session} />);
    expect(screen.getByText('想法 0')).toBeInTheDocument();
    expect(screen.getByText('想法 499')).toBeInTheDocument();
  });
});

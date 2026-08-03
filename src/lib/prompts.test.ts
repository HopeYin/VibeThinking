/**
 * prompts 层单测：思维链截断策略（PRD 7.6.1 / M4 验收）、标签建议解析
 */
import { describe, expect, it } from 'vitest';
import { buildChainContext, parseTagSuggestions, CHAIN_CHAR_LIMIT } from './prompts';
import type { OutputBlock, Session, Tag } from '../types';

const tags: Tag[] = [{ id: 't1', name: '反思', color: 'gray', isPreset: true }];

function makeSession(blockCount: number, contentSize: number): Session {
  const blocks: OutputBlock[] = Array.from({ length: blockCount }, (_, i) => ({
    id: `b${i}`,
    kind: 'output' as const,
    content: `第${i}块：` + '想'.repeat(contentSize),
    tagIds: i === 0 ? ['t1'] : [],
    createdAt: i,
    updatedAt: i,
  }));
  return {
    id: 's1',
    title: '长会话',
    sortOrder: 0,
    blocks,
    aiThread: [],
    instructionPrompt: '',
    reports: [],
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('buildChainContext 截断策略', () => {
  it('短会话不截断，包含全部块', () => {
    const session = makeSession(3, 50);
    const ctx = buildChainContext(session, tags);
    expect(ctx.truncated).toBe(false);
    expect(ctx.system).toContain('第0块');
    expect(ctx.system).toContain('第2块');
    expect(ctx.outputCount).toBe(3);
  });

  it('超长会话：截断、保留最近 5 块全文与最早 2 块', () => {
    // 30 块 × 1000 字 ≈ 30000+ 字符，远超 12000 上限
    const session = makeSession(30, 1000);
    const ctx = buildChainContext(session, tags);

    expect(ctx.truncated).toBe(true);
    expect(ctx.system).toContain('已截断');
    // 最近 5 块全文保留
    expect(ctx.system).toContain('第29块');
    expect(ctx.system).toContain('第25块');
    // 最早 2 块保留
    expect(ctx.system).toContain('第0块');
    expect(ctx.system).toContain('第1块');
    // 中间块被省略，且有省略提示
    expect(ctx.system).not.toContain('第10块');
    expect(ctx.system).toContain('省略');
    // 截断后明显变短
    expect(ctx.system.length).toBeLessThan(CHAIN_CHAR_LIMIT + 5000);
  });

  it('提供早期总结时用总结代替最早块', () => {
    const session = makeSession(30, 1000);
    const ctx = buildChainContext(session, tags, '早期在讨论方向选择');
    expect(ctx.system).toContain('【早期思维内容总结】早期在讨论方向选择');
    expect(ctx.system).not.toContain('第1块');
  });
});

describe('parseTagSuggestions', () => {
  it('解析标准 JSON', () => {
    expect(parseTagSuggestions('{"suggestions": ["反思", "类比"]}')).toEqual(['反思', '类比']);
  });

  it('容错：JSON 前后有多余文本', () => {
    expect(parseTagSuggestions('好的！{"suggestions": ["反思"]} 希望有帮助')).toEqual(['反思']);
  });

  it('最多取 3 个，非字符串项被过滤', () => {
    expect(parseTagSuggestions('{"suggestions": ["a","b","c","d",1]}')).toEqual(['a', 'b', 'c']);
  });

  it('无 JSON 或结构错误时抛出', () => {
    expect(() => parseTagSuggestions('我不知道')).toThrow();
    expect(() => parseTagSuggestions('{"foo": []}')).toThrow();
  });
});

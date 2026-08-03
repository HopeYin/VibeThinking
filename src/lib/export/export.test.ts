/**
 * export 层单测：Markdown 生成、备份脱敏与解析往返
 */
import { describe, expect, it } from 'vitest';
import { sessionToMarkdown } from './markdown';
import { buildBackup, parseBackup } from './backup';
import type { ProviderConfig, Session, Settings, Tag } from '../../types';

const tags: Tag[] = [
  { id: 't1', name: '第一性原理', color: 'blue', isPreset: true },
  { id: 't2', name: '反思', color: 'gray', isPreset: true },
];

const session: Session = {
  id: 's1',
  title: '关于机器人专业的思考',
  sortOrder: 0,
  blocks: [
    {
      id: 'b1',
      kind: 'output',
      content: '我到底想做什么方向？',
      tagIds: ['t1'],
      createdAt: new Date(2026, 7, 3, 14, 32).getTime(),
      updatedAt: new Date(2026, 7, 3, 14, 32).getTime(),
    },
    { id: 'b2', kind: 'breakpoint', note: '第一阶段：问题定义完毕', createdAt: Date.now() },
    {
      id: 'b3',
      kind: 'output',
      content: '先列出所有可能的方向再排除。',
      tagIds: [],
      createdAt: new Date(2026, 7, 3, 15, 1).getTime(),
      updatedAt: new Date(2026, 7, 3, 15, 1).getTime(),
    },
  ],
  aiThread: [
    { id: 'm1', role: 'user', content: '帮我看看盲区', status: 'done', createdAt: Date.now() },
    { id: 'm2', role: 'assistant', content: '你忽略了…', status: 'done', createdAt: Date.now() },
  ],
  instructionPrompt: '',
  reports: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const provider: ProviderConfig = {
  id: 'p1',
  name: 'DeepSeek',
  apiFormat: 'openai-chat',
  baseUrl: 'https://api.deepseek.com',
  apiKey: 'sk-secret',
  models: ['deepseek-chat'],
  defaultModel: 'deepseek-chat',
};

const settings: Settings = {
  providers: [provider],
  activeProviderId: 'p1',
  activeModel: 'deepseek-chat',
  sidebarCollapsed: false,
};

describe('sessionToMarkdown', () => {
  it('包含标题、标签、断点备注', () => {
    const md = sessionToMarkdown(session, tags, { includeAIThread: false });
    expect(md).toContain('# 关于机器人专业的思考');
    expect(md).toContain('标签：第一性原理');
    expect(md).toContain('标签：无');
    expect(md).toContain('**▍断点** 第一阶段：问题定义完毕');
    expect(md).not.toContain('AI 讨论记录');
  });

  it('勾选后附 AI 讨论记录', () => {
    const md = sessionToMarkdown(session, tags, { includeAIThread: true });
    expect(md).toContain('## AI 讨论记录');
    expect(md).toContain('**用户 ·');
    expect(md).toContain('**AI ·');
  });
});

describe('全局备份', () => {
  it('默认脱敏 API Key', () => {
    const backup = buildBackup({ sessions: [session], tags, settings, includeApiKey: false, appVersion: '0.1.0' });
    expect(backup.settings.providers[0]?.apiKey).toBe('');
    expect(backup.includesApiKey).toBe(false);
  });

  it('显式勾选时保留 API Key', () => {
    const backup = buildBackup({ sessions: [session], tags, settings, includeApiKey: true, appVersion: '0.1.0' });
    expect(backup.settings.providers[0]?.apiKey).toBe('sk-secret');
  });

  it('导出 → 解析无损往返', () => {
    const backup = buildBackup({ sessions: [session], tags, settings, includeApiKey: false, appVersion: '0.1.0' });
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.sessions).toEqual([session]);
      expect(parsed.data.tags).toEqual(tags);
    }
  });

  it('拒绝垃圾 JSON 与非本应用文件', () => {
    expect(parseBackup('{oops').ok).toBe(false);
    expect(parseBackup('{"app":"other"}').ok).toBe(false);
  });

  it('拒绝版本不兼容的备份', () => {
    const backup = buildBackup({ sessions: [], tags: [], settings, includeApiKey: false, appVersion: '0.1.0' });
    const wrong = { ...backup, schemaVersion: 999 };
    const parsed = parseBackup(JSON.stringify(wrong));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain('不兼容');
  });
});

/**
 * storage 层单测：适配器读写、迁移框架、预设标签播种、裸值持久化桥接
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { localStorageAdapter as adapter } from './adapter';
import { VT_KEYS } from './keys';
import { runMigrations, CURRENT_SCHEMA_VERSION } from './migrate';
import { bootstrapStorage } from './bootstrap';
import { createRawValueStorage } from './persist';
import type { Session, Tag } from '../../types';

beforeEach(() => {
  window.localStorage.clear();
});

describe('localStorageAdapter', () => {
  it('写入后可读回（roundtrip）', () => {
    adapter.write('k', { a: 1, b: ['x'] });
    expect(adapter.read('k')).toEqual({ a: 1, b: ['x'] });
  });

  it('读取不存在的键返回 null', () => {
    expect(adapter.read('missing')).toBeNull();
  });

  it('JSON 损坏时返回 null 而不是抛出', () => {
    window.localStorage.setItem('bad', '{oops');
    expect(adapter.read('bad')).toBeNull();
  });

  it('keysWithPrefix 只列前缀匹配的键', () => {
    adapter.write('vt:v1:a', 1);
    adapter.write('other:b', 2);
    expect(adapter.keysWithPrefix('vt:')).toEqual(['vt:v1:a']);
  });
});

describe('runMigrations', () => {
  it('首次启动写入当前版本 meta', () => {
    runMigrations();
    const meta = adapter.read<{ schemaVersion: number }>(VT_KEYS.meta);
    expect(meta?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('有数据无 meta：备份到 legacy-backup 并重新初始化', () => {
    adapter.write(VT_KEYS.sessions, [{ id: 's1' }]);
    runMigrations();
    expect(adapter.read(VT_KEYS.sessions)).toBeNull();
    const backup = adapter.read<Record<string, unknown>>(VT_KEYS.legacyBackup);
    expect(backup?.[VT_KEYS.sessions]).toEqual([{ id: 's1' }]);
    expect(adapter.read<{ schemaVersion: number }>(VT_KEYS.meta)?.schemaVersion).toBe(
      CURRENT_SCHEMA_VERSION,
    );
  });

  it('schema 版本过新：备份并重置，不带着看不懂的数据跑', () => {
    adapter.write(VT_KEYS.meta, { schemaVersion: 99, appVersion: 'x' });
    adapter.write(VT_KEYS.tags, [{ id: 't1' }]);
    runMigrations();
    expect(adapter.read(VT_KEYS.tags)).toBeNull();
    expect(adapter.read<Record<string, unknown>>(VT_KEYS.legacyBackup)?.[VT_KEYS.tags]).toEqual([
      { id: 't1' },
    ]);
  });

  it('版本一致时不动任何数据', () => {
    adapter.write(VT_KEYS.meta, { schemaVersion: CURRENT_SCHEMA_VERSION, appVersion: '0.1.0' });
    adapter.write(VT_KEYS.tags, [{ id: 'keep' }]);
    runMigrations();
    expect(adapter.read(VT_KEYS.tags)).toEqual([{ id: 'keep' }]);
  });
});

describe('bootstrapStorage', () => {
  it('首次启动写入 8 个预设标签', () => {
    bootstrapStorage();
    const tags = adapter.read<Tag[]>(VT_KEYS.tags);
    expect(tags).toHaveLength(8);
    expect(tags?.map((t) => t.name)).toContain('第一性原理');
    expect(tags?.every((t) => t.isPreset)).toBe(true);
  });

  it('幂等：二次执行不重复播种', () => {
    bootstrapStorage();
    const first = adapter.read<Tag[]>(VT_KEYS.tags);
    bootstrapStorage();
    expect(adapter.read<Tag[]>(VT_KEYS.tags)).toEqual(first);
  });
});

describe('createRawValueStorage（zustand persist 裸值桥接）', () => {
  it('setItem 落盘的是裸业务数据而非 {state,version} 信封', async () => {
    const storage = createRawValueStorage();
    const sessions: Session[] = [
      {
        id: 's1',
        title: '测试',
        sortOrder: 0,
        blocks: [],
        aiThread: [],
        instructionPrompt: '',
        reports: [],
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    storage.setItem(VT_KEYS.sessions, JSON.stringify({ state: sessions, version: 0 }));
    // localStorage 里应直接是 Session[]
    expect(adapter.read<Session[]>(VT_KEYS.sessions)?.[0]?.title).toBe('测试');
    // getItem 再包装回信封供 persist 使用
    const wrapped = await storage.getItem(VT_KEYS.sessions);
    expect(wrapped).not.toBeNull();
    expect(JSON.parse(String(wrapped))).toEqual({ state: sessions, version: 0 });
  });

  it('getItem 空键返回 null', () => {
    expect(createRawValueStorage().getItem('nope')).toBeNull();
  });
});

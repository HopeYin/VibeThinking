/**
 * lib/storage/bootstrap.ts — 启动引导（main.tsx 首行副作用导入）
 *
 * 职责：在任何 store 水合之前完成两件事——
 * 1. 跑 schema 迁移（见 migrate.ts）；
 * 2. 首次启动写入预设思维方法标签（PRD F3，可改可删）。
 */
import { nanoid } from 'nanoid';
import type { Tag, TagColor } from '../../types';
import { localStorageAdapter as adapter } from './adapter';
import { VT_KEYS } from './keys';
import { runMigrations } from './migrate';

const PRESET_TAGS: Array<{ name: string; color: TagColor }> = [
  { name: '第一性原理', color: 'blue' },
  { name: '逆向思考', color: 'red' },
  { name: '类比', color: 'purple' },
  { name: '系统思考', color: 'green' },
  { name: '概率思维', color: 'yellow' },
  { name: '机会成本', color: 'orange' },
  { name: '二八法则', color: 'pink' },
  { name: '反思', color: 'gray' },
];

export function bootstrapStorage(): void {
  runMigrations();

  const existing = adapter.read<Tag[]>(VT_KEYS.tags);
  if (!existing || existing.length === 0) {
    const presets: Tag[] = PRESET_TAGS.map((t) => ({
      id: nanoid(),
      name: t.name,
      color: t.color,
      isPreset: true,
    }));
    adapter.write(VT_KEYS.tags, presets);
  }
}

// 模块副作用：保证在 stores 水合前执行（main.tsx 须最先导入本模块）
bootstrapStorage();

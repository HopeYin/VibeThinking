/**
 * lib/storage/persist.ts — Zustand persist 的「裸值」存储桥接
 *
 * 职责：让 zustand persist 中间件直接读写 PRD 7.4 规定的键值形态
 * （vt:v1:sessions → Session[]），而不是 persist 默认的
 * { state, version } 信封。这样备份/调试时 localStorage 里的数据
 * 就是纯粹的业务数据。
 *
 * 另提供防抖包装：块编辑场景每 keystroke 都触发持久化，500ms 防抖
 * 落盘减少写入放大；页面隐藏/关闭前强制 flush，避免丢最后几百毫秒。
 */
import type { StateStorage } from 'zustand/middleware';
import { localStorageAdapter } from './adapter';

export function createRawValueStorage(debounceMs = 0): StateStorage {
  const pending = new Map<string, string>();

  const writeNow = (key: string, value: string) => {
    try {
      const parsed = JSON.parse(value) as { state: unknown };
      localStorageAdapter.write(key, parsed.state);
    } catch {
      // persist 传来的值不合预期时不写，保持旧数据
    }
  };

  if (debounceMs > 0 && typeof window !== 'undefined') {
    const flush = () => {
      for (const [key, value] of pending) writeNow(key, value);
      pending.clear();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
  }

  let timer: number | undefined;

  return {
    getItem: (key) => {
      const raw = localStorageAdapter.read<unknown>(key);
      return raw === null ? null : JSON.stringify({ state: raw, version: 0 });
    },
    setItem: (key, value) => {
      if (debounceMs <= 0) {
        writeNow(key, value);
        return;
      }
      pending.set(key, value);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        for (const [k, v] of pending) writeNow(k, v);
        pending.clear();
      }, debounceMs);
    },
    removeItem: (key) => {
      pending.delete(key);
      localStorageAdapter.remove(key);
    },
  };
}

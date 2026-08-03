/**
 * lib/storage/adapter.ts — 存储适配层（可复用资产）
 *
 * 职责：UI 与 localStorage 之间的唯一通道（架构红线：UI 不直接碰 localStorage）。
 * 接口刻意保持最小（read/write/remove），未来可平替为 IndexedDB 实现
 * 而不影响上层。所有读写均为 JSON 序列化，解析失败返回 null 而不是抛出。
 */
export interface StorageAdapter {
  read<T>(key: string): T | null;
  write<T>(key: string, value: T): void;
  remove(key: string): void;
  /** 列出指定前缀的全部键（用于占用估算、备份） */
  keysWithPrefix(prefix: string): string[];
}

export const localStorageAdapter: StorageAdapter = {
  read<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      // 数据损坏时按「无数据」处理，避免整站白屏；备份/迁移层另有兜底
      return null;
    }
  },
  write<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 容量超限等写入失败：静默吞掉会让用户丢数据，但此处无法补救，
      // 交由调用方（导出备份提醒）兜底。见 PRD 7.4 容量注意。
    }
  },
  remove(key: string): void {
    window.localStorage.removeItem(key);
  },
  keysWithPrefix(prefix: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(prefix)) keys.push(k);
    }
    return keys;
  },
};

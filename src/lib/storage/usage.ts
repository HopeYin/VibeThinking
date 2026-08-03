/**
 * lib/storage/usage.ts — localStorage 占用估算（PRD 7.4：设置页展示）
 */
import { localStorageAdapter as adapter } from './adapter';
import { VT_KEY_PREFIX } from './keys';

export function estimateStorageUsage(): { bytes: number; text: string } {
  let bytes = 0;
  for (const key of adapter.keysWithPrefix(VT_KEY_PREFIX)) {
    const raw = window.localStorage.getItem(key) ?? '';
    bytes += (key.length + raw.length) * 2; // UTF-16 每字符 2 字节
  }
  const text =
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return { bytes, text };
}

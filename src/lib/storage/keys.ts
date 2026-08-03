/**
 * lib/storage/keys.ts — localStorage 键空间（vt:v1:*，与旧版 vibethinking:* 无关）
 * 职责：集中管理全部键名，禁止在业务代码里散落字符串。
 */
export const VT_KEYS = {
  meta: 'vt:v1:meta',
  sessions: 'vt:v1:sessions',
  tags: 'vt:v1:tags',
  settings: 'vt:v1:settings',
  activeSession: 'vt:v1:active-session',
  legacyBackup: 'vt:v1:legacy-backup',
} as const;

export const VT_KEY_PREFIX = 'vt:v1:';

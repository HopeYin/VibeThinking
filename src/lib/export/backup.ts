/**
 * lib/export/backup.ts — 全局 JSON 备份 / 恢复（PRD F11）
 *
 * 红线（PRD D3）：默认不含 API Key，仅在用户显式勾选时包含。
 * 恢复前由调用方强制先自动下载一份当前数据备份。
 */
import type { Session, Settings, Tag } from '../../types';
import { CURRENT_SCHEMA_VERSION } from '../storage/migrate';
import { dateSlug } from './download';

export interface BackupFile {
  app: 'vibethinking';
  schemaVersion: number;
  appVersion: string;
  exportedAt: number;
  includesApiKey: boolean;
  sessions: Session[];
  tags: Tag[];
  settings: Settings;
}

export function buildBackup(input: {
  sessions: Session[];
  tags: Tag[];
  settings: Settings;
  includeApiKey: boolean;
  appVersion: string;
}): BackupFile {
  const settings: Settings = input.includeApiKey
    ? input.settings
    : {
        ...input.settings,
        // Key 脱敏：备份文件默认不携带任何 API Key
        providers: input.settings.providers.map((p) => ({ ...p, apiKey: '' })),
      };

  return {
    app: 'vibethinking',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appVersion: input.appVersion,
    exportedAt: Date.now(),
    includesApiKey: input.includeApiKey,
    sessions: input.sessions,
    tags: input.tags,
    settings,
  };
}

export type ParseBackupResult =
  | { ok: true; data: BackupFile }
  | { ok: false; error: string };

export function parseBackup(text: string): ParseBackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: '文件不是合法的 JSON' };
  }
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: '备份内容结构不正确' };
  }
  const data = raw as Partial<BackupFile>;
  if (data.app !== 'vibethinking') {
    return { ok: false, error: '这不是 VibeThinking 的备份文件' };
  }
  if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `备份版本（v${String(data.schemaVersion)}）与当前应用（v${CURRENT_SCHEMA_VERSION}）不兼容`,
    };
  }
  if (!Array.isArray(data.sessions) || !Array.isArray(data.tags) || !data.settings) {
    return { ok: false, error: '备份文件缺少必要数据（sessions / tags / settings）' };
  }
  return { ok: true, data: data as BackupFile };
}

export function backupFilename(prefix = 'vibethinking-backup'): string {
  return `${prefix}-${dateSlug()}.json`;
}

/**
 * lib/storage/migrate.ts — schema 版本迁移框架（可复用资产）
 *
 * 职责：应用启动时校验 vt:v1:meta 的 schemaVersion，按迁移表逐版升级。
 * 无迁移路径（版本过新 / 缺 meta 却有数据 / 表断档）时，先把旧数据整体
 * 备份到 vt:v1:legacy-backup，再按当前版本重新初始化——宁可让用户从
 * 备份恢复，也不带着看不懂的数据继续跑。
 *
 * 新增迁移：把「升级到版本 N」的函数登记进 MIGRATIONS[N]，并把
 * CURRENT_SCHEMA_VERSION 改为 N。
 */
import type { StorageMeta } from '../../types';
import { localStorageAdapter as adapter } from './adapter';
import { VT_KEYS } from './keys';

export const CURRENT_SCHEMA_VERSION = 1;
export const APP_VERSION = '0.1.0';

/** key = 目标版本号；value = 从 (key-1) 升级到 key 的迁移函数 */
const MIGRATIONS: Record<number, () => void> = {
  // 示例：2: () => { /* v1 → v2 的字段变更 */ },
};

function writeMeta(): void {
  const meta: StorageMeta = { schemaVersion: CURRENT_SCHEMA_VERSION, appVersion: APP_VERSION };
  adapter.write(VT_KEYS.meta, meta);
}

/** 无迁移路径时的兜底：备份全部 vt 数据后清空（meta 除外，由调用方重写） */
function backupAndReset(reason: string): void {
  const backup: Record<string, unknown> = {
    __reason: reason,
    __backedUpAt: Date.now(),
  };
  for (const key of adapter.keysWithPrefix('vt:')) {
    backup[key] = adapter.read<unknown>(key);
  }
  adapter.write(VT_KEYS.legacyBackup, backup);
  for (const key of adapter.keysWithPrefix('vt:')) {
    if (key !== VT_KEYS.legacyBackup) adapter.remove(key);
  }
}

export function runMigrations(): void {
  const meta = adapter.read<StorageMeta>(VT_KEYS.meta);

  // 首次启动：无 meta 也无数据 → 直接写 meta
  if (!meta) {
    const hasData = adapter.keysWithPrefix('vt:').some((k) => k !== VT_KEYS.legacyBackup);
    if (hasData) {
      // 有数据却没 meta：来源不明（旧版/手动写入），无迁移路径
      backupAndReset('data-without-meta');
    }
    writeMeta();
    return;
  }

  if (meta.schemaVersion === CURRENT_SCHEMA_VERSION) return;

  if (meta.schemaVersion > CURRENT_SCHEMA_VERSION) {
    // 数据来自更新版本的应用，无法降级理解
    backupAndReset(`schema-too-new:${meta.schemaVersion}`);
    writeMeta();
    return;
  }

  // 逐版升级
  let version = meta.schemaVersion;
  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version + 1];
    if (!migrate) {
      backupAndReset(`missing-migration:${version + 1}`);
      writeMeta();
      return;
    }
    migrate();
    version += 1;
  }
  writeMeta();
}

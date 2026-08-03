/**
 * ImportButton — 顶栏「导入」：JSON 备份恢复（PRD F11）
 *
 * 流程：选择文件 → 校验 schema 版本 → 预览数量 → 确认后【先自动下载
 * 当前数据备份】再整体替换。任何一步失败都不动现有数据。
 */
import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useSessionsStore } from '../../stores/sessions';
import { useTagsStore } from '../../stores/tags';
import { useSettingsStore } from '../../stores/settings';
import { useToast } from '../ui/Toast';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { backupFilename, buildBackup, downloadTextFile, parseBackup } from '../../lib/export';
import type { BackupFile } from '../../lib/export';
import { APP_VERSION } from '../../lib/storage/migrate';

export const IMPORT_INPUT_ID = 'vt-import-file-input';

export function ImportButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const toast = useToast();

  const onFilePicked = async (file: File) => {
    const text = await file.text();
    const result = parseBackup(text);
    if (!result.ok) {
      toast(`导入失败：${result.error}`, 'error');
      return;
    }
    setPending(result.data);
  };

  const confirmRestore = () => {
    if (!pending) return;

    // 强制先自动下载一份当前数据备份（PRD F11）
    const sessions = useSessionsStore.getState().sessions;
    const tags = useTagsStore.getState().tags;
    const settings = useSettingsStore.getState();
    const current = buildBackup({
      sessions,
      tags,
      settings: {
        providers: settings.providers,
        activeProviderId: settings.activeProviderId,
        activeModel: settings.activeModel,
        sidebarCollapsed: settings.sidebarCollapsed,
      },
      includeApiKey: true, // 自救备份必须完整，否则 Key 会丢
      appVersion: APP_VERSION,
    });
    downloadTextFile(
      backupFilename('vibethinking-before-import'),
      JSON.stringify(current, null, 2),
    );

    // 整体替换
    useSessionsStore
      .getState()
      .replaceAll(
        pending.sessions,
        [...pending.sessions].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.id ?? null,
      );
    useTagsStore.getState().replaceAll(pending.tags);
    useSettingsStore.getState().replaceAll(pending.settings);

    setPending(null);
    toast(`已恢复 ${pending.sessions.length} 个会话（原数据已自动备份下载）`, 'success');
  };

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-13 text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text"
      >
        <Upload size={14} />
        导入
      </button>
      <input
        id={IMPORT_INPUT_ID}
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFilePicked(file);
          e.target.value = ''; // 允许重复选同一文件
        }}
      />

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title="恢复备份"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmRestore}>
              整体替换并恢复
            </Button>
          </>
        }
      >
        {pending && (
          <div className="space-y-3 py-1 text-sm">
            <p>
              备份包含 <strong>{pending.sessions.length}</strong> 个会话、
              <strong>{pending.tags.length}</strong> 个标签、
              <strong>{pending.settings.providers.length}</strong> 个模型服务
              {pending.includesApiKey ? '（含 API Key）' : ''}。
            </p>
            <p className="text-13 text-warning">
              恢复将整体替换当前全部数据。点击确认前会自动下载一份当前数据的完整备份 （含 API
              Key）到本机，用于反悔。
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
}

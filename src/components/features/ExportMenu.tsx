/**
 * ExportMenu — 顶栏「导出」菜单（PRD F10/F11）
 *
 * - 导出当前会话为 Markdown（可选附 AI 讨论记录）
 * - 导出全局 JSON 备份（默认不含 API Key，显式勾选才包含）
 */
import { useState } from 'react';
import { Download, FileJson, FileText } from 'lucide-react';
import { useSessionsStore } from '../../stores/sessions';
import { useTagsStore } from '../../stores/tags';
import { useSettingsStore } from '../../stores/settings';
import { useUIStore } from '../../stores/ui';
import { useToast } from '../ui/Toast';
import { Popover } from '../ui/Popover';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import {
  backupFilename,
  buildBackup,
  downloadTextFile,
  sanitizeFilename,
  sessionToMarkdown,
} from '../../lib/export';
import { APP_VERSION } from '../../lib/storage/migrate';

export function ExportMenu() {
  const setExportMarkdownOpen = useUIStore((s) => s.setExportMarkdownOpen);
  const setExportBackupOpen = useUIStore((s) => s.setExportBackupOpen);

  return (
    <>
      <Popover
        align="right"
        trigger={
          <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-13 text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text">
            <Download size={14} />
            导出
          </span>
        }
      >
        {(close) => (
          <div className="w-56 p-1">
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-bg-muted"
              onClick={() => {
                setExportMarkdownOpen(true);
                close();
              }}
            >
              <FileText size={14} className="text-text-tertiary" />
              当前会话 → Markdown
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-bg-muted"
              onClick={() => {
                setExportBackupOpen(true);
                close();
              }}
            >
              <FileJson size={14} className="text-text-tertiary" />
              全部数据 → JSON 备份
            </button>
          </div>
        )}
      </Popover>

      <ExportMarkdownDialog />
      <ExportBackupDialog />
    </>
  );
}

// ── 会话 → Markdown ─────────────────────────────────────────

function ExportMarkdownDialog() {
  const open = useUIStore((s) => s.exportMarkdownOpen);
  const onClose = () => useUIStore.getState().setExportMarkdownOpen(false);
  const sessions = useSessionsStore((s) => s.sessions);
  const activeSessionId = useSessionsStore((s) => s.activeSessionId);
  const tags = useTagsStore((s) => s.tags);
  const toast = useToast();
  const [includeAI, setIncludeAI] = useState(false);

  const session = sessions.find((s) => s.id === activeSessionId);

  const doExport = () => {
    if (!session) return;
    const md = sessionToMarkdown(session, tags, { includeAIThread: includeAI });
    downloadTextFile(`${sanitizeFilename(session.title)}.md`, md, 'text/markdown');
    toast('已导出 Markdown', 'success');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="导出当前会话"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={doExport} disabled={!session}>
            导出 .md
          </Button>
        </>
      }
    >
      {session ? (
        <div className="space-y-3 py-1">
          <p className="text-sm">
            将「{session.title}」导出为 Markdown 文件（含全部输出块、标签与断点）。
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={includeAI}
              onChange={(e) => setIncludeAI(e.target.checked)}
              className="h-3.5 w-3.5 accent-accent"
            />
            末尾附 AI 讨论记录
          </label>
        </div>
      ) : (
        <p className="py-2 text-sm">当前没有选中的会话。</p>
      )}
    </Dialog>
  );
}

// ── 全部数据 → JSON 备份 ────────────────────────────────────

function ExportBackupDialog() {
  const open = useUIStore((s) => s.exportBackupOpen);
  const onClose = () => useUIStore.getState().setExportBackupOpen(false);
  const sessions = useSessionsStore((s) => s.sessions);
  const tags = useTagsStore((s) => s.tags);
  const settings = useSettingsStore((s) => s);
  const toast = useToast();
  const [includeApiKey, setIncludeApiKey] = useState(false);

  const doExport = () => {
    const backup = buildBackup({
      sessions,
      tags,
      settings: {
        providers: settings.providers,
        activeProviderId: settings.activeProviderId,
        activeModel: settings.activeModel,
        sidebarCollapsed: settings.sidebarCollapsed,
      },
      includeApiKey,
      appVersion: APP_VERSION,
    });
    downloadTextFile(backupFilename(), JSON.stringify(backup, null, 2));
    toast('已导出 JSON 备份', 'success');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="导出全局备份"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={doExport}>导出 JSON</Button>
        </>
      }
    >
      <div className="space-y-3 py-1">
        <p className="text-sm">
          包含 {sessions.length} 个会话、{tags.length} 个标签与设置（不含浏览数据以外的任何内容）。
        </p>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={includeApiKey}
            onChange={(e) => setIncludeApiKey(e.target.checked)}
            className="mt-1 h-3.5 w-3.5 accent-accent"
          />
          <span>
            包含 API Key
            <span className="block text-13 text-warning">
              默认不包含。勾选后备份文件将明文携带你的 Key，请妥善保管文件。
            </span>
          </span>
        </label>
      </div>
    </Dialog>
  );
}

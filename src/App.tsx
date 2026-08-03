/**
 * App.tsx — 应用外壳：顶栏 + 左侧栏 + 主区思维流（+ M3 AI 抽屉）
 * 挂载全局快捷键、命令面板与快捷键帮助面板（PRD F12）。
 */
import { useEffect, useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import { selectSortedSessions, useSessionsStore } from './stores/sessions';
import { useSettingsStore } from './stores/settings';
import { useUIStore } from './stores/ui';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { testProviderConnection } from './lib/ai';
import { Button } from './components/ui/Button';
import { EmptyState } from './components/ui/EmptyState';
import { useToast } from './components/ui/Toast';
import { CommandPalette, type CommandAction } from './components/ui/CommandPalette';
import { TopBar } from './components/features/TopBar';
import { Sidebar } from './components/features/Sidebar';
import { BlockList } from './components/features/BlockList';
import { QuickToolbar } from './components/features/QuickToolbar';
import { SettingsDialog } from './components/features/SettingsDialog';
import { ShortcutHelpDialog } from './components/features/ShortcutHelpDialog';
import { AIDrawer } from './components/features/AIDrawer';
import { IMPORT_INPUT_ID } from './components/features/ImportButton';

export default function App() {
  useGlobalShortcuts();

  const sessions = useSessionsStore((s) => s.sessions);
  const activeSessionId = useSessionsStore((s) => s.activeSessionId);
  const setActiveSession = useSessionsStore((s) => s.setActiveSession);
  const createSession = useSessionsStore((s) => s.createSession);
  const addOutputBlock = useSessionsStore((s) => s.addOutputBlock);
  const addBreakpoint = useSessionsStore((s) => s.addBreakpoint);

  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const paletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const setPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const helpOpen = useUIStore((s) => s.shortcutHelpOpen);
  const setHelpOpen = useUIStore((s) => s.setShortcutHelpOpen);
  const toggleAIDrawer = useUIStore((s) => s.toggleAIDrawer);
  const setExportMarkdownOpen = useUIStore((s) => s.setExportMarkdownOpen);
  const setExportBackupOpen = useUIStore((s) => s.setExportBackupOpen);
  const toast = useToast();

  const sorted = selectSortedSessions(sessions);
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  // 恢复的 activeSessionId 失效（如导入备份后）时回退到第一个会话
  useEffect(() => {
    if (sorted.length > 0 && !activeSession) {
      const first = sorted[0];
      if (first) setActiveSession(first.id);
    }
  }, [sorted, activeSession, setActiveSession]);

  // 命令面板动作清单（M3/M4 会追加测试连接 / 总结 / 复盘）
  const actions = useMemo<CommandAction[]>(() => {
    const list: CommandAction[] = [
      {
        id: 'new-block',
        title: '新输出块',
        hint: 'Alt+N',
        keywords: 'block xin shuchukuai',
        run: () => addOutputBlock(),
      },
      {
        id: 'new-breakpoint',
        title: '插入断点',
        hint: 'Alt+B',
        keywords: 'breakpoint duandian',
        run: () => addBreakpoint(),
      },
      {
        id: 'toggle-ai',
        title: '打开 / 关闭 AI 讨论',
        hint: 'Alt+I',
        keywords: 'ai taolun chat',
        run: toggleAIDrawer,
      },
      {
        id: 'new-session',
        title: '新建会话',
        keywords: 'session xinjian huihua',
        run: () => createSession(),
      },
      {
        id: 'export-md',
        title: '导出当前会话为 Markdown',
        keywords: 'export markdown daochu',
        run: () => setExportMarkdownOpen(true),
      },
      {
        id: 'export-backup',
        title: '导出全局 JSON 备份',
        keywords: 'backup json beifen daochu',
        run: () => setExportBackupOpen(true),
      },
      {
        id: 'import-backup',
        title: '导入备份并恢复',
        keywords: 'import restore daoru huifu',
        run: () => document.getElementById(IMPORT_INPUT_ID)?.click(),
      },
      {
        id: 'test-connection',
        title: '测试当前模型连接',
        keywords: 'test connection ceshi lianjie',
        run: () => {
          const { providers, activeProviderId } = useSettingsStore.getState();
          const provider = providers.find((p) => p.id === activeProviderId);
          if (!provider) {
            toast('尚未配置模型，请先在设置页添加 Provider', 'error');
            return;
          }
          toast(`正在测试「${provider.name}」…`);
          void testProviderConnection(provider).then((r) => {
            toast(
              r.ok ? `连接成功（${r.latencyMs} ms）` : `连接失败：${r.error ?? '未知错误'}`,
              r.ok ? 'success' : 'error',
            );
          });
        },
      },
      {
        id: 'open-settings',
        title: '设置',
        keywords: 'settings shezhi',
        run: () => setSettingsOpen(true),
      },
      {
        id: 'shortcut-help',
        title: '快捷键帮助',
        hint: 'Ctrl+/',
        keywords: 'shortcut keyboard bangzhu',
        run: () => setHelpOpen(true),
      },
    ];
    if (activeSession) {
      // 会话切换类动作（模糊搜索会话标题）
      for (const s of sorted) {
        if (s.id === activeSession.id) continue;
        list.push({
          id: `switch-${s.id}`,
          title: `切换到会话：${s.title}`,
          keywords: 'switch qiehuan session',
          run: () => setActiveSession(s.id),
        });
      }
    }
    return list;
  }, [
    activeSession,
    sorted,
    addOutputBlock,
    addBreakpoint,
    toggleAIDrawer,
    createSession,
    setActiveSession,
    setSettingsOpen,
    setHelpOpen,
    setExportMarkdownOpen,
    setExportBackupOpen,
    toast,
  ]);

  return (
    <div className="flex h-screen flex-col bg-bg">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative min-w-0 flex-1 overflow-y-auto">
          {activeSession ? (
            <>
              <BlockList key={activeSession.id} session={activeSession} />
              <QuickToolbar />
            </>
          ) : (
            <EmptyState
              icon={<Lightbulb size={32} />}
              title="还没有会话"
              description="每个会话是一条完整的思维链：想法、断点、标签、AI 讨论。"
              action={<Button onClick={() => createSession()}>新建会话</Button>}
            />
          )}
        </main>
        <AIDrawer />
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ShortcutHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={actions} />
    </div>
  );
}

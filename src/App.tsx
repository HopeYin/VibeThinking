/**
 * App.tsx — 应用外壳：顶栏 + 左侧栏 + 主区思维流（+ M3 AI 抽屉）
 */
import { useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { selectSortedSessions, useSessionsStore } from './stores/sessions';
import { useUIStore } from './stores/ui';
import { Button } from './components/ui/Button';
import { EmptyState } from './components/ui/EmptyState';
import { TopBar } from './components/features/TopBar';
import { Sidebar } from './components/features/Sidebar';
import { BlockList } from './components/features/BlockList';
import { QuickToolbar } from './components/features/QuickToolbar';
import { SettingsDialog } from './components/features/SettingsDialog';

export default function App() {
  const sessions = useSessionsStore((s) => s.sessions);
  const activeSessionId = useSessionsStore((s) => s.activeSessionId);
  const setActiveSession = useSessionsStore((s) => s.setActiveSession);
  const createSession = useSessionsStore((s) => s.createSession);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

  const sorted = selectSortedSessions(sessions);
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  // 恢复的 activeSessionId 失效（如导入备份后）时回退到第一个会话
  useEffect(() => {
    if (sorted.length > 0 && !activeSession) {
      const first = sorted[0];
      if (first) setActiveSession(first.id);
    }
  }, [sorted, activeSession, setActiveSession]);

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
        {/* M3：AI 讨论抽屉 */}
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

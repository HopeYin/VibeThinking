/**
 * Sidebar — 左侧栏：会话搜索 / 列表 / 拖拽排序 / 新建，可折叠为窄条（PRD F1）
 */
import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Plus, Search } from 'lucide-react';
import { useSessionsStore } from '../../stores/sessions';
import { useSettingsStore } from '../../stores/settings';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { SessionList } from './SessionList';

export function Sidebar() {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const setCollapsed = useSettingsStore((s) => s.setSidebarCollapsed);
  const createSession = useSessionsStore((s) => s.createSession);
  const [query, setQuery] = useState('');

  if (collapsed) {
    return (
      <aside className="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-border bg-bg-subtle py-3">
        <IconButton label="展开侧栏" onClick={() => setCollapsed(false)}>
          <PanelLeftOpen size={16} />
        </IconButton>
        <IconButton label="新建会话" onClick={() => createSession()}>
          <Plus size={16} />
        </IconButton>
      </aside>
    );
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-bg-subtle">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-13 font-medium text-text-secondary">会话</span>
        <div className="flex items-center gap-0.5">
          <IconButton label="新建会话" onClick={() => createSession()}>
            <Plus size={15} />
          </IconButton>
          <IconButton label="折叠侧栏" onClick={() => setCollapsed(true)}>
            <PanelLeftClose size={15} />
          </IconButton>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索会话标题…"
            className="h-8 pl-8 text-13"
          />
        </div>
      </div>

      <SessionList query={query.trim()} />
    </aside>
  );
}

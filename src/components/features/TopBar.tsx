/**
 * TopBar — 顶栏：产品名 · 当前模型 · 导出/导入（M2 接入）· 设置
 */
import { Brain, Settings } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings';
import { useUIStore } from '../../stores/ui';
import { IconButton } from '../ui/IconButton';
import { ExportMenu } from './ExportMenu';
import { ImportButton } from './ImportButton';

export function TopBar() {
  const activeModel = useSettingsStore((s) => s.activeModel);
  const activeProvider = useSettingsStore((s) =>
    s.providers.find((p) => p.id === s.activeProviderId),
  );
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-bg px-4">
      <div className="flex items-center gap-2">
        <Brain size={17} className="text-accent" />
        <span className="text-sm font-semibold tracking-wide">VibeThinking</span>
      </div>

      <span
        className="rounded-sm border border-border px-2 py-0.5 text-13 text-text-secondary"
        title={activeProvider ? `Provider：${activeProvider.name}` : '尚未配置模型，去设置页添加'}
      >
        {activeModel ? activeModel : '未配置模型'}
      </span>

      <div className="flex-1" />

      <ExportMenu />
      <ImportButton />
      <IconButton label="设置" onClick={() => setSettingsOpen(true)}>
        <Settings size={16} />
      </IconButton>
    </header>
  );
}

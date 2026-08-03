/**
 * ProviderSection — 设置页「模型服务」分区（PRD F6）
 *
 * - Provider 列表 + 添加/编辑/删除
 * - 预设模板一键填充（DeepSeek / Kimi），Key 留空
 * - 全局「当前生效」组合：Provider + 模型
 * - 编辑弹层内置「测试连接」
 *
 * 安全（PRD D3）：API Key 仅存本机浏览器 localStorage，设置页必须明示。
 */
import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Eye, EyeOff, Pencil, Plug, Plus, Trash2 } from 'lucide-react';
import type { ApiFormat, ProviderConfig } from '../../types';
import { useSettingsStore } from '../../stores/settings';
import { useToast } from '../ui/Toast';
import { API_FORMAT_LABELS, PROVIDER_PRESETS, testProviderConnection } from '../../lib/ai';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { IconButton } from '../ui/IconButton';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { cn } from '../../lib/cn';

const selectClass =
  'h-9 w-full rounded-sm border border-border bg-bg px-2 text-sm text-text focus:outline-2 focus:outline-accent';

export function ProviderSection() {
  const providers = useSettingsStore((s) => s.providers);
  const activeProviderId = useSettingsStore((s) => s.activeProviderId);
  const activeModel = useSettingsStore((s) => s.activeModel);
  const setActive = useSettingsStore((s) => s.setActive);
  const removeProvider = useSettingsStore((s) => s.removeProvider);

  const [editing, setEditing] = useState<ProviderConfig | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProviderConfig | null>(null);

  const activeProvider = providers.find((p) => p.id === activeProviderId) ?? null;

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-text">模型服务</h3>
      <p className="mb-3 text-13 text-text-tertiary">
        自带 API Key（BYOK）。Key 仅存储于本机浏览器，不会上传到任何第三方服务器；
        清除浏览器数据会删除它。
      </p>

      {/* 当前生效组合 */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-13 text-text-secondary">当前 Provider</span>
          <select
            className={selectClass}
            value={activeProviderId ?? ''}
            onChange={(e) => {
              const pid = e.target.value || null;
              const p = providers.find((x) => x.id === pid);
              setActive(pid, p?.defaultModel || p?.models[0] || null);
            }}
          >
            <option value="">未选择</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-13 text-text-secondary">当前模型</span>
          <select
            className={selectClass}
            value={activeModel ?? ''}
            disabled={!activeProvider}
            onChange={(e) => setActive(activeProviderId, e.target.value || null)}
          >
            <option value="">未选择</option>
            {activeProvider?.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Provider 列表 */}
      <div className="space-y-1.5">
        {providers.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-sm border border-border bg-bg-subtle px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{p.name}</span>
                <span className="shrink-0 rounded-sm bg-bg-muted px-1.5 py-0.5 text-13 text-text-tertiary">
                  {API_FORMAT_LABELS[p.apiFormat]}
                </span>
              </div>
              <div className="truncate text-13 text-text-tertiary">
                {p.baseUrl} · {p.models.length} 个模型
              </div>
            </div>
            <IconButton label="编辑" onClick={() => setEditing(p)}>
              <Pencil size={14} />
            </IconButton>
            <IconButton label="删除" onClick={() => setPendingDelete(p)}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        ))}
        {providers.length === 0 && (
          <p className="py-2 text-center text-13 text-text-tertiary">
            还没有 Provider，点击下方添加（支持 DeepSeek / Kimi 预设）。
          </p>
        )}
      </div>

      <Button variant="secondary" size="sm" className="mt-3" onClick={() => setEditing('new')}>
        <Plus size={14} /> 添加 Provider
      </Button>

      {editing !== null && (
        <ProviderEditDialog
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeProvider(pendingDelete.id);
        }}
        title="删除 Provider"
        confirmText="删除"
      >
        删除「{pendingDelete?.name}」及其 API Key？此操作不影响会话数据。
      </ConfirmDialog>
    </section>
  );
}

// ── 添加 / 编辑弹层 ─────────────────────────────────────────

interface ProviderEditDialogProps {
  initial: ProviderConfig | null;
  onClose: () => void;
}

function ProviderEditDialog({ initial, onClose }: ProviderEditDialogProps) {
  const upsertProvider = useSettingsStore((s) => s.upsertProvider);
  const setActive = useSettingsStore((s) => s.setActive);
  const providers = useSettingsStore((s) => s.providers);
  const toast = useToast();

  const [name, setName] = useState(initial?.name ?? '');
  const [apiFormat, setApiFormat] = useState<ApiFormat>(initial?.apiFormat ?? 'openai-chat');
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? '');
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '');
  const [showKey, setShowKey] = useState(false);
  const [modelsText, setModelsText] = useState(initial?.models.join(', ') ?? '');
  const [defaultModel, setDefaultModel] = useState(initial?.defaultModel ?? '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  const buildDraft = (): ProviderConfig => {
    const models = modelsText
      .split(/[,，]/)
      .map((m) => m.trim())
      .filter(Boolean);
    return {
      id: initial?.id ?? nanoid(),
      name: name.trim() || '未命名 Provider',
      apiFormat,
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      models,
      defaultModel: defaultModel.trim() || models[0] || '',
    };
  };

  const applyPreset = (preset: (typeof PROVIDER_PRESETS)[number]) => {
    setName(preset.name);
    setApiFormat(preset.apiFormat);
    setBaseUrl(preset.baseUrl);
    setModelsText(preset.modelsText);
    setDefaultModel(preset.defaultModel);
    // Key 一律留空（PRD F6）
  };

  const runTest = async () => {
    const draft = buildDraft();
    setTesting(true);
    setTestResult(null);
    const result = await testProviderConnection(draft);
    setTesting(false);
    setTestResult(
      result.ok
        ? { ok: true, text: `连接成功（${result.latencyMs} ms）` }
        : { ok: false, text: result.error ?? '连接失败' },
    );
  };

  const save = () => {
    const draft = buildDraft();
    if (!draft.baseUrl) {
      toast('请填写 Base URL', 'error');
      return;
    }
    if (draft.models.length === 0) {
      toast('请至少填写一个模型', 'error');
      return;
    }
    upsertProvider(draft);
    // 第一个 Provider 自动设为当前生效组合
    if (providers.length === 0 && !initial) {
      setActive(draft.id, draft.defaultModel);
    }
    toast('已保存 Provider', 'success');
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={initial ? '编辑 Provider' : '添加 Provider'}
      widthClassName="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={runTest} disabled={testing || !baseUrl.trim()}>
            <Plug size={14} /> {testing ? '测试中…' : '测试连接'}
          </Button>
          <span className="flex-1" />
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save}>保存</Button>
        </>
      }
    >
      <div className="space-y-3 py-1">
        {/* 预设模板 */}
        <div className="flex items-center gap-2">
          <span className="text-13 text-text-tertiary">预设：</span>
          {PROVIDER_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="rounded-sm border border-border px-2 py-1 text-13 text-text-secondary transition-colors hover:bg-bg-muted"
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-13 text-text-secondary">名称</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如 DeepSeek"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-13 text-text-secondary">API 格式</span>
            <select
              className={selectClass}
              value={apiFormat}
              onChange={(e) => setApiFormat(e.target.value as ApiFormat)}
            >
              {(Object.keys(API_FORMAT_LABELS) as ApiFormat[]).map((f) => (
                <option key={f} value={f}>
                  {API_FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-13 text-text-secondary">Base URL</span>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.deepseek.com"
            className="font-mono text-13"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-13 text-text-secondary">API Key</span>
          <span className="relative block">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…"
              autoComplete="off"
              className="pr-9 font-mono text-13"
            />
            <span className="absolute right-1 top-1/2 -translate-y-1/2">
              <IconButton
                label={showKey ? '隐藏 Key' : '显示 Key'}
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </IconButton>
            </span>
          </span>
        </label>

        <div className="grid grid-cols-[1fr_180px] gap-2">
          <label className="block">
            <span className="mb-1 block text-13 text-text-secondary">模型列表（逗号分隔）</span>
            <Input
              value={modelsText}
              onChange={(e) => setModelsText(e.target.value)}
              placeholder="deepseek-chat, deepseek-reasoner"
              className="font-mono text-13"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-13 text-text-secondary">默认模型</span>
            <Input
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              placeholder="默认取第一个"
              className="font-mono text-13"
            />
          </label>
        </div>

        {testResult && (
          <p
            className={cn(
              'rounded-sm px-2 py-1.5 text-13',
              testResult.ok ? 'bg-tag-green-bg text-tag-green' : 'bg-tag-red-bg text-tag-red',
            )}
          >
            {testResult.ok ? '✓ ' : '✗ '}
            {testResult.text}
          </p>
        )}

        <p className="text-13 text-text-tertiary">
          如遇浏览器跨域（CORS）报错，可在 vite.config.ts 启用 proxy 示例，并把这里的 Base URL
          改为本地代理路径（详见 README）。
        </p>
      </div>
    </Dialog>
  );
}

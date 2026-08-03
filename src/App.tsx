/**
 * App.tsx — 【临时】M0 设计地基 showcase（M5 移除）
 *
 * 职责：自验 theme.css 的设计 tokens 与 ui 组件是否生效。
 */
import { useState } from 'react';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Textarea } from './components/ui/Textarea';
import { Dialog } from './components/ui/Dialog';
import { useToast } from './components/ui/Toast';

const COLOR_TOKENS = [
  ['bg', '页面背景'],
  ['bg-subtle', '侧栏/卡片底'],
  ['bg-muted', 'hover'],
  ['border', '边框'],
  ['text', '主文字'],
  ['text-secondary', '次要文字'],
  ['text-tertiary', '占位'],
  ['accent', '品牌强调'],
  ['accent-hover', '强调 hover'],
  ['accent-subtle', '强调浅底'],
  ['success', '成功'],
  ['warning', '警告'],
  ['danger', '危险'],
] as const;

const TAG_COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'] as const;

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [text, setText] = useState('');
  const toast = useToast();

  return (
    <div className="mx-auto max-w-3xl px-8 py-10 space-y-10">
      <header>
        <h1 className="text-2xl">VibeThinking · M0 设计地基 Showcase</h1>
        <p className="text-text-secondary mt-1">临时页面，验证设计 tokens 与 UI 组件（M5 移除）。</p>
      </header>

      <section>
        <h2 className="text-lg mb-3">色彩 tokens</h2>
        <div className="grid grid-cols-4 gap-3">
          {COLOR_TOKENS.map(([token, label]) => (
            <div key={token} className="text-13">
              <div
                className="h-10 rounded-md border border-border"
                style={{ backgroundColor: `var(--color-${token})` }}
              />
              <div className="mt-1 font-mono text-text-secondary">--color-{token}</div>
              <div className="text-text-tertiary">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg mb-3">标签 8 色板</h2>
        <div className="flex flex-wrap gap-2">
          {TAG_COLORS.map((c) => (
            <span
              key={c}
              className="rounded-sm px-2 py-0.5 text-13"
              style={{
                color: `var(--color-tag-${c})`,
                backgroundColor: `var(--color-tag-${c}-bg)`,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">按钮</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">输入</h2>
        <Input placeholder="单行输入框…" />
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="自适应高度 Textarea，输入多行试试…"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">Dialog & Toast</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            打开 Dialog
          </Button>
          <Button variant="secondary" onClick={() => toast('操作成功', 'success')}>
            成功 Toast
          </Button>
          <Button variant="secondary" onClick={() => toast('出错了：网络超时', 'error')}>
            错误 Toast
          </Button>
        </div>
      </section>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="确认操作"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={() => setDialogOpen(false)}>
              确认删除
            </Button>
          </>
        }
      >
        这是对话框正文。Esc 或点击遮罩可关闭。
      </Dialog>
    </div>
  );
}

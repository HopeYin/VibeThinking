/**
 * MarkdownView — AI 消息 / 复盘报告的 Markdown 渲染（PRD D5：仅 AI 侧渲染）
 * 代码块带复制按钮；GFM（表格、删除线等）支持。
 */
import { useRef, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '../ui/Toast';

function CodeBlockPre({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const toast = useToast();
  return (
    <pre
      ref={ref}
      className="group/code relative my-2 overflow-x-auto rounded-md bg-text p-3 text-13 leading-relaxed text-bg"
    >
      <button
        onClick={() => {
          void navigator.clipboard.writeText(ref.current?.innerText ?? '');
          toast('代码已复制', 'success');
        }}
        className="absolute right-1.5 top-1.5 rounded-sm bg-white/15 px-1.5 py-0.5 text-13 text-bg opacity-0 transition-opacity duration-150 group-hover/code:opacity-100"
      >
        复制
      </button>
      {children}
    </pre>
  );
}

export function MarkdownView({ content }: { content: string }) {
  return (
    <div className="markdown-body text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: CodeBlockPre,
          code: ({ className, children }) =>
            // 有 language-* 的是围栏代码块（交给 pre 的底色），否则是行内 code
            className?.includes('language-') ? (
              <code className={className}>{children}</code>
            ) : (
              <code className="rounded-sm bg-bg-muted px-1 py-0.5 font-mono text-13">{children}</code>
            ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-accent underline">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

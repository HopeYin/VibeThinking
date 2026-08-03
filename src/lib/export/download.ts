/**
 * lib/export/download.ts — 浏览器端文本文件下载（导出 Markdown / JSON 备份共用）
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mime: 'text/markdown' | 'application/json' = 'application/json',
): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** 文件名里的日期串：vibethinking-2026-08-03 */
export function dateSlug(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 去掉文件名非法字符（Windows 不允许 \ / : * ? " < > |） */
export function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || '未命名';
}

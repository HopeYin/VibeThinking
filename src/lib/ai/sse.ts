/**
 * lib/ai/sse.ts — SSE（Server-Sent Events）手工解析
 *
 * 职责：把响应体字节流按行切分，产出 `data:` 行的载荷字符串。
 * 三家 API 格式（openai-chat / openai-responses / anthropic-messages）
 * 都是「data: {json}\n\n」的变体，行级处理已足够，事件类型从 JSON 的
 * type 字段判断，不依赖 `event:` 行。
 *
 * 为什么手写而不引 SDK：PRD 7.5 要求零 SDK 依赖，SSE 协议本身简单。
 */
export async function* iterateSSEData(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).replace(/\r$/, '');
        buffer = buffer.slice(idx + 1);
        if (line.startsWith('data:')) {
          yield line.slice(5).trimStart();
        }
      }
    }
    // 流末尾可能没有换行符
    const tail = buffer.trim();
    if (tail.startsWith('data:')) {
      yield tail.slice(5).trimStart();
    }
  } finally {
    reader.releaseLock();
  }
}

/** Base URL 拼接容错：去掉末尾多余斜杠（PRD 7.5 要求） */
export function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

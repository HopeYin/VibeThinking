/**
 * BlockList — 主区思维流：输出块 / 断点按时间正序（PRD 5.1）
 */
import { useEffect, useRef } from 'react';
import type { Session } from '../../types';
import { OutputBlockItem } from './OutputBlockItem';
import { BreakpointItem } from './BreakpointItem';

interface BlockListProps {
  session: Session;
}

export function BlockList({ session }: BlockListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastBlockId = session.blocks[session.blocks.length - 1]?.id;

  // 新增块时滚动到底部（编辑既有块不打扰）
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lastBlockId, session.id]);

  if (session.blocks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-tertiary">写下第一个想法（Alt+N）</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 pt-6 pb-24">
      {session.blocks.map((block) =>
        block.kind === 'output' ? (
          <OutputBlockItem key={block.id} block={block} />
        ) : (
          <BreakpointItem key={block.id} block={block} />
        ),
      )}
      <div ref={endRef} />
    </div>
  );
}

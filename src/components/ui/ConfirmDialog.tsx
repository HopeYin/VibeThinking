/**
 * ConfirmDialog — 二次确认对话框（ui 组件资产）
 *
 * 最小示例：
 *   <ConfirmDialog open={open} onClose={...} onConfirm={del} title="删除会话" danger>
 *     删除后不可恢复。
 *   </ConfirmDialog>
 */
import type { ReactNode } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  /** 危险操作（红色确认按钮），默认 true */
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = '确认',
  danger = true,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}

import React from 'react';
import Modal from './Modal';
import Button from './Button';

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  confirmTone = 'default',
  onConfirm,
  onCancel,
  isBusy = false
}) {
  return (
    <Modal
      open={open}
      onClose={isBusy ? undefined : onCancel}
      title={title}
      description={description}
      size="sm"
      panelClassName="space-y-4"
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={isBusy}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isBusy}
          className={
            confirmTone === 'danger'
              ? 'border-red-200 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300'
              : ''
          }
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;

import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';
import Button from './Button';

const SIZE_CLASS = {
  sm: 'ui-modal__panel--sm',
  md: 'ui-modal__panel--md',
  lg: 'ui-modal__panel--lg'
};

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  placement = 'center',
  size = 'md',
  closeLabel = 'Закрыть',
  className = '',
  overlayClassName = '',
  panelClassName = '',
  showCloseButton = true,
  closeOnOverlayClick = true
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={cn('ui-modal__overlay', `ui-modal__overlay--${placement}`, overlayClassName)}
      onMouseDown={(event) => {
        if (
          closeOnOverlayClick &&
          typeof onClose === 'function' &&
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className={cn('ui-modal__viewport', `ui-modal__viewport--${placement}`)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            'ui-modal__panel',
            `ui-modal__panel--${placement}`,
            SIZE_CLASS[size] || SIZE_CLASS.md,
            panelClassName,
            className
          )}
        >
          {(title || description || showCloseButton) ? (
            <div className="ui-modal__header">
              <div className="min-w-0">
                {title ? (
                  <h2 id={titleId} className="ui-modal__title">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p id={descriptionId} className="ui-modal__description">
                    {description}
                  </p>
                ) : null}
              </div>
              {showCloseButton ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={onClose}
                  aria-label={closeLabel}
                >
                  ✕
                </Button>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;

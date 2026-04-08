import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../ui';

function LastAddedCartNotice({ lastAddedItem, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed left-1/2 z-[95] w-[min(94vw,390px)] -translate-x-1/2 transition-all duration-200 sm:left-auto sm:right-4 sm:translate-x-0 ${
        lastAddedItem
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none -translate-y-4 opacity-0'
      }`}
      style={{ top: 'calc(var(--site-header-height, 6.5rem) + 0.75rem)' }}
    >
      <Card
        variant="quiet"
        padding="sm"
        className="rounded-[22px] shadow-[0_22px_48px_rgba(43,39,34,0.22)]"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
              Добавлено в корзину
            </p>
            <p className="text-sm font-semibold text-ink">
              {lastAddedItem?.name || 'Товар'}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="Закрыть уведомление"
          >
            ✕
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-[56px_minmax(0,1fr)] gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-xl border border-ink/10 bg-sand/60">
            {lastAddedItem?.imageUrl ? (
              <img
                src={lastAddedItem.imageUrl}
                alt={lastAddedItem.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                Фото
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted">
              {lastAddedItem?.variantName || 'Базовый вариант'}
            </p>
            <p className="text-sm text-ink">
              {lastAddedItem?.quantity || 1} шт. ·{' '}
              <span className="font-semibold text-accent">
                {Number(lastAddedItem?.unitPriceValue || 0).toLocaleString('ru-RU')} ₽
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            as={Link}
            to="/cart"
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={onDismiss}
          >
            Открыть корзину
          </Button>
          <Button
            as={Link}
            to="/checkout"
            size="sm"
            className="text-xs"
            onClick={onDismiss}
          >
            К оформлению
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default LastAddedCartNotice;

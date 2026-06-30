import React from 'react';
import { Button, Card } from '../../components/ui';

function DeliveryStep({
  active,
  deliveryLabel,
  deliveryNotice,
  onContinue,
  onEdit,
  disabled = false
}) {
  return (
    <Card as="section" padding="lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">3</span>
          <div>
            <h2 className="text-2xl font-semibold">Доставка</h2>
            <p className="text-sm text-muted">Выберите способ доставки для этого заказа.</p>
          </div>
        </div>
        {!active ? (
          <Button variant="ghost" size="sm" className="text-xs" onClick={onEdit} disabled={disabled}>
            Изменить
          </Button>
        ) : null}
      </div>

      {active ? (
        <>
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
                ✓
              </span>
              <div>
                <p className="font-semibold">{deliveryLabel}</p>
                <p className="mt-1 text-sm text-muted">{deliveryNotice}</p>
                <p className="mt-2 text-xs text-ink/80">В итогах заказа доставка отображается как «рассчитывается».</p>
              </div>
            </div>
          </div>
          <Button className="mt-5" onClick={onContinue} disabled={disabled}>
            К оплате
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">{deliveryLabel}. {deliveryNotice}</p>
      )}
    </Card>
  );
}

export default DeliveryStep;

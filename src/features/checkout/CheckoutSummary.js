import React from 'react';
import TrustLinksPanel from '../../components/TrustLinksPanel';
import { moneyToNumber } from '../../utils/product';
import { usePaymentConfig } from '../../contexts/PaymentConfigContext';
import { CHECKOUT_TRUST_LINK_IDS } from '../../data/trustLinks';
import { getCheckoutPaymentDescription } from '../../utils/payment';
import { Button, Card } from '../../components/ui';

function CheckoutSummary({
  items,
  itemsCount,
  total,
  deliveryLabel,
  payableTotal,
  formatRub,
  mobileAction,
  deliveryNotice
}) {
  const { paymentConfig } = usePaymentConfig();
  const paymentDescription = getCheckoutPaymentDescription(paymentConfig);

  return (
    <>
      <div className="lg:hidden mb-6">
        <div className="space-y-3">
          <Card as="details" padding="sm">
            <summary className="cursor-pointer text-sm font-semibold">Сводка заказа · {formatRub(payableTotal)}</summary>
            <div className="mt-3 space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.productInfo?.name || 'Товар'}</div>
                    <div className="text-xs text-muted">{item.quantity} шт.</div>
                  </div>
                  <div className="whitespace-nowrap font-semibold">
                    {formatRub((item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity)}
                  </div>
                </div>
              ))}
              <hr className="my-2 border-ink/10" />
              <div className="flex justify-between"><span>Товары</span><span>{formatRub(total)}</span></div>
              <div className="flex justify-between"><span>Доставка</span><span>{deliveryLabel}</span></div>
              <div className="flex justify-between font-semibold"><span>К оплате</span><span>{formatRub(payableTotal)}</span></div>
            </div>
          </Card>

          <TrustLinksPanel
            title="Почему нам доверяют"
            description={`${paymentDescription} ${deliveryNotice}`}
            linkIds={CHECKOUT_TRUST_LINK_IDS}
          />
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        Текущая сумма к оплате: {formatRub(payableTotal)}
      </div>

      <aside className="hidden lg:block space-y-4 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] self-start">
        <Card padding="md">
          <h2 className="text-2xl font-semibold mb-4">Ваш заказ</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{item.productInfo?.name || 'Товар'}</div>
                  <div className="text-xs text-muted">{item.quantity} шт.</div>
                </div>
                <div className="font-semibold whitespace-nowrap">
                  {formatRub((item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4 border-ink/10" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Товары ({itemsCount})</dt>
              <dd>{formatRub(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Доставка</dt>
              <dd>{deliveryLabel}</dd>
            </div>
          </dl>
          <hr className="my-4 border-ink/10" />
          <div className="flex justify-between text-lg font-semibold">
            <span>К оплате</span>
            <span>{formatRub(payableTotal)}</span>
          </div>
        </Card>

        <TrustLinksPanel
          title="Доверие и безопасность"
          description={`${paymentDescription} ${deliveryNotice}`}
          linkIds={CHECKOUT_TRUST_LINK_IDS}
        />
      </aside>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 shadow-[0_-10px_30px_rgba(43,39,34,0.12)] lg:hidden">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted">{mobileAction.subtitle}</div>
            <div className="text-sm font-semibold">К оплате: {formatRub(payableTotal)}</div>
          </div>
          <Button
            className="ml-auto !px-4 !py-2.5"
            onClick={mobileAction.action}
            disabled={mobileAction.disabled}
          >
            {mobileAction.label}
          </Button>
        </div>
      </div>
    </>
  );
}

export default CheckoutSummary;

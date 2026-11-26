import React from 'react';
import { moneyToNumber } from '../../utils/product';
import { DELIVERY_SEPARATE_PAYMENT_NOTE } from '../../utils/delivery';
import DeliveryQuoteLink from '../../components/commerce/DeliveryQuoteLink';

function CheckoutSummary({ items, itemsCount, pricing, total, payableTotal, formatRub, isSubmitting }) {
  const originalSubtotal = pricing ? moneyToNumber(pricing.originalSubtotal) : total;
  const productSaleDiscount = pricing ? moneyToNumber(pricing.productSaleDiscount) : 0;
  const cartDiscount = pricing ? moneyToNumber(pricing.cartDiscount) : 0;
  const cartDiscountLabel = pricing?.appliedCartDiscountLabel || 'Скидка по корзине';
  const payableLabel = formatRub(payableTotal);

  const summary = (
    <>
      <ul className="divide-y divide-ink/10">
        {items.map((item) => (
          <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-3 text-sm">
            <div className="flex min-w-0 items-start gap-3">
              {item.productInfo?.imageUrl ? (
                <img src={item.productInfo.imageUrl} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" loading="lazy" />
              ) : null}
              <div className="min-w-0">
                <p className="break-words font-medium leading-snug">{item.productInfo?.name || 'Товар'}</p>
                <p className="mt-1 text-xs text-muted">{item.quantity} шт.</p>
              </div>
            </div>
            <p className="whitespace-nowrap font-semibold tabular-nums">
              {formatRub(item.pricingLine?.lineTotal != null
                ? moneyToNumber(item.pricingLine.lineTotal)
                : (item.unitPriceValue ?? moneyToNumber(item.unitPrice)) * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-line py-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt>Товары ({itemsCount})</dt>
          <dd className="whitespace-nowrap tabular-nums">{formatRub(originalSubtotal)}</dd>
        </div>
        {productSaleDiscount > 0 ? (
          <div className="flex justify-between gap-3 text-sale">
            <dt>Скидки на товары</dt>
            <dd className="whitespace-nowrap tabular-nums">−{formatRub(productSaleDiscount)}</dd>
          </div>
        ) : null}
        {cartDiscount > 0 ? (
          <div className="flex justify-between gap-3 text-sale">
            <dt>{cartDiscountLabel}</dt>
            <dd className="whitespace-nowrap tabular-nums">−{formatRub(cartDiscount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3 text-muted">
          <dt>Доставка</dt>
          <dd className="text-right">Рассчитаем отдельно</dd>
        </div>
      </dl>
      <div className="flex items-baseline justify-between gap-2 border-t border-line pt-3">
        <p className="text-sm font-semibold">К оплате за товары</p>
        <p className="whitespace-nowrap text-lg font-semibold tabular-nums">{payableLabel}</p>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden">
        <details className="rounded-lg border border-line bg-white">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12" className="text-primary" aria-hidden="true">
                <path d="m2.5 4.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
              </svg>
              Сводка заказа
            </span>
            <span className="whitespace-nowrap tabular-nums">{payableLabel}</span>
          </summary>
          <div className="border-t border-line px-4 pb-4">{summary}</div>
        </details>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs">
          <p className="text-muted">{DELIVERY_SEPARATE_PAYMENT_NOTE}</p>
          <DeliveryQuoteLink disabled={isSubmitting} />
        </div>
      </div>

      <aside className="hidden rounded-lg border border-line bg-white p-5 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:col-start-2 lg:row-start-1 lg:block xl:p-6">
        <h2 className="mb-1 text-2xl font-semibold">Ваш заказ</h2>
        {summary}
        <DeliveryQuoteLink className="text-sm" disabled={isSubmitting} />
      </aside>

      <div className="sr-only" aria-live="polite">К оплате за товары {payableLabel}</div>
    </>
  );
}

export default CheckoutSummary;

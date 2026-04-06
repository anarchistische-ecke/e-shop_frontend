import React from 'react';
import { Link } from 'react-router-dom';

function ReviewStep({
  active,
  email,
  recipientFirstName,
  recipientLastName,
  recipientPhone,
  reviewDeliveryLabel,
  deliveryType,
  fullDeliveryAddress,
  selectedPickupPoint,
  selectedPickupPointName,
  expressMessage,
  safeRetryState,
  isSubmitting,
  submitLabel,
  onEditContact,
  onEditRecipient,
  onEditDelivery,
  onOpen,
  onExpressCheckout,
  onSubmit,
  onSafeRetry
}) {
  return (
    <section className="soft-card p-6 md:p-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">4</span>
          <div>
            <h2 className="text-2xl font-semibold">Проверка и оплата</h2>
            <p className="text-sm text-muted">Проверьте данные. После этого откроется защищённая страница оплаты.</p>
          </div>
        </div>
        {!active ? (
          <button type="button" className="button-ghost text-xs" onClick={onOpen} disabled={isSubmitting}>Открыть</button>
        ) : null}
      </div>

      {active ? (
        <>
          <div className="rounded-2xl border border-ink/10 bg-white/85 p-4 text-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted">Контакт</div>
                <div className="font-semibold">{email}</div>
              </div>
              <button type="button" className="button-ghost text-xs" onClick={onEditContact} disabled={isSubmitting}>Изменить</button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted">Получатель</div>
                <div className="font-semibold">{recipientFirstName} {recipientLastName || ''}</div>
                <div className="text-xs text-muted">{recipientPhone}</div>
              </div>
              <button type="button" className="button-ghost text-xs" onClick={onEditRecipient} disabled={isSubmitting}>Изменить</button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted">Доставка</div>
                <div className="font-semibold">{reviewDeliveryLabel}</div>
                <div className="text-xs text-muted">
                  {deliveryType === 'COURIER'
                    ? fullDeliveryAddress
                    : selectedPickupPointName || selectedPickupPoint?.address || 'Пункт выдачи'}
                </div>
              </div>
              <button type="button" className="button-ghost text-xs" onClick={onEditDelivery} disabled={isSubmitting}>Изменить</button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-ink/10 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Быстрая оплата</p>
            <div className="mt-2 grid gap-2">
              {['Apple Pay', 'Google Pay', 'PayPal'].map((provider) => (
                <button
                  key={provider}
                  type="button"
                  className="w-full min-h-[44px] rounded-xl border border-ink/15 bg-white text-sm font-semibold text-ink hover:border-primary/35 hover:text-primary transition"
                  onClick={() => onExpressCheckout(provider)}
                  disabled={isSubmitting}
                >
                  {provider}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Или оплатите картой на следующем шаге через ЮKassa.</p>
            {expressMessage ? <p className="mt-2 text-xs text-primary">{expressMessage}</p> : null}
          </div>

          {safeRetryState ? (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink/90">
              <p className="font-semibold">{safeRetryState.title}</p>
              <p className="mt-1 text-xs text-muted">{safeRetryState.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="button" onClick={onSafeRetry} disabled={isSubmitting}>
                  {safeRetryState.retryLabel || 'Проверить ещё раз'}
                </button>
                {safeRetryState.orderToken ? (
                  <Link to={`/order/${safeRetryState.orderToken}`} className="button-ghost">
                    Открыть заказ
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-xs text-ink/90">
            Нажимая «Перейти к оплате», вы подтверждаете заказ. Если банк запросит 3DS/SCA, вы увидите отдельный шаг подтверждения.
          </div>

          <button type="submit" className="button mt-5 w-full" disabled={isSubmitting}>
            {submitLabel}
          </button>
        </>
      ) : (
        <p className="text-sm text-muted">Сначала завершите предыдущие шаги, затем подтвердите заказ.</p>
      )}
    </section>
  );
}

export default ReviewStep;

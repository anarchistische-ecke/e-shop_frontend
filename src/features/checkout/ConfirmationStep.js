import React from 'react';
import { Link } from 'react-router-dom';
import { usePaymentConfig } from '../../contexts/PaymentConfigContext';
import { getConfirmationPaymentHint, getPaymentSummaryLabel } from '../../utils/payment';
import { DELIVERY_SEPARATE_PAYMENT_NOTE } from '../../utils/delivery';
import { Button } from '../../components/ui';
import DeliveryQuoteLink from '../../components/commerce/DeliveryQuoteLink';

function ConfirmationStep({
  email,
  customerName,
  phone,
  homeAddress,
  safeRetryState,
  isSubmitting,
  submitLabel,
  primaryActionRef,
  onEditContact,
  onEditAddress,
  onSafeRetry
}) {
  const { paymentConfig } = usePaymentConfig();

  return (
    <section aria-labelledby="checkout-review-title">
      <h2 id="checkout-review-title" tabIndex={-1} className="mb-2 text-2xl font-semibold">Проверка и оплата</h2>
      <div className="divide-y divide-ink/10 text-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">Контакты</p>
            <p className="mt-1 break-words font-semibold">{customerName}</p>
            <p className="mt-1 break-words text-muted">{phone} · {email}</p>
          </div>
          <Button variant="ghost" size="sm" className="!px-2 text-xs" onClick={onEditContact} disabled={isSubmitting} aria-label="Изменить контакты">
            Изменить
          </Button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">Адрес доставки</p>
            <p className="mt-1 break-words font-semibold">{homeAddress}</p>
          </div>
          <Button variant="ghost" size="sm" className="!px-2 text-xs" onClick={onEditAddress} disabled={isSubmitting} aria-label="Изменить адрес">
            Изменить
          </Button>
        </div>
        <div className="py-3">
          <p className="text-xs text-muted">Онлайн-оплата</p>
          <p className="mt-1 font-semibold">{getPaymentSummaryLabel(paymentConfig)}</p>
          <p className="mt-1 text-muted">{getConfirmationPaymentHint(paymentConfig)}</p>
        </div>
      </div>

      {safeRetryState ? (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-ink">
          <p className="font-semibold">{safeRetryState.title}</p>
          <p className="mt-1 text-muted">{safeRetryState.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button ref={primaryActionRef} onClick={onSafeRetry} disabled={isSubmitting}>
              {submitLabel}
            </Button>
            {safeRetryState.orderToken ? (
              <Button as={Link} to={`/order/${safeRetryState.orderToken}`} variant="ghost">
                Открыть заказ
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <p id="checkout-review-delivery-note" className="mt-3 border-t border-ink/10 pt-4 text-sm leading-relaxed text-muted">
            Товары оплачиваются полностью. {DELIVERY_SEPARATE_PAYMENT_NOTE} Менеджер согласует её стоимость до отправки.
          </p>
          <DeliveryQuoteLink className="text-sm" disabled={isSubmitting} />
          <div className="mt-2">
            <Button ref={primaryActionRef} type="submit" className="w-full sm:w-auto" disabled={isSubmitting} aria-describedby="checkout-review-delivery-note">
              {submitLabel}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

export default ConfirmationStep;

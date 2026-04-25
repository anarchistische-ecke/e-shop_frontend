import React from 'react';
import { Link } from 'react-router-dom';
import { usePaymentConfig } from '../../contexts/PaymentConfigContext';
import { getReviewPaymentHint } from '../../utils/payment';
import { Button, Card } from '../../components/ui';

function ReviewStep({
  active,
  email,
  customerName,
  phone,
  homeAddress,
  deliveryNotice,
  expressMessage,
  safeRetryState,
  isSubmitting,
  submitLabel,
  onEditContact,
  onEditAddress,
  onOpen,
  onExpressCheckout,
  onSafeRetry
}) {
  const { paymentConfig } = usePaymentConfig();
  const reviewPaymentHint = getReviewPaymentHint(paymentConfig);
  const reviewDescription =
    paymentConfig.confirmationMode === 'EMBEDDED'
      ? 'Проверьте данные. После этого откроется встроенная защищённая форма оплаты.'
      : 'Проверьте данные. После этого откроется защищённая страница оплаты.';

  return (
    <Card as="section" padding="lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">3</span>
          <div>
            <h2 className="text-2xl font-semibold">Проверка и оплата</h2>
            <p className="text-sm text-muted">{reviewDescription}</p>
          </div>
        </div>
        {!active ? (
          <Button variant="ghost" size="sm" className="text-xs" onClick={onOpen} disabled={isSubmitting}>
            Открыть
          </Button>
        ) : null}
      </div>

      {active ? (
        <>
          <div className="rounded-2xl border border-ink/10 bg-white/85 p-4 text-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted">Контакты</div>
                <div className="font-semibold">{customerName}</div>
                <div className="text-xs text-muted">{phone} · {email}</div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={onEditContact} disabled={isSubmitting}>
                Изменить
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted">Адрес</div>
                <div className="font-semibold">{homeAddress}</div>
                <div className="mt-1 text-xs text-muted">{deliveryNotice}</div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={onEditAddress} disabled={isSubmitting}>
                Изменить
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-ink/10 bg-white/90 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Быстрая оплата</p>
            <div className="mt-2 grid gap-2">
              {['Apple Pay', 'Google Pay', 'PayPal'].map((provider) => (
                <Button
                  key={provider}
                  variant="secondary"
                  block
                  className="justify-center border-ink/15 bg-white text-sm shadow-none"
                  onClick={() => onExpressCheckout(provider)}
                  disabled={isSubmitting}
                >
                  {provider}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{reviewPaymentHint}</p>
            {expressMessage ? <p className="mt-2 text-xs text-primary">{expressMessage}</p> : null}
          </div>

          {safeRetryState ? (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-ink/90">
              <p className="font-semibold">{safeRetryState.title}</p>
              <p className="mt-1 text-xs text-muted">{safeRetryState.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={onSafeRetry} disabled={isSubmitting}>
                  {safeRetryState.retryLabel || 'Проверить ещё раз'}
                </Button>
                {safeRetryState.orderToken ? (
                  <Button as={Link} to={`/order/${safeRetryState.orderToken}`} variant="ghost">
                    Открыть заказ
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-xs text-ink/90">
            Нажимая «
            {submitLabel}
            », вы подтверждаете заказ. Доставка оплачивается отдельно после согласования с менеджером.
          </div>

          <Button type="submit" block className="mt-5" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">Сначала завершите предыдущие шаги, затем подтвердите заказ.</p>
      )}
    </Card>
  );
}

export default ReviewStep;

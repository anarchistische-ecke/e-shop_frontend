import React from 'react';
import { FieldError, Input } from '../../components/ui';
import CheckoutGuestPanel from './CheckoutGuestPanel';

function ContactStep({
  email,
  customerName,
  phone,
  savePaymentMethod,
  isAuthenticated,
  fieldErrors,
  onEmailChange,
  onEmailBlur,
  onCustomerNameChange,
  onPhoneChange,
  onSavePaymentMethodChange,
  disabled = false
}) {
  return (
    <section aria-labelledby="checkout-contact-title">
      <h2 id="checkout-contact-title" tabIndex={-1} className="mb-4 text-2xl font-semibold">Контакты</h2>
      {!isAuthenticated && <CheckoutGuestPanel disabled={disabled} />}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="checkout-email">Электронная почта</label>
          <Input
            id="checkout-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            onBlur={onEmailBlur}
            placeholder="pochta@example.ru"
            autoComplete="email"
            inputMode="email"
            invalid={Boolean(fieldErrors.email)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby="checkout-email-hint"
            aria-errormessage={fieldErrors.email ? 'checkout-email-error' : undefined}
            required
            disabled={disabled}
          />
          <p id="checkout-email-hint" className="mt-1.5 text-xs text-muted">Пришлём чек и статус заказа.</p>
          <FieldError id="checkout-email-error">{fieldErrors.email}</FieldError>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="checkout-customer-name">Имя получателя</label>
          <Input
            id="checkout-customer-name"
            type="text"
            value={customerName}
            onChange={(event) => onCustomerNameChange(event.target.value)}
            placeholder="Иван Иванов"
            autoComplete="name"
            invalid={Boolean(fieldErrors.customerName)}
            aria-invalid={Boolean(fieldErrors.customerName)}
            aria-errormessage={fieldErrors.customerName ? 'checkout-customer-name-error' : undefined}
            required
            disabled={disabled}
          />
          <FieldError id="checkout-customer-name-error">{fieldErrors.customerName}</FieldError>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="checkout-phone">Телефон</label>
          <Input
            id="checkout-phone"
            type="tel"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            placeholder="+7 900 000-00-00"
            autoComplete="tel"
            inputMode="tel"
            invalid={Boolean(fieldErrors.phone)}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-errormessage={fieldErrors.phone ? 'checkout-phone-error' : undefined}
            required
            disabled={disabled}
          />
          <FieldError id="checkout-phone-error">{fieldErrors.phone}</FieldError>
        </div>
      </div>

      {isAuthenticated ? (
        <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={savePaymentMethod}
            onChange={(event) => onSavePaymentMethodChange(event.target.checked)}
            disabled={disabled}
          />
          <span>Сохранить карту для будущих покупок</span>
        </label>
      ) : null}
    </section>
  );
}

export default ContactStep;

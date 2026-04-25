import React from 'react';
import { Button, Card, FieldError, Input } from '../../components/ui';

function ContactStep({
  active,
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
  onContinue,
  onEdit,
  disabled = false
}) {
  return (
    <Card as="section" padding="lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">1</span>
          <div>
            <h2 className="text-2xl font-semibold">Контакты</h2>
            <p className="text-sm text-muted">Нужны имя, телефон и email для заказа и связи менеджера.</p>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted">Электронная почта (обязательно)</span>
              <Input
                id="checkout-email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                onBlur={onEmailBlur}
                placeholder="email@example.ru"
                className={`mt-2 w-full ${fieldErrors.email ? 'input-error' : ''}`}
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-errormessage={fieldErrors.email ? 'checkout-email-error' : undefined}
                required
                disabled={disabled}
              />
              <FieldError id="checkout-email-error">{fieldErrors.email}</FieldError>
            </label>

            <label className="block text-sm">
              <span className="text-muted">Имя (обязательно)</span>
              <Input
                id="checkout-customer-name"
                type="text"
                value={customerName}
                onChange={(event) => onCustomerNameChange(event.target.value)}
                placeholder="Иван Иванов"
                className={`mt-2 w-full ${fieldErrors.customerName ? 'input-error' : ''}`}
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.customerName)}
                aria-errormessage={fieldErrors.customerName ? 'checkout-customer-name-error' : undefined}
                required
                disabled={disabled}
              />
              <FieldError id="checkout-customer-name-error">{fieldErrors.customerName}</FieldError>
            </label>

            <label className="block text-sm">
              <span className="text-muted">Телефон (обязательно)</span>
              <Input
                id="checkout-phone"
                type="tel"
                value={phone}
                onChange={(event) => onPhoneChange(event.target.value)}
                placeholder="+7 900 000-00-00"
                className={`mt-2 w-full ${fieldErrors.phone ? 'input-error' : ''}`}
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-errormessage={fieldErrors.phone ? 'checkout-phone-error' : undefined}
                required
                disabled={disabled}
              />
              <FieldError id="checkout-phone-error">{fieldErrors.phone}</FieldError>
            </label>
          </div>

          {isAuthenticated ? (
            <label className="mt-3 flex items-center gap-3 text-sm text-ink/90">
              <input
                type="checkbox"
                checked={savePaymentMethod}
                onChange={(event) => onSavePaymentMethodChange(event.target.checked)}
                disabled={disabled}
              />
              <span>Сохранить карту для будущих покупок</span>
            </label>
          ) : null}

          <Button className="mt-5" onClick={onContinue} disabled={disabled}>
            К адресу
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">
          {customerName || 'Имя не указано'} · {phone || 'телефон не указан'} · {email || 'email не указан'}
        </p>
      )}
    </Card>
  );
}

export default ContactStep;

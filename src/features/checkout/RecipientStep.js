import React from 'react';
import { Button, Card, FieldError, Input } from '../../components/ui';

function RecipientStep({
  active,
  recipientFirstName,
  recipientLastName,
  recipientPhone,
  fieldErrors,
  onRecipientFirstNameChange,
  onRecipientLastNameChange,
  onRecipientPhoneChange,
  onContinue,
  onEdit,
  disabled = false
}) {
  return (
    <Card as="section" padding="lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">2</span>
          <div>
            <h2 className="text-2xl font-semibold">Получатель</h2>
            <p className="text-sm text-muted">Нужны только данные для доставки.</p>
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
            <label className="block text-sm">
              <span className="text-muted">Имя (обязательно)</span>
              <Input
                id="checkout-recipient-first-name"
                type="text"
                value={recipientFirstName}
                onChange={(event) => onRecipientFirstNameChange(event.target.value)}
                placeholder="Имя"
                className={`mt-2 w-full ${fieldErrors.recipientFirstName ? 'input-error' : ''}`}
                autoComplete="shipping given-name"
                aria-invalid={Boolean(fieldErrors.recipientFirstName)}
                aria-errormessage={fieldErrors.recipientFirstName ? 'checkout-recipient-first-name-error' : undefined}
                required
                disabled={disabled}
              />
              <FieldError id="checkout-recipient-first-name-error">
                {fieldErrors.recipientFirstName}
              </FieldError>
            </label>
            <label className="block text-sm">
              <span className="text-muted">Фамилия (необязательно)</span>
              <Input
                id="checkout-recipient-last-name"
                type="text"
                value={recipientLastName}
                onChange={(event) => onRecipientLastNameChange(event.target.value)}
                placeholder="Фамилия"
                className="mt-2 w-full"
                autoComplete="shipping family-name"
                disabled={disabled}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted">Телефон (обязательно)</span>
              <Input
                id="checkout-recipient-phone"
                type="tel"
                value={recipientPhone}
                onChange={(event) => onRecipientPhoneChange(event.target.value)}
                placeholder="+7 900 000-00-00"
                className={`mt-2 w-full ${fieldErrors.recipientPhone ? 'input-error' : ''}`}
                autoComplete="shipping tel"
                inputMode="tel"
                aria-invalid={Boolean(fieldErrors.recipientPhone)}
                aria-errormessage={fieldErrors.recipientPhone ? 'checkout-recipient-phone-error' : undefined}
                required
                disabled={disabled}
              />
              <FieldError id="checkout-recipient-phone-error">{fieldErrors.recipientPhone}</FieldError>
              <p className="mt-1 text-xs text-muted">Номер нужен, чтобы курьер мог уточнить детали доставки.</p>
            </label>
          </div>

          <Button className="mt-5" onClick={onContinue} disabled={disabled}>
            Продолжить
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">
          {recipientFirstName} {recipientLastName} · {recipientPhone}
        </p>
      )}
    </Card>
  );
}

export default RecipientStep;

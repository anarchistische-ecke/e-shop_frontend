import React from 'react';

function ContactStep({
  active,
  email,
  savePaymentMethod,
  isAuthenticated,
  fieldErrors,
  onEmailChange,
  onEmailBlur,
  onSavePaymentMethodChange,
  onContinue,
  onEdit,
  disabled = false
}) {
  return (
    <section className="soft-card p-6 md:p-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">1</span>
          <div>
            <h2 className="text-2xl font-semibold">Контакт для чека</h2>
            <p className="text-sm text-muted">Письмо с заказом придёт на этот email.</p>
          </div>
        </div>
        {!active ? (
          <button type="button" className="button-ghost text-xs" onClick={onEdit} disabled={disabled}>Изменить</button>
        ) : null}
      </div>

      {active ? (
        <>
          <label className="block text-sm">
            <span className="text-muted">Электронная почта (обязательно)</span>
            <input
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
            {fieldErrors.email ? (
              <p id="checkout-email-error" className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
                <span aria-hidden="true">⚠</span>
                <span>{fieldErrors.email}</span>
              </p>
            ) : null}
          </label>

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

          <button type="button" className="button mt-5" onClick={onContinue} disabled={disabled}>
            Продолжить
          </button>
        </>
      ) : (
        <p className="text-sm text-muted">{email}</p>
      )}
    </section>
  );
}

export default ContactStep;

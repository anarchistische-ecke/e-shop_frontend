import React from 'react';

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
    <section className="soft-card p-6 md:p-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">2</span>
          <div>
            <h2 className="text-2xl font-semibold">Получатель</h2>
            <p className="text-sm text-muted">Нужны только данные для доставки.</p>
          </div>
        </div>
        {!active ? (
          <button type="button" className="button-ghost text-xs" onClick={onEdit} disabled={disabled}>Изменить</button>
        ) : null}
      </div>

      {active ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted">Имя (обязательно)</span>
              <input
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
              {fieldErrors.recipientFirstName ? (
                <p id="checkout-recipient-first-name-error" className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
                  <span aria-hidden="true">⚠</span>
                  <span>{fieldErrors.recipientFirstName}</span>
                </p>
              ) : null}
            </label>
            <label className="block text-sm">
              <span className="text-muted">Фамилия (необязательно)</span>
              <input
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
              <input
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
              {fieldErrors.recipientPhone ? (
                <p id="checkout-recipient-phone-error" className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
                  <span aria-hidden="true">⚠</span>
                  <span>{fieldErrors.recipientPhone}</span>
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted">Номер нужен, чтобы курьер мог уточнить детали доставки.</p>
            </label>
          </div>

          <button type="button" className="button mt-5" onClick={onContinue} disabled={disabled}>
            Продолжить
          </button>
        </>
      ) : (
        <p className="text-sm text-muted">
          {recipientFirstName} {recipientLastName} · {recipientPhone}
        </p>
      )}
    </section>
  );
}

export default RecipientStep;

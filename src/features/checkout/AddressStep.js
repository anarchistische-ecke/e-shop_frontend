import React from 'react';
import { Button, Card, FieldError, Textarea } from '../../components/ui';

function AddressStep({
  active,
  homeAddress,
  deliveryNotice,
  fieldErrors,
  onHomeAddressChange,
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
            <h2 className="text-2xl font-semibold">Адрес</h2>
            <p className="text-sm text-muted">Укажите домашний адрес. Доставку согласует менеджер.</p>
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
          <label className="block text-sm">
            <span className="text-muted">Домашний адрес (обязательно)</span>
            <Textarea
              id="checkout-home-address"
              value={homeAddress}
              onChange={(event) => onHomeAddressChange(event.target.value)}
              placeholder="Город, улица, дом, квартира"
              className={`mt-2 w-full ${fieldErrors.homeAddress ? 'input-error' : ''}`}
              autoComplete="shipping street-address"
              aria-invalid={Boolean(fieldErrors.homeAddress)}
              aria-errormessage={fieldErrors.homeAddress ? 'checkout-home-address-error' : undefined}
              required
              rows={4}
              disabled={disabled}
            />
            <FieldError id="checkout-home-address-error">{fieldErrors.homeAddress}</FieldError>
          </label>

          <div className="mt-4 rounded-lg border border-ink/10 bg-white/90 p-3 text-sm text-ink/90">
            {deliveryNotice}
          </div>

          <Button className="mt-5" onClick={onContinue} disabled={disabled}>
            К подтверждению
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">{homeAddress || 'Адрес не указан'}</p>
      )}
    </Card>
  );
}

export default AddressStep;

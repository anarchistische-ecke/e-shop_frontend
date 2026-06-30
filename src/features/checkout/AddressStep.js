import React from 'react';
import { Button, Card, FieldError, Input } from '../../components/ui';

function AddressStep({
  active,
  homeAddress,
  addressParts = {},
  deliveryNotice,
  fieldErrors,
  onHomeAddressChange,
  onAddressPartChange,
  onContinue,
  onEdit,
  disabled = false
}) {
  const handlePartChange = (field) => (event) => {
    if (onAddressPartChange) {
      onAddressPartChange(field, event.target.value);
      return;
    }
    onHomeAddressChange(event.target.value);
  };

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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted">Индекс</span>
              <Input
                id="checkout-postal-code"
                value={addressParts.postalCode || ''}
                onChange={handlePartChange('postalCode')}
                placeholder="350000"
                inputMode="numeric"
                autoComplete="shipping postal-code"
                disabled={disabled}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Город (обязательно)</span>
              <Input
                id="checkout-city"
                value={addressParts.city || ''}
                onChange={handlePartChange('city')}
                placeholder="Краснодар"
                autoComplete="shipping address-level2"
                aria-invalid={Boolean(fieldErrors.homeAddress)}
                disabled={disabled}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted">Улица, дом (обязательно)</span>
              <Input
                id="checkout-home-address"
                value={addressParts.street || ''}
                onChange={handlePartChange('street')}
                placeholder="ул. Красная, 1"
                autoComplete="shipping street-address"
                aria-invalid={Boolean(fieldErrors.homeAddress)}
                aria-errormessage={fieldErrors.homeAddress ? 'checkout-home-address-error' : undefined}
                disabled={disabled}
                required
              />
              <FieldError id="checkout-home-address-error">{fieldErrors.homeAddress}</FieldError>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted">Квартира, подъезд, комментарий</span>
              <Input
                value={addressParts.address2 || ''}
                onChange={handlePartChange('address2')}
                placeholder="кв. 12, подъезд 3"
                autoComplete="shipping address-line2"
                disabled={disabled}
              />
            </label>
          </div>

          <div className="mt-4 rounded-lg border border-ink/10 bg-white/90 p-3 text-sm text-ink/90">
            {deliveryNotice}
          </div>

          <Button className="mt-5" onClick={onContinue} disabled={disabled}>
            К доставке
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">{homeAddress || 'Адрес не указан'}</p>
      )}
    </Card>
  );
}

export default AddressStep;

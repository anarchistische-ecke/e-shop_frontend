import React from 'react';
import { Button, FieldError, Input } from '../../components/ui';
import DeliveryQuoteLink from '../../components/commerce/DeliveryQuoteLink';

function AddressStep({
  addressParts = {},
  deliveryNotice,
  fieldErrors,
  onAddressPartChange,
  submitLabel,
  primaryActionRef,
  disabled = false
}) {
  const handlePartChange = (field) => (event) => onAddressPartChange(field, event.target.value);
  const hasAddressError = Boolean(fieldErrors.homeAddress);
  const addressErrorId = hasAddressError ? 'checkout-home-address-error' : undefined;

  return (
    <section className="mt-6 border-t border-ink/10 pt-6 sm:mt-8 sm:pt-7" aria-labelledby="checkout-address-title">
      <h2 id="checkout-address-title" tabIndex={-1} className="mb-4 text-2xl font-semibold">Адрес доставки</h2>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="checkout-city">Город</label>
          <Input
            id="checkout-city"
            value={addressParts.city || ''}
            onChange={handlePartChange('city')}
            placeholder="Краснодар"
            autoComplete="shipping address-level2"
            invalid={hasAddressError}
            aria-invalid={hasAddressError}
            aria-errormessage={addressErrorId}
            required
            disabled={disabled}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="checkout-postal-code">
            Индекс <span className="font-normal text-muted">(необязательно)</span>
          </label>
          <Input
            id="checkout-postal-code"
            value={addressParts.postalCode || ''}
            onChange={handlePartChange('postalCode')}
            placeholder="350000"
            inputMode="numeric"
            autoComplete="shipping postal-code"
            disabled={disabled}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="checkout-home-address">Улица, дом</label>
          <Input
            id="checkout-home-address"
            value={addressParts.street || ''}
            onChange={handlePartChange('street')}
            placeholder="ул. Красная, 1"
            autoComplete="shipping address-line1"
            invalid={hasAddressError}
            aria-invalid={hasAddressError}
            aria-errormessage={addressErrorId}
            required
            disabled={disabled}
          />
          <FieldError id="checkout-home-address-error">{fieldErrors.homeAddress}</FieldError>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium" htmlFor="checkout-address-extra">
            Квартира, подъезд, комментарий <span className="font-normal text-muted">(необязательно)</span>
          </label>
          <Input
            id="checkout-address-extra"
            value={addressParts.address2 || ''}
            onChange={handlePartChange('address2')}
            placeholder="кв. 12, подъезд 3"
            autoComplete="shipping address-line2"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="mt-4 text-sm leading-relaxed text-muted">
        <p>{deliveryNotice}</p>
        <DeliveryQuoteLink disabled={disabled} />
      </div>
      <Button ref={primaryActionRef} type="submit" className="mt-2 w-full sm:w-auto" disabled={disabled}>
        {submitLabel}
      </Button>
    </section>
  );
}

export default AddressStep;

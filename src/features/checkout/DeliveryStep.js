import React from 'react';
import { Button, Card, FieldError, Input, Tabs } from '../../components/ui';

function DeliveryStep({
  active,
  deliveryType,
  deliveryAddress,
  deliveryAddressDetails,
  showDeliveryAddressDetails,
  pickupLocation,
  pickupLocationHint,
  pickupLocationSuggestion,
  pickupGeoId,
  selectedPickupPoint,
  selectedPickupPointName,
  pickupLoading,
  pickupAutoDetecting,
  deliveryLoading,
  deliveryError,
  deliveryOffers,
  selectedOfferId,
  fieldErrors,
  formatInterval,
  formatRub,
  moneyToNumber,
  reviewDeliveryLabel,
  onDeliveryTypeChange,
  onDeliveryAddressChange,
  onDeliveryAddressDetailsChange,
  onToggleDeliveryAddressDetails,
  onPickupLocationChange,
  onPickupSearch,
  onOpenPickupMap,
  onConfirmPickupLocationSuggestion,
  onDismissPickupLocationSuggestion,
  onOfferSelect,
  onFetchOffers,
  onContinue,
  onEdit,
  disabled = false
}) {
  return (
    <Card as="section" padding="lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">3</span>
          <div>
            <h2 className="text-2xl font-semibold">Доставка</h2>
            <p className="text-sm text-muted">Сначала выбираете интервал и стоимость, потом переходите к оплате.</p>
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
          <Tabs
            ariaLabel="Тип доставки"
            value={deliveryType}
            onChange={onDeliveryTypeChange}
            idBase="checkout-delivery-type"
            items={[
              { value: 'COURIER', label: 'Курьер' },
              { value: 'PICKUP', label: 'Пункт выдачи' }
            ]}
            listClassName="!inline-flex !w-auto"
          />

          {deliveryType === 'COURIER' ? (
            <div
              id="checkout-delivery-type-panel-COURIER"
              role="tabpanel"
              aria-labelledby="checkout-delivery-type-tab-COURIER"
              tabIndex={0}
              className="mt-4"
            >
              <label className="block text-sm">
                <span className="text-muted">Адрес доставки (обязательно)</span>
                <Input
                  id="checkout-delivery-address"
                  type="text"
                  value={deliveryAddress}
                  onChange={(event) => onDeliveryAddressChange(event.target.value)}
                  placeholder="Город, улица, дом"
                  className={`mt-2 w-full ${fieldErrors.deliveryAddress ? 'input-error' : ''}`}
                  autoComplete="shipping street-address"
                  aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                  aria-errormessage={fieldErrors.deliveryAddress ? 'checkout-delivery-address-error' : undefined}
                  required
                  disabled={disabled}
                />
                <FieldError id="checkout-delivery-address-error">
                  {fieldErrors.deliveryAddress}
                </FieldError>
              </label>

              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                aria-expanded={showDeliveryAddressDetails}
                aria-controls="checkout-delivery-address-details"
                onClick={onToggleDeliveryAddressDetails}
                disabled={disabled}
              >
                {showDeliveryAddressDetails ? 'Скрыть доп. адресные данные' : 'Добавить квартиру, подъезд или код домофона'}
              </Button>

              {showDeliveryAddressDetails ? (
                <label id="checkout-delivery-address-details" className="mt-2 block text-sm">
                  <span className="text-muted">Дополнительная строка адреса (необязательно)</span>
                  <Input
                    id="checkout-delivery-address-line2"
                    type="text"
                    value={deliveryAddressDetails}
                    onChange={(event) => onDeliveryAddressDetailsChange(event.target.value)}
                    placeholder="Кв/офис, подъезд, этаж, домофон"
                    className="mt-2 w-full"
                    autoComplete="shipping address-line2"
                    disabled={disabled}
                  />
                </label>
              ) : null}
            </div>
          ) : (
            <div
              id="checkout-delivery-type-panel-PICKUP"
              role="tabpanel"
              aria-labelledby="checkout-delivery-type-tab-PICKUP"
              tabIndex={0}
              className="mt-4 space-y-3"
            >
              <label className="block text-sm">
                <span className="text-muted">Город или адрес (обязательно)</span>
                <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <Input
                    id="checkout-pickup-location"
                    type="text"
                    value={pickupLocation}
                    onChange={(event) => onPickupLocationChange(event.target.value)}
                    placeholder="Например, Санкт-Петербург"
                    className={`w-full ${fieldErrors.pickupLocation ? 'input-error' : ''}`}
                    aria-invalid={Boolean(fieldErrors.pickupLocation)}
                    aria-errormessage={fieldErrors.pickupLocation ? 'checkout-pickup-location-error' : undefined}
                    disabled={disabled}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={onPickupSearch}
                    disabled={pickupLoading || disabled}
                  >
                    {pickupLoading ? 'Ищем…' : 'Найти пункты'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={onOpenPickupMap}
                    disabled={disabled}
                  >
                    {pickupAutoDetecting ? 'Определяем город…' : 'Открыть карту'}
                  </Button>
                </div>
                <FieldError id="checkout-pickup-location-error">{fieldErrors.pickupLocation}</FieldError>
              </label>

              {pickupLocationSuggestion ? (
                <Card variant="tint" padding="sm" className="text-sm text-ink/90">
                  <p className="font-semibold">{pickupLocationSuggestion.title}</p>
                  <p className="mt-1 text-xs text-muted">{pickupLocationSuggestion.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="text-sm"
                      onClick={onConfirmPickupLocationSuggestion}
                      disabled={pickupLoading || pickupAutoDetecting || disabled}
                    >
                      Использовать {pickupLocationSuggestion.city}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm"
                      onClick={onDismissPickupLocationSuggestion}
                      disabled={disabled}
                    >
                      Ввести вручную
                    </Button>
                  </div>
                </Card>
              ) : null}

              {pickupLocationHint ? (
                <Card variant="quiet" padding="sm" className="text-sm text-ink/90">
                  <p className="font-semibold">{pickupLocationHint.title}</p>
                  <p className="mt-1 text-xs text-muted">{pickupLocationHint.message}</p>
                </Card>
              ) : null}

              {pickupGeoId ? (
                <div className="text-xs text-muted">GeoID региона: {pickupGeoId}</div>
              ) : null}

              {selectedPickupPoint ? (
                <Card variant="tint" padding="sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-ink">{selectedPickupPoint.name || 'Пункт выдачи'}</div>
                      <div className="mt-1 text-xs text-muted">{selectedPickupPoint.address || 'Адрес уточняется'}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!px-2 !py-1 text-xs"
                      onClick={onOpenPickupMap}
                      disabled={disabled}
                    >
                      Изменить
                    </Button>
                  </div>
                  {!selectedPickupPoint.id ? (
                    <div className="mt-2 text-xs text-red-600">
                      Для этой точки нет идентификатора. Выберите другой пункт.
                    </div>
                  ) : null}
                </Card>
              ) : (
                <p className="text-xs text-muted">Сначала найдите пункт выдачи по адресу или городу.</p>
              )}

              <FieldError>{fieldErrors.selectedPickupPointId}</FieldError>
            </div>
          )}

          <Card variant="quiet" padding="sm" className="mt-5 bg-white/80">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Варианты доставки</h3>
                <p className="text-xs text-muted mt-1">Стоимость обновляется автоматически после заполнения адреса.</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="text-sm"
                onClick={onFetchOffers}
                disabled={deliveryLoading || disabled}
              >
                {deliveryLoading ? 'Рассчитываем…' : 'Рассчитать'}
              </Button>
            </div>

            {deliveryError ? (
              <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {deliveryError}
              </div>
            ) : null}

            {fieldErrors.selectedOfferId ? (
              <FieldError className="mb-3 mt-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                {fieldErrors.selectedOfferId}
              </FieldError>
            ) : null}

            {deliveryOffers.length > 0 ? (
              <div className="space-y-2">
                {deliveryOffers.map((offer) => {
                  const price = offer.pricingTotal || offer.pricing;
                  const priceValue = price ? moneyToNumber(price) : 0;
                  const expiresAt = offer.expiresAt ? new Date(offer.expiresAt) : null;
                  const expiresLabel =
                    expiresAt && !Number.isNaN(expiresAt.getTime())
                      ? expiresAt.toLocaleString('ru-RU')
                      : null;

                  return (
                    <label
                      key={offer.offerId}
                      className={`flex cursor-pointer items-start justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                        selectedOfferId === offer.offerId
                          ? 'border-primary/35 bg-primary/10 shadow-[0_14px_24px_rgba(182,91,74,0.16)]'
                          : 'border-ink/10 bg-white hover:border-primary/30 hover:bg-secondary/35'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="deliveryOffer"
                          checked={selectedOfferId === offer.offerId}
                          onChange={() => onOfferSelect(offer.offerId)}
                          disabled={disabled}
                        />
                        <div>
                          <div className="text-sm font-semibold text-ink">
                            {deliveryType === 'PICKUP' ? 'Самовывоз' : 'Курьер'} · {formatInterval(offer)}
                          </div>
                          {expiresLabel ? (
                            <div className="mt-1 text-xs text-muted">Актуально до {expiresLabel}</div>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">{formatRub(priceValue)}</div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted">
                Нажмите «Рассчитать», чтобы получить доступные интервалы и финальную стоимость.
              </p>
            )}
          </Card>

          <Button className="mt-5" onClick={onContinue} disabled={disabled}>
            Продолжить
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">{reviewDeliveryLabel}</p>
      )}
    </Card>
  );
}

export default DeliveryStep;

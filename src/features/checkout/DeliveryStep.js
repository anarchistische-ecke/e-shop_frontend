import React from 'react';

function DeliveryStep({
  active,
  deliveryType,
  deliveryAddress,
  deliveryAddressDetails,
  showDeliveryAddressDetails,
  pickupLocation,
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
  onOfferSelect,
  onFetchOffers,
  onContinue,
  onEdit,
  disabled = false
}) {
  return (
    <section className="soft-card p-6 md:p-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">3</span>
          <div>
            <h2 className="text-2xl font-semibold">Доставка</h2>
            <p className="text-sm text-muted">Сначала выбираете интервал и стоимость, потом переходите к оплате.</p>
          </div>
        </div>
        {!active ? (
          <button type="button" className="button-ghost text-xs" onClick={onEdit} disabled={disabled}>Изменить</button>
        ) : null}
      </div>

      {active ? (
        <>
          <div className="rounded-2xl border border-ink/10 bg-secondary/55 p-1 inline-flex gap-1">
            <button
              type="button"
              onClick={() => onDeliveryTypeChange('COURIER')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                deliveryType === 'COURIER'
                  ? 'bg-white text-ink shadow-[0_10px_20px_rgba(43,39,34,0.12)]'
                  : 'text-muted hover:text-ink'
              }`}
              disabled={disabled}
            >
              Курьер
            </button>
            <button
              type="button"
              onClick={() => onDeliveryTypeChange('PICKUP')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                deliveryType === 'PICKUP'
                  ? 'bg-white text-ink shadow-[0_10px_20px_rgba(43,39,34,0.12)]'
                  : 'text-muted hover:text-ink'
              }`}
              disabled={disabled}
            >
              Пункт выдачи
            </button>
          </div>

          {deliveryType === 'COURIER' ? (
            <div className="mt-4">
              <label className="block text-sm">
                <span className="text-muted">Адрес доставки (обязательно)</span>
                <input
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
                {fieldErrors.deliveryAddress ? (
                  <p id="checkout-delivery-address-error" className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
                    <span aria-hidden="true">⚠</span>
                    <span>{fieldErrors.deliveryAddress}</span>
                  </p>
                ) : null}
              </label>

              <button
                type="button"
                className="button-ghost mt-2 text-xs"
                aria-expanded={showDeliveryAddressDetails}
                aria-controls="checkout-delivery-address-details"
                onClick={onToggleDeliveryAddressDetails}
                disabled={disabled}
              >
                {showDeliveryAddressDetails ? 'Скрыть доп. адресные данные' : 'Добавить квартиру, подъезд или код домофона'}
              </button>

              {showDeliveryAddressDetails ? (
                <label id="checkout-delivery-address-details" className="mt-2 block text-sm">
                  <span className="text-muted">Дополнительная строка адреса (необязательно)</span>
                  <input
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
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-muted">Город или адрес (обязательно)</span>
                <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <input
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
                  <button
                    type="button"
                    className="button-gray text-sm whitespace-nowrap"
                    onClick={onPickupSearch}
                    disabled={pickupLoading || disabled}
                  >
                    {pickupLoading ? 'Ищем…' : 'Найти пункты'}
                  </button>
                  <button
                    type="button"
                    className="button-ghost text-sm whitespace-nowrap"
                    onClick={onOpenPickupMap}
                    disabled={disabled}
                  >
                    {pickupAutoDetecting ? 'Определяем город…' : 'Открыть карту'}
                  </button>
                </div>
                {fieldErrors.pickupLocation ? (
                  <p id="checkout-pickup-location-error" className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
                    <span aria-hidden="true">⚠</span>
                    <span>{fieldErrors.pickupLocation}</span>
                  </p>
                ) : null}
              </label>

              {pickupGeoId ? (
                <div className="text-xs text-muted">GeoID региона: {pickupGeoId}</div>
              ) : null}

              {selectedPickupPoint ? (
                <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-ink">{selectedPickupPoint.name || 'Пункт выдачи'}</div>
                      <div className="mt-1 text-xs text-muted">{selectedPickupPoint.address || 'Адрес уточняется'}</div>
                    </div>
                    <button
                      type="button"
                      className="button-ghost !px-2 !py-1 text-xs"
                      onClick={onOpenPickupMap}
                      disabled={disabled}
                    >
                      Изменить
                    </button>
                  </div>
                  {!selectedPickupPoint.id ? (
                    <div className="mt-2 text-xs text-red-600">
                      Для этой точки нет идентификатора. Выберите другой пункт.
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted">Сначала найдите пункт выдачи по адресу или городу.</p>
              )}

              {fieldErrors.selectedPickupPointId ? (
                <p className="text-xs text-red-700">{fieldErrors.selectedPickupPointId}</p>
              ) : null}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-ink/10 bg-white/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Варианты доставки</h3>
                <p className="text-xs text-muted mt-1">Стоимость обновляется автоматически после заполнения адреса.</p>
              </div>
              <button
                type="button"
                className="button-gray text-sm"
                onClick={onFetchOffers}
                disabled={deliveryLoading || disabled}
              >
                {deliveryLoading ? 'Рассчитываем…' : 'Рассчитать'}
              </button>
            </div>

            {deliveryError ? (
              <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {deliveryError}
              </div>
            ) : null}

            {fieldErrors.selectedOfferId ? (
              <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true">⚠</span>
                  <span>{fieldErrors.selectedOfferId}</span>
                </span>
              </div>
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
          </div>

          <button type="button" className="button mt-5" onClick={onContinue} disabled={disabled}>
            Продолжить
          </button>
        </>
      ) : (
        <p className="text-sm text-muted">{reviewDeliveryLabel}</p>
      )}
    </section>
  );
}

export default DeliveryStep;

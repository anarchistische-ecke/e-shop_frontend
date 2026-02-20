import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { checkoutCart, getYandexDeliveryOffers, getYandexPickupPoints } from '../api';
import { moneyToNumber } from '../utils/product';
import { useAuth } from '../contexts/AuthContext';
import PickupMapModal from '../components/PickupMapModal';

function pickupUiId(point, index = 0) {
  const lat = Number(point?.latitude);
  const lon = Number(point?.longitude);
  const coordToken = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat}-${lon}` : `point-${index}`;
  return point?.id || `${coordToken}-${index}`;
}

function CheckoutPage() {
  const { items, cartId, clearCart } = useContext(CartContext);
  const { tokenParsed, isAuthenticated, hasRole } = useAuth();
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);

  const [email, setEmail] = useState('');
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [deliveryType, setDeliveryType] = useState('COURIER');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupGeoId, setPickupGeoId] = useState(null);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [selectedPickupPointId, setSelectedPickupPointId] = useState('');
  const [selectedPickupPointUiId, setSelectedPickupPointUiId] = useState('');
  const [selectedPickupPointName, setSelectedPickupPointName] = useState('');

  const [deliveryOffers, setDeliveryOffers] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState('');

  const [pickupLoading, setPickupLoading] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [isPickupMapOpen, setIsPickupMapOpen] = useState(false);

  useEffect(() => {
    if (!email) {
      const fallbackEmail =
        tokenParsed?.email
        || tokenParsed?.preferred_username
        || tokenParsed?.username
        || '';
      if (fallbackEmail) {
        setEmail(fallbackEmail);
      }
    }
    if (!recipientFirstName && tokenParsed?.given_name) {
      setRecipientFirstName(tokenParsed.given_name);
    }
    if (!recipientLastName && tokenParsed?.family_name) {
      setRecipientLastName(tokenParsed.family_name);
    }
    if (!recipientPhone && tokenParsed?.phone_number) {
      setRecipientPhone(tokenParsed.phone_number);
    }
  }, [email, recipientFirstName, recipientLastName, recipientPhone, tokenParsed]);

  useEffect(() => {
    setDeliveryOffers([]);
    setSelectedOfferId('');
    setDeliveryError('');
  }, [deliveryType, deliveryAddress, selectedPickupPointId]);

  useEffect(() => {
    setPickupPoints([]);
    setSelectedPickupPointId('');
    setSelectedPickupPointUiId('');
    setSelectedPickupPointName('');
    setPickupGeoId(null);
  }, [pickupLocation]);

  if (isManager) {
    return <Navigate to="/cart" replace />;
  }

  const enrichedPickupPoints = useMemo(
    () => pickupPoints.map((point, index) => ({ ...point, __uiId: pickupUiId(point, index) })),
    [pickupPoints]
  );

  const selectedPickupPoint = useMemo(() => {
    if (!enrichedPickupPoints.length) return null;
    if (selectedPickupPointId) {
      const byServerId = enrichedPickupPoints.find((point) => point.id === selectedPickupPointId);
      if (byServerId) return byServerId;
    }
    if (selectedPickupPointUiId) {
      return enrichedPickupPoints.find((point) => point.__uiId === selectedPickupPointUiId) || null;
    }
    return null;
  }, [enrichedPickupPoints, selectedPickupPointId, selectedPickupPointUiId]);

  const total = useMemo(
    () => items.reduce(
      (sum, item) => sum + (item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity,
      0
    ),
    [items]
  );

  const selectedOffer = useMemo(
    () => deliveryOffers.find((offer) => offer.offerId === selectedOfferId),
    [deliveryOffers, selectedOfferId]
  );

  const deliveryAmount = useMemo(() => {
    const price = selectedOffer?.pricingTotal || selectedOffer?.pricing;
    return price ? moneyToNumber(price) : 0;
  }, [selectedOffer]);

  const totalWithDelivery = total + deliveryAmount;
  const deliveryLabel = selectedOfferId ? `${deliveryAmount.toLocaleString('ru-RU')} ₽` : '—';
  const payableTotal = selectedOfferId ? totalWithDelivery : total;

  const formatInterval = (offer) => {
    if (!offer?.intervalFrom || !offer?.intervalTo) return 'Интервал уточняется';
    const from = new Date(offer.intervalFrom);
    const to = new Date(offer.intervalTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 'Интервал уточняется';
    const dateLabel = from.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
    const fromTime = from.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const toTime = to.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${dateLabel}, ${fromTime}–${toTime}`;
  };

  const ensureRecipientInfo = () => {
    if (!recipientFirstName.trim()) {
      setDeliveryError('Укажите имя получателя.');
      return false;
    }
    if (!recipientPhone.trim()) {
      setDeliveryError('Укажите телефон получателя.');
      return false;
    }
    return true;
  };

  const applyPickupSelection = (point) => {
    if (!point) return;
    setSelectedPickupPointId(point.id || '');
    setSelectedPickupPointUiId(point.__uiId || pickupUiId(point, 0));
    setSelectedPickupPointName(point.name || point.address || '');
    setDeliveryError('');
  };

  const handlePickupSearch = async () => {
    setDeliveryError('');
    if (!pickupLocation.trim()) {
      setDeliveryError('Укажите город или адрес для поиска пунктов выдачи.');
      return;
    }

    setPickupLoading(true);
    try {
      const response = await getYandexPickupPoints({ location: pickupLocation.trim() });
      const points = Array.isArray(response?.points) ? response.points : [];
      const pointsWithUi = points.map((point, index) => ({ ...point, __uiId: pickupUiId(point, index) }));

      setPickupPoints(points);
      setPickupGeoId(response?.geoId ?? null);

      if (pointsWithUi.length > 0) {
        const firstSelectable = pointsWithUi.find((point) => Boolean(point.id)) || pointsWithUi[0];
        applyPickupSelection(firstSelectable);
      } else {
        setSelectedPickupPointId('');
        setSelectedPickupPointUiId('');
        setSelectedPickupPointName('');
      }
    } catch (err) {
      console.error('Failed to load pickup points:', err);
      setDeliveryError('Не удалось загрузить пункты выдачи. Попробуйте ещё раз.');
    } finally {
      setPickupLoading(false);
    }
  };

  const handleFetchOffers = async () => {
    setDeliveryError('');

    if (!items.length) {
      setDeliveryError('Корзина пуста.');
      return;
    }
    if (!ensureRecipientInfo()) {
      return;
    }
    if (deliveryType === 'COURIER' && !deliveryAddress.trim()) {
      setDeliveryError('Укажите адрес доставки.');
      return;
    }
    if (deliveryType === 'PICKUP' && !selectedPickupPointId) {
      setDeliveryError('Выберите пункт выдачи на карте или в списке.');
      return;
    }

    setDeliveryLoading(true);
    try {
      const id = cartId || localStorage.getItem('cartId');
      const response = await getYandexDeliveryOffers({
        cartId: id,
        deliveryType,
        address: deliveryType === 'COURIER' ? deliveryAddress.trim() : null,
        pickupPointId: deliveryType === 'PICKUP' ? selectedPickupPointId : null,
        pickupPointName: deliveryType === 'PICKUP' ? selectedPickupPointName : null,
        firstName: recipientFirstName.trim(),
        lastName: recipientLastName.trim(),
        phone: recipientPhone.trim(),
        email: email.trim()
      });

      const offers = response?.offers || [];
      setDeliveryOffers(offers);
      setSelectedOfferId(offers.length ? offers[0].offerId : '');

      if (!offers.length) {
        setDeliveryError('По выбранным параметрам нет доступных интервалов. Уточните адрес или пункт выдачи.');
      }
    } catch (err) {
      console.error('Failed to load delivery offers:', err);
      setDeliveryError('Не удалось рассчитать доставку. Попробуйте ещё раз.');
      setDeliveryOffers([]);
      setSelectedOfferId('');
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!items.length) {
      setStatus({ type: 'error', message: 'Корзина пуста. Добавьте товары перед оформлением заказа.' });
      return;
    }
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Укажите email для отправки чека и деталей заказа.' });
      return;
    }
    if (!selectedOfferId) {
      setStatus({ type: 'error', message: 'Выберите способ доставки и рассчитайте стоимость.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const id = cartId || localStorage.getItem('cartId');
      const response = await checkoutCart({
        cartId: id,
        receiptEmail: email.trim(),
        returnUrl: `${window.location.origin}/order/{token}`,
        orderPageUrl: `${window.location.origin}/order/{token}`,
        savePaymentMethod: isAuthenticated ? savePaymentMethod : false,
        delivery: {
          deliveryType,
          offerId: selectedOfferId,
          address: deliveryType === 'COURIER' ? deliveryAddress.trim() : null,
          pickupPointId: deliveryType === 'PICKUP' ? selectedPickupPointId : null,
          pickupPointName: deliveryType === 'PICKUP' ? selectedPickupPointName : null,
          intervalFrom: selectedOffer?.intervalFrom || null,
          intervalTo: selectedOffer?.intervalTo || null,
          firstName: recipientFirstName.trim(),
          lastName: recipientLastName.trim() || null,
          phone: recipientPhone.trim(),
          email: email.trim()
        }
      });

      clearCart();
      const confirmationUrl = response?.payment?.confirmationUrl;
      if (confirmationUrl) {
        window.location.href = confirmationUrl;
        return;
      }

      setStatus({ type: 'error', message: 'Не удалось получить ссылку оплаты. Попробуйте ещё раз.' });
    } catch (err) {
      console.error('Checkout failed:', err);
      setStatus({ type: 'error', message: 'Не удалось оформить заказ. Попробуйте ещё раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page py-7 md:py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Оформление заказа</p>
            <h1 className="text-3xl sm:text-4xl font-semibold">Подтвердите детали и перейдите к оплате</h1>
            <p className="mt-1 text-sm text-muted">Чек и подтверждение придут на указанную электронную почту.</p>
          </div>
          <Link to="/cart" className="button-ghost text-sm">← Вернуться в корзину</Link>
        </div>

        {status && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
          <form id="checkout-form" onSubmit={handleSubmit} className="soft-card p-6 md:p-8 space-y-8">
            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">1</span>
                <div>
                  <h2 className="text-2xl font-semibold">Контакт для чека</h2>
                  <p className="text-sm text-muted">Письма по заказу и оплате будут отправлены сюда.</p>
                </div>
              </div>
              <label className="block text-sm">
                <span className="text-muted">Электронная почта</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full"
                  required
                />
              </label>
              {isAuthenticated && (
                <label className="mt-3 flex items-center gap-3 text-sm text-ink/90">
                  <input
                    type="checkbox"
                    checked={savePaymentMethod}
                    onChange={(event) => setSavePaymentMethod(event.target.checked)}
                  />
                  <span>Сохранить карту для следующих платежей</span>
                </label>
              )}
            </section>

            <section className="border-t border-ink/10 pt-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">2</span>
                <div>
                  <h2 className="text-2xl font-semibold">Получатель</h2>
                  <p className="text-sm text-muted">Эти данные нужны службе доставки.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-muted">Имя</span>
                  <input
                    type="text"
                    value={recipientFirstName}
                    onChange={(event) => setRecipientFirstName(event.target.value)}
                    placeholder="Имя"
                    className="mt-2 w-full"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-muted">Фамилия</span>
                  <input
                    type="text"
                    value={recipientLastName}
                    onChange={(event) => setRecipientLastName(event.target.value)}
                    placeholder="Фамилия"
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="text-muted">Телефон</span>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(event) => setRecipientPhone(event.target.value)}
                    placeholder="+7 900 000-00-00"
                    className="mt-2 w-full"
                    required
                  />
                </label>
              </div>
            </section>

            <section className="border-t border-ink/10 pt-8 space-y-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">3</span>
                <div>
                  <h2 className="text-2xl font-semibold">Доставка</h2>
                  <p className="text-sm text-muted">Выберите способ получения и интервал.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-secondary/55 p-1 inline-flex gap-1">
                <button
                  type="button"
                  onClick={() => setDeliveryType('COURIER')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    deliveryType === 'COURIER'
                      ? 'bg-white text-ink shadow-[0_10px_20px_rgba(43,39,34,0.12)]'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Курьер
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('PICKUP')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    deliveryType === 'PICKUP'
                      ? 'bg-white text-ink shadow-[0_10px_20px_rgba(43,39,34,0.12)]'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Пункт выдачи
                </button>
              </div>

              {deliveryType === 'COURIER' ? (
                <label className="block text-sm">
                  <span className="text-muted">Адрес доставки</span>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                    placeholder="Город, улица, дом, квартира"
                    className="mt-2 w-full"
                    required
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="text-muted">Город или адрес</span>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                      <input
                        type="text"
                        value={pickupLocation}
                        onChange={(event) => setPickupLocation(event.target.value)}
                        placeholder="Например, Санкт-Петербург"
                        className="w-full"
                      />
                      <button
                        type="button"
                        className="button-gray text-sm whitespace-nowrap"
                        onClick={handlePickupSearch}
                        disabled={pickupLoading}
                      >
                        {pickupLoading ? 'Ищем…' : 'Найти пункты'}
                      </button>
                      <button
                        type="button"
                        className="button-ghost text-sm whitespace-nowrap"
                        disabled={!pickupPoints.length}
                        onClick={() => setIsPickupMapOpen(true)}
                      >
                        Открыть карту
                      </button>
                    </div>
                  </label>

                  {pickupGeoId && (
                    <div className="text-xs text-muted">GeoID региона: {pickupGeoId}</div>
                  )}

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
                          onClick={() => setIsPickupMapOpen(true)}
                        >
                          Изменить
                        </button>
                      </div>
                      {!selectedPickupPoint.id && (
                        <div className="mt-2 text-xs text-red-600">
                          Для этого пункта не получен идентификатор. Выберите другой пункт на карте.
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">
                      Выберите пункт выдачи после поиска. Для удобства можно использовать карту.
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-ink/10 bg-white/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Варианты доставки</h3>
                  <button
                    type="button"
                    className="button-gray text-sm"
                    onClick={handleFetchOffers}
                    disabled={deliveryLoading}
                  >
                    {deliveryLoading ? 'Рассчитываем…' : 'Рассчитать'}
                  </button>
                </div>

                {deliveryError && (
                  <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {deliveryError}
                  </div>
                )}

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
                              onChange={() => setSelectedOfferId(offer.offerId)}
                            />
                            <div>
                              <div className="text-sm font-semibold text-ink">
                                {deliveryType === 'PICKUP' ? 'Самовывоз' : 'Курьер'} · {formatInterval(offer)}
                              </div>
                              {expiresLabel && (
                                <div className="mt-1 text-xs text-muted">Актуально до {expiresLabel}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-semibold">{priceValue.toLocaleString('ru-RU')} ₽</div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted">
                    Нажмите «Рассчитать», чтобы получить доступные интервалы и стоимость доставки.
                  </p>
                )}
              </div>
            </section>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] self-start">
            <div className="soft-card p-5">
              <h2 className="text-2xl font-semibold mb-4">Ваша корзина</h2>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.productInfo?.name || 'Товар'}</div>
                      <div className="text-xs text-muted">{item.quantity} шт.</div>
                    </div>
                    <div className="font-semibold whitespace-nowrap">
                      {((item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                ))}
              </div>
              <hr className="my-4 border-ink/10" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Товары ({items.length})</span>
                  <span>{total.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span>Доставка</span>
                  <span>{deliveryLabel}</span>
                </div>
              </div>
              <hr className="my-4 border-ink/10" />
              <div className="flex justify-between text-lg font-semibold">
                <span>К оплате</span>
                <span>{payableTotal.toLocaleString('ru-RU')} ₽</span>
              </div>

              {!selectedOfferId && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  Сначала выберите способ и интервал доставки.
                </div>
              )}

              <button type="submit" form="checkout-form" className="button mt-4 w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Готовим оплату…' : 'Перейти к оплате'}
              </button>
            </div>

            <div className="soft-card p-4 text-sm">
              <div className="font-semibold">Оплата через ЮKassa</div>
              <p className="mt-1 text-muted">
                Вы будете перенаправлены на защищённую страницу оплаты.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <PickupMapModal
        open={isPickupMapOpen}
        points={enrichedPickupPoints}
        selectedPointId={selectedPickupPointId}
        searchLabel={pickupLocation}
        onClose={() => setIsPickupMapOpen(false)}
        onSelect={(point) => {
          applyPickupSelection(point);
          setIsPickupMapOpen(false);
        }}
      />
    </div>
  );
}

export default CheckoutPage;

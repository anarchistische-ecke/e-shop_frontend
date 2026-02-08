import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { checkoutCart, getYandexDeliveryOffers, getYandexPickupPoints } from '../api';
import { moneyToNumber } from '../utils/product';
import { useAuth } from '../contexts/AuthContext';

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
  const [selectedPickupPointName, setSelectedPickupPointName] = useState('');
  const [deliveryOffers, setDeliveryOffers] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [pickupLoading, setPickupLoading] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);

  useEffect(() => {
    if (!email) {
      const fallbackEmail =
        tokenParsed?.email ||
        tokenParsed?.preferred_username ||
        tokenParsed?.username ||
        '';
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
    setSelectedPickupPointName('');
    setPickupGeoId(null);
  }, [pickupLocation]);

  if (isManager) {
    return <Navigate to="/cart" replace />;
  }

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity,
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
  const deliveryLabel = selectedOfferId
    ? `${deliveryAmount.toLocaleString('ru-RU')} ₽`
    : '—';
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

  const handlePickupSearch = async () => {
    setDeliveryError('');
    if (!pickupLocation.trim()) {
      setDeliveryError('Укажите город или адрес для поиска пунктов выдачи.');
      return;
    }
    setPickupLoading(true);
    try {
      const response = await getYandexPickupPoints({ location: pickupLocation.trim() });
      const points = response?.points || [];
      setPickupPoints(points);
      setPickupGeoId(response?.geoId ?? null);
      if (points.length) {
        setSelectedPickupPointId(points[0].id);
        setSelectedPickupPointName(points[0].name || points[0].address || '');
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
      setDeliveryError('Выберите пункт выдачи.');
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
      if (offers.length) {
        setSelectedOfferId(offers[0].offerId);
      } else {
        setSelectedOfferId('');
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
      setStatus({
        type: 'error',
        message: 'Корзина пуста. Добавьте товары перед оформлением заказа.'
      });
      return;
    }

    if (!email.trim()) {
      setStatus({
        type: 'error',
        message: 'Укажите email для отправки чека и деталей заказа.'
      });
      return;
    }
    if (!selectedOfferId) {
      setStatus({
        type: 'error',
        message: 'Выберите способ доставки и рассчитайте стоимость.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedOfferIntervalFrom = selectedOffer?.intervalFrom || null;
      const selectedOfferIntervalTo = selectedOffer?.intervalTo || null;
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
          intervalFrom: selectedOfferIntervalFrom,
          intervalTo: selectedOfferIntervalTo,
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
      setStatus({
        type: 'error',
        message: 'Не удалось получить ссылку оплаты. Попробуйте ещё раз.'
      });
    } catch (err) {
      console.error('Checkout failed:', err);
      setStatus({
        type: 'error',
        message: 'Не удалось оформить заказ. Попробуйте ещё раз.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Оплата заказа</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Подтвердите детали и перейдите к оплате</h1>
            <p className="text-sm text-muted mt-1">
              Мы отправим чек и детали заказа на вашу почту.
            </p>
          </div>
          <Link to="/cart" className="button-ghost text-sm">
            ← Вернуться в корзину
          </Link>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
          <div className="soft-card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Контакт для чека</h2>
              <p className="text-sm text-muted mb-4">
                Укажите email, чтобы получить чек и историю заказа.
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <label className="block text-sm">
                  <span className="text-muted">Email</span>
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
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={savePaymentMethod}
                      onChange={(event) => setSavePaymentMethod(event.target.checked)}
                    />
                    <span>Сохранить карту для следующих платежей</span>
                  </label>
                )}

                <div className="pt-2">
                  <h3 className="text-lg font-semibold mb-3">Получатель</h3>
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
                </div>

                <div className="pt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Доставка</h3>
                    {pickupGeoId && (
                      <span className="text-xs text-muted">GeoID {pickupGeoId}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="COURIER"
                        checked={deliveryType === 'COURIER'}
                        onChange={() => setDeliveryType('COURIER')}
                      />
                      <span>Курьер</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="PICKUP"
                        checked={deliveryType === 'PICKUP'}
                        onChange={() => setDeliveryType('PICKUP')}
                      />
                      <span>Пункт выдачи</span>
                    </label>
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
                        <div className="mt-2 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={pickupLocation}
                            onChange={(event) => setPickupLocation(event.target.value)}
                            placeholder="Введите город или адрес"
                            className="w-full"
                          />
                          <button
                            type="button"
                            className="button-ghost text-sm whitespace-nowrap"
                            onClick={handlePickupSearch}
                            disabled={pickupLoading}
                          >
                            {pickupLoading ? 'Ищем…' : 'Найти пункты'}
                          </button>
                        </div>
                      </label>
                      {pickupPoints.length > 0 ? (
                        <div className="space-y-2">
                          {pickupPoints.map((point) => (
                            <label
                              key={point.id}
                              className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm ${
                                selectedPickupPointId === point.id
                                  ? 'border-primary/40 bg-primary/5'
                                  : 'border-ink/10 bg-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name="pickupPoint"
                                checked={selectedPickupPointId === point.id}
                                onChange={() => {
                                  setSelectedPickupPointId(point.id);
                                  setSelectedPickupPointName(point.name || point.address || '');
                                }}
                              />
                              <div>
                                <div className="font-medium">{point.name || 'Пункт выдачи'}</div>
                                {point.address && (
                                  <div className="text-xs text-muted">{point.address}</div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted">
                          Введите город и нажмите «Найти пункты», чтобы выбрать пункт выдачи.
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    className="button-ghost text-sm w-full sm:w-auto"
                    onClick={handleFetchOffers}
                    disabled={deliveryLoading}
                  >
                    {deliveryLoading ? 'Рассчитываем…' : 'Рассчитать доставку'}
                  </button>

                  {deliveryError && (
                    <div className="text-xs text-red-600">{deliveryError}</div>
                  )}

                  {deliveryOffers.length > 0 && (
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
                            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
                              selectedOfferId === offer.offerId
                                ? 'border-primary/40 bg-primary/5'
                                : 'border-ink/10 bg-white'
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
                                <div className="font-medium">
                                  {deliveryType === 'PICKUP' ? 'Самовывоз' : 'Курьер'} · {formatInterval(offer)}
                                </div>
                                {expiresLabel && (
                                  <div className="text-xs text-muted">
                                    Доступно до {expiresLabel}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="font-semibold">
                              {priceValue.toLocaleString('ru-RU')} ₽
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button type="submit" className="button" disabled={isSubmitting}>
                  {isSubmitting ? 'Готовим оплату…' : 'Перейти к оплате'}
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Состав заказа</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm shadow-sm"
                  >
                    <div>
                      <div className="font-semibold">
                        {item.productInfo?.name || 'Товар'}
                      </div>
                      <div className="text-xs text-muted">
                        {item.productInfo?.variantName || item.variantId}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {(item.unitPriceValue || moneyToNumber(item.unitPrice)).toLocaleString('ru-RU')} ₽
                      </div>
                      <div className="text-xs text-muted">× {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="soft-card p-5">
              <h3 className="text-xl font-semibold mb-4">Итого</h3>
              <div className="flex justify-between mb-2 text-sm">
                <span>Товары ({items.length})</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Доставка</span>
                <span>{deliveryLabel}</span>
              </div>
              <hr className="my-3 border-ink/10" />
              <div className="flex justify-between font-semibold text-base">
                <span>К оплате</span>
                <span>{payableTotal.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
            <div className="soft-card p-4 text-sm space-y-2">
              <p className="font-semibold">Оплата через ЮKassa</p>
              <p className="text-muted">
                Вы будете перенаправлены на защищённую страницу оплаты.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;

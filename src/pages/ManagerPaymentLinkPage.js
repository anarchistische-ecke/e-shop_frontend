import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { createManagerOrderLink, isApiRequestError } from '../api';
import NotificationBanner from '../components/NotificationBanner';
import Seo from '../components/Seo';
import { Button, Card, Input } from '../components/ui';
import { CartContext } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { usePaymentConfig } from '../contexts/PaymentConfigContext';
import { createIdempotencyKey } from '../features/checkout/utils';
import { readEnv } from '../config/runtime';
import { METRIKA_GOALS, trackGoal } from '../utils/metrika';
import { getCheckoutPaymentDescription, getPaymentSummaryLabel } from '../utils/payment';
import { moneyToNumber } from '../utils/product';
import { buildAbsoluteAppUrl } from '../utils/url';

function normalizeValue(value) {
  return String(value || '').trim();
}

function buildManagerLinkSignature({
  cartId,
  receiptEmail,
  customerName,
  phone,
  homeAddress,
  orderPageUrl,
  sendEmail
} = {}) {
  return [
    cartId || '',
    normalizeValue(receiptEmail),
    normalizeValue(customerName),
    normalizeValue(phone),
    normalizeValue(homeAddress),
    normalizeValue(orderPageUrl),
    sendEmail ? '1' : '0'
  ].join('|');
}

function resolveManagerLinkAttempt({ cartId, signature, existingAttempt }) {
  if (existingAttempt?.key && existingAttempt.signature === signature) {
    return existingAttempt;
  }
  return {
    cartId: cartId || '',
    signature,
    key: createIdempotencyKey(`manager-${cartId || 'cart'}`)
  };
}

function ManagerPaymentLinkPage() {
  const {
    items,
    cartId,
    pricing,
    removeItem,
    updateQuantity,
    clearCart,
    startNewCart,
    applyPromoCode,
    removePromoCode
  } = useContext(CartContext);
  const { isAuthenticated, isReady, hasRole, hasStrongAuth } = useAuth();
  const { paymentConfig } = usePaymentConfig();
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [status, setStatus] = useState(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [promoDraft, setPromoDraft] = useState('');
  const [promoStatus, setPromoStatus] = useState(null);
  const [isPromoSubmitting, setIsPromoSubmitting] = useState(false);
  const [linkAttempt, setLinkAttempt] = useState({ cartId: '', signature: '', key: '' });

  const managerRole = readEnv('REACT_APP_KEYCLOAK_MANAGER_ROLE', 'manager') || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);
  const hasStrongSession = isAuthenticated && hasStrongAuth();

  const fallbackTotal = items.reduce(
    (sum, item) => sum + (item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity,
    0
  );
  const originalSubtotal = pricing ? moneyToNumber(pricing.originalSubtotal) : fallbackTotal;
  const saleSubtotal = pricing ? moneyToNumber(pricing.saleSubtotal) : fallbackTotal;
  const productSaleDiscount = pricing ? moneyToNumber(pricing.productSaleDiscount) : 0;
  const cartDiscount = pricing ? moneyToNumber(pricing.cartDiscount) : 0;
  const promoCodeDiscount = pricing ? moneyToNumber(pricing.promoCodeDiscount) : 0;
  const thresholdDiscount = pricing ? moneyToNumber(pricing.thresholdDiscount) : 0;
  const total = pricing ? moneyToNumber(pricing.finalTotal) : fallbackTotal;
  const activePromoCode = pricing?.promoCode || '';
  const isPromoCodeApplied = Boolean(pricing?.promoCodeApplied);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const paymentSummaryLabel = getPaymentSummaryLabel(paymentConfig);
  const paymentDescription = getCheckoutPaymentDescription(paymentConfig);

  const promoWasValidButNotChosen =
    activePromoCode &&
    pricing?.promoCodeStatus === 'VALID' &&
    pricing?.appliedCartDiscountType !== 'PROMO_CODE' &&
    promoCodeDiscount > 0 &&
    thresholdDiscount >= promoCodeDiscount;

  const lastLinkLabel = useMemo(() => {
    if (!createdLink) return '';
    try {
      return new URL(createdLink).pathname;
    } catch (err) {
      return createdLink;
    }
  }, [createdLink]);

  useEffect(() => {
    setQuantityDrafts((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        next[item.id] = String(item.quantity);
      });
      Object.keys(next).forEach((key) => {
        if (!items.some((item) => item.id === key)) {
          delete next[key];
        }
      });
      return next;
    });
  }, [items]);

  useEffect(() => {
    setPromoDraft(activePromoCode);
  }, [activePromoCode]);

  if (!isReady) {
    return null;
  }

  if (!isManager || !hasStrongSession) {
    return <Navigate to="/manager/login" replace state={{ from: '/manager/payment-link' }} />;
  }

  const setQuantityDraft = (itemId, value) => {
    setQuantityDrafts((prev) => ({ ...prev, [itemId]: value }));
  };

  const commitQuantityDraft = (item) => {
    const rawValue = quantityDrafts[item.id];
    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setQuantityDraft(item.id, String(item.quantity));
      return;
    }
    if (parsed !== item.quantity) {
      updateQuantity(item.id, parsed);
    }
  };

  const handleApplyPromoCode = async (event) => {
    event.preventDefault();
    const code = promoDraft.trim();
    if (!code) {
      setPromoStatus({ type: 'error', message: 'Введите промокод.' });
      return;
    }
    setIsPromoSubmitting(true);
    setPromoStatus(null);
    const result = await applyPromoCode(code);
    setIsPromoSubmitting(false);
    if (result?.ok) {
      setPromoStatus({ type: 'success', message: 'Промокод проверен и учтён в расчёте.' });
      return;
    }
    const message = isApiRequestError(result?.error)
      ? result.error.message
      : 'Промокод не применён. Проверьте условия акции.';
    setPromoStatus({ type: 'error', message });
  };

  const handleRemovePromoCode = async () => {
    setIsPromoSubmitting(true);
    setPromoStatus(null);
    const result = await removePromoCode();
    setIsPromoSubmitting(false);
    if (result?.ok) {
      setPromoDraft('');
      setPromoStatus({ type: 'success', message: 'Промокод удалён из корзины.' });
      return;
    }
    setPromoStatus({ type: 'error', message: 'Не удалось удалить промокод.' });
  };

  const handleCreateLink = async ({ sendEmail, copyAfter = false } = {}) => {
    const receiptEmail = customerEmail.trim();
    const contactName = customerName.trim();
    const phone = customerPhone.trim();
    const homeAddress = customerAddress.trim();
    if (!items.length) {
      setStatus({ type: 'error', message: 'Добавьте товары перед созданием ссылки.' });
      return;
    }
    if (!receiptEmail || !contactName || !phone || !homeAddress) {
      setStatus({
        type: 'error',
        message: 'Укажите имя, телефон, адрес и электронную почту клиента.'
      });
      return;
    }
    if (!cartId) {
      setStatus({ type: 'error', message: 'Корзина ещё не готова. Обновите страницу и попробуйте снова.' });
      return;
    }

    const orderPageUrl = buildAbsoluteAppUrl('/order/{token}');
    const payload = {
      cartId,
      receiptEmail,
      customerName: contactName,
      phone,
      homeAddress,
      orderPageUrl,
      sendEmail: Boolean(sendEmail)
    };
    const signature = buildManagerLinkSignature(payload);
    const nextAttempt = resolveManagerLinkAttempt({
      cartId,
      signature,
      existingAttempt: linkAttempt
    });

    setLinkAttempt(nextAttempt);
    setIsCreatingLink(true);
    setStatus(null);
    try {
      const response = await createManagerOrderLink({
        ...payload,
        idempotencyKey: nextAttempt.key
      });
      const link = response?.orderUrl || buildAbsoluteAppUrl(`/order/${response.publicToken}`);
      setCreatedLink(link);
      trackGoal(METRIKA_GOALS.MANAGER_LINK_CREATED, {
        cart_items: itemCount,
        cart_total: Math.round(total),
        send_email: Boolean(sendEmail)
      });

      let copied = false;
      if (copyAfter && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(link);
          copied = true;
        } catch (copyError) {
          console.warn('Failed to copy manager link automatically:', copyError);
        }
      }

      await startNewCart();
      setCustomerEmail('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setLinkAttempt({ cartId: '', signature: '', key: '' });
      setStatus({
        type: copyAfter && !copied ? 'warning' : 'success',
        message: sendEmail
          ? 'Ссылка создана и отправлена клиенту. Для следующего клиента открыта новая корзина.'
          : copyAfter && copied
          ? 'Ссылка создана и скопирована. Для следующего клиента открыта новая корзина.'
          : copyAfter
          ? 'Ссылка создана. Не удалось скопировать автоматически, скопируйте её вручную. Для следующего клиента открыта новая корзина.'
          : 'Ссылка создана. Для следующего клиента открыта новая корзина.'
      });
    } catch (err) {
      console.error('Failed to create manager order link:', err);
      const message = isApiRequestError(err)
        ? err.message
        : 'Не удалось создать ссылку. Попробуйте ещё раз.';
      setStatus({ type: 'error', message });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      setStatus({ type: 'success', message: 'Ссылка скопирована.' });
    } catch (err) {
      console.error('Failed to copy manager link:', err);
      setStatus({ type: 'error', message: 'Не удалось скопировать ссылку.' });
    }
  };

  return (
    <div className="manager-payment-link-page page-section">
      <Seo
        title="Ссылка на оплату"
        description="Рабочее место менеджера для создания ссылки на оплату заказа."
        canonicalPath="/manager/payment-link"
        robots="noindex,nofollow"
      />
      <div className="page-shell">
        <div className="section-header mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Менеджер</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Ссылка на оплату</h1>
            <p className="text-sm text-muted mt-1">Выберите товары в каталоге, проверьте корзину и отправьте клиенту ссылку.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button as={Link} to="/catalog" variant="secondary" size="sm">
              Каталог
            </Button>
            <Button as={Link} to="/account#orders" variant="ghost" size="sm">
              Заказы
            </Button>
          </div>
        </div>

        {status ? <NotificationBanner notification={status} className="mb-5" /> : null}

        {createdLink ? (
          <Card variant="soft" padding="md" className="mb-6 border-primary/25">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-muted">Последняя ссылка</p>
                <p className="break-all text-base font-semibold">{createdLink}</p>
                {lastLinkLabel ? <p className="mt-1 text-xs text-muted">{lastLinkLabel}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={handleCopyLink}>
                  Скопировать
                </Button>
                <Button as="a" href={createdLink} target="_blank" rel="noreferrer">
                  Открыть
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {items.length === 0 ? (
          <Card className="text-center p-8">
            <p className="text-lg font-semibold mb-2">Корзина для клиента пуста</p>
            <p className="text-sm text-muted mb-4">
              Добавьте товары из каталога, затем вернитесь сюда для создания ссылки.
            </p>
            <Button as={Link} to="/catalog">
              Перейти в каталог
            </Button>
          </Card>
        ) : (
          <div className="page-grid--sidebar gap-8">
            <div className="w-full lg:flex-1 space-y-4">
              {items.map((item) => (
                <Card
                  key={item.id}
                  variant="quiet"
                  padding="sm"
                  className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 sm:flex sm:flex-row sm:items-center"
                >
                  <div className="h-24 w-24 rounded-2xl overflow-hidden bg-sand/60 border border-white/70 flex-shrink-0">
                    {item.productInfo?.imageUrl ? (
                      <img
                        src={item.productInfo.imageUrl}
                        alt={item.productInfo?.name || 'Товар'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted px-2 text-center">
                        Нет фото
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold m-0">{item.productInfo?.name || 'Товар'}</h4>
                    <p className="text-xs text-muted mt-1">
                      {item.productInfo?.variantName ? `Вариант: ${item.productInfo.variantName}` : item.variantId}
                    </p>
                    <div className="text-accent font-semibold mt-2">
                      {(item.unitPriceValue || moneyToNumber(item.unitPrice)).toLocaleString('ru-RU')} ₽
                      {item.oldUnitPriceValue && item.oldUnitPriceValue > item.unitPriceValue ? (
                        <span className="ml-2 text-xs font-normal text-muted line-through">
                          {item.oldUnitPriceValue.toLocaleString('ru-RU')} ₽
                        </span>
                      ) : null}
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center gap-2 mt-3 text-sm sm:col-span-1">
                      <div className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white/85 p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const nextQuantity = Math.max(1, item.quantity - 1);
                            setQuantityDraft(item.id, String(nextQuantity));
                            updateQuantity(item.id, nextQuantity);
                          }}
                          className="rounded-xl border border-transparent text-lg leading-none hover:border-ink/15"
                          aria-label={`Уменьшить количество: ${item.productInfo?.name || 'Товар'}`}
                        >
                          -
                        </Button>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="!h-11 !w-14 !rounded-xl !px-2 !py-1 text-center text-sm font-semibold"
                          value={quantityDrafts[item.id] ?? String(item.quantity)}
                          onChange={(event) => {
                            const next = event.target.value.replace(/[^\d]/g, '');
                            setQuantityDraft(item.id, next);
                          }}
                          onBlur={() => commitQuantityDraft(item)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              commitQuantityDraft(item);
                            }
                          }}
                          aria-label={`Количество: ${item.productInfo?.name || 'Товар'}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const nextQuantity = item.quantity + 1;
                            setQuantityDraft(item.id, String(nextQuantity));
                            updateQuantity(item.id, nextQuantity);
                          }}
                          className="rounded-xl border border-transparent text-lg leading-none hover:border-ink/15"
                          aria-label={`Увеличить количество: ${item.productInfo?.name || 'Товар'}`}
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="!min-h-11 !px-2 text-xs text-muted hover:text-primary"
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="w-full lg:max-w-sm space-y-4">
              <Card padding="md">
                <h2 className="text-xl font-semibold mb-4">Клиент и ссылка</h2>
                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="text-muted">Имя клиента</span>
                    <Input
                      type="text"
                      className="mt-2"
                      placeholder="Иван Иванов"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-muted">Телефон клиента</span>
                    <Input
                      type="tel"
                      className="mt-2"
                      placeholder="+7 900 000-00-00"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-muted">Адрес доставки</span>
                    <Input
                      type="text"
                      className="mt-2"
                      placeholder="Город, улица, дом, квартира"
                      value={customerAddress}
                      onChange={(event) => setCustomerAddress(event.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-muted">Электронная почта клиента</span>
                    <Input
                      type="email"
                      className="mt-2"
                      placeholder="pochta@example.ru"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                    />
                  </label>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Button
                    block
                    onClick={() => handleCreateLink({ sendEmail: true })}
                    disabled={isCreatingLink}
                  >
                    {isCreatingLink ? 'Создаём...' : 'Отправить ссылку'}
                  </Button>
                  <Button
                    variant="secondary"
                    block
                    onClick={() => handleCreateLink({ sendEmail: false, copyAfter: true })}
                    disabled={isCreatingLink}
                  >
                    {isCreatingLink ? 'Готовим...' : 'Создать и скопировать'}
                  </Button>
                </div>
              </Card>

              <Card padding="md">
                <h2 className="text-xl font-semibold mb-4">Сводка заказа</h2>
                <div className="flex justify-between mb-2 text-sm">
                  <span>Товары без скидок ({itemCount})</span>
                  <span>{originalSubtotal.toLocaleString('ru-RU')} ₽</span>
                </div>
                {productSaleDiscount > 0 ? (
                  <div className="flex justify-between mb-2 text-sm text-primary">
                    <span>Скидки на товары</span>
                    <span>-{productSaleDiscount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ) : null}
                {saleSubtotal !== originalSubtotal ? (
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Товары по акциям</span>
                    <span>{saleSubtotal.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ) : null}
                <form onSubmit={handleApplyPromoCode} className="my-4 rounded-2xl border border-ink/10 bg-sand/40 p-3">
                  <label className="text-sm font-semibold" htmlFor="manager-cart-promo-code">
                    Акции и промокоды
                  </label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="manager-cart-promo-code"
                      value={promoDraft}
                      onChange={(event) => setPromoDraft(event.target.value.toUpperCase())}
                      placeholder="ПРОМО"
                      autoComplete="off"
                      disabled={isPromoSubmitting}
                    />
                    <Button type="submit" disabled={isPromoSubmitting}>
                      {isPromoSubmitting ? 'Проверяем...' : 'Применить'}
                    </Button>
                  </div>
                  {activePromoCode ? (
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
                      <span>
                        {isPromoCodeApplied
                          ? `Применён промокод ${activePromoCode}`
                          : `Промокод ${activePromoCode} сохранён, но не выбран как лучшая скидка`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="!px-1 text-xs"
                        onClick={handleRemovePromoCode}
                        disabled={isPromoSubmitting}
                      >
                        Удалить
                      </Button>
                    </div>
                  ) : null}
                  {promoWasValidButNotChosen ? (
                    <p className="mt-2 text-xs text-muted">
                      Скидка по сумме корзины сейчас выгоднее промокода.
                    </p>
                  ) : null}
                  {promoStatus ? <NotificationBanner notification={promoStatus} compact className="mt-3" /> : null}
                </form>
                {cartDiscount > 0 ? (
                  <div className="flex justify-between mb-2 text-sm text-primary">
                    <span>{pricing?.appliedCartDiscountLabel || 'Скидка по корзине'}</span>
                    <span>-{cartDiscount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ) : thresholdDiscount > 0 ? (
                  <div className="flex justify-between mb-2 text-sm text-muted">
                    <span>Доступна скидка по сумме корзины</span>
                    <span>до -{thresholdDiscount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ) : null}
                <div className="flex justify-between mb-2 text-sm">
                  <span>Доставка</span>
                  <span>Согласует менеджер</span>
                </div>
                <div className="flex justify-between mb-2 text-sm text-muted">
                  <span>Оплата</span>
                  <span>{paymentSummaryLabel}</span>
                </div>
                <hr className="my-3 border-ink/10" />
                <div className="flex justify-between font-semibold text-base mb-4">
                  <span>Итого</span>
                  <span>{total.toLocaleString('ru-RU')} ₽</span>
                </div>
                <Button variant="ghost" block onClick={clearCart}>
                  Очистить корзину
                </Button>
              </Card>

              <Card padding="sm" className="text-sm space-y-2">
                <p className="font-semibold">Что увидит клиент</p>
                <p className="text-muted">{paymentDescription}</p>
                <p className="text-muted">Доставка не входит в оплату товаров и согласуется менеджером отдельно.</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerPaymentLinkPage;

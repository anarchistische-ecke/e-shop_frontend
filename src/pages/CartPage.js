import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { createManagerOrderLink, isApiRequestError } from '../api';
import NotificationBanner from '../components/NotificationBanner';
import Seo from '../components/Seo';
import { moneyToNumber } from '../utils/product';
import { useAuth } from '../contexts/AuthContext';
import { usePaymentConfig } from '../contexts/PaymentConfigContext';
import { METRIKA_GOALS, trackMetrikaGoal } from '../utils/metrika';
import { buildAbsoluteAppUrl } from '../utils/url';
import {
  getCheckoutPaymentDescription,
  getPaymentSummaryLabel
} from '../utils/payment';
import { CART_SESSION_STRATEGY } from '../utils/account';
import { Button, Card, Input } from '../components/ui';
import { readEnv } from '../config/runtime';

function CartPage() {
  const {
    items,
    pricing,
    removeItem,
    updateQuantity,
    clearCart,
    applyPromoCode,
    removePromoCode
  } = useContext(CartContext);
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuth();
  const { paymentConfig } = usePaymentConfig();
  const [managerEmail, setManagerEmail] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [managerAddress, setManagerAddress] = useState('');
  const [managerLink, setManagerLink] = useState('');
  const [managerStatus, setManagerStatus] = useState(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [promoDraft, setPromoDraft] = useState('');
  const [promoStatus, setPromoStatus] = useState(null);
  const [isPromoSubmitting, setIsPromoSubmitting] = useState(false);
  const managerRole = readEnv('REACT_APP_KEYCLOAK_MANAGER_ROLE', 'manager') || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);

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
  const promoWasValidButNotChosen =
    activePromoCode &&
    pricing?.promoCodeStatus === 'VALID' &&
    pricing?.appliedCartDiscountType !== 'PROMO_CODE' &&
    promoCodeDiscount > 0 &&
    thresholdDiscount >= promoCodeDiscount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const paymentSummaryLabel = getPaymentSummaryLabel(paymentConfig);
  const paymentDescription = getCheckoutPaymentDescription(paymentConfig);

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
    if (parsed === item.quantity) {
      return;
    }
    updateQuantity(item.id, parsed);
  };

  const handleCheckout = () => {
    trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_CTA_CLICK, {
      cart_items: itemCount,
      cart_total: Math.round(total)
    });
    navigate('/checkout');
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
    const error = result?.error;
    const message = isApiRequestError(error)
      ? error.message
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

  const handleCreateManagerLink = async ({ sendEmail, copyAfter = false } = {}) => {
    const email = managerEmail.trim();
    const customerName = managerName.trim();
    const phone = managerPhone.trim();
    const homeAddress = managerAddress.trim();
    if (!email || !customerName || !phone || !homeAddress) {
      setManagerStatus({
        type: 'error',
        message: 'Укажите имя, телефон, адрес и email клиента.'
      });
      return;
    }
    setIsCreatingLink(true);
    setManagerStatus(null);
    try {
      const cartId = localStorage.getItem('cartId');
      const response = await createManagerOrderLink({
        cartId,
        receiptEmail: email,
        customerName,
        phone,
        homeAddress,
        orderPageUrl: buildAbsoluteAppUrl('/order/{token}'),
        sendEmail: Boolean(sendEmail)
      });
      const link = buildAbsoluteAppUrl(`/order/${response.publicToken}`);
      setManagerLink(link);
      if (copyAfter && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        setManagerStatus({
          type: 'success',
          message: 'Ссылка создана и скопирована.'
        });
        return;
      }
      setManagerStatus({
        type: 'success',
        message: sendEmail ? 'Ссылка создана и отправлена клиенту.' : 'Ссылка создана.'
      });
    } catch (err) {
      console.error('Failed to create manager order link:', err);
      setManagerStatus({
        type: 'error',
        message: 'Не удалось создать ссылку. Попробуйте ещё раз.'
      });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!managerLink) return;
    try {
      await navigator.clipboard.writeText(managerLink);
      setManagerStatus({ type: 'success', message: 'Ссылка скопирована.' });
    } catch (err) {
      console.error('Failed to copy link:', err);
      setManagerStatus({ type: 'error', message: 'Не удалось скопировать ссылку.' });
    }
  };

  return (
    <div className="cart-page page-section">
      <Seo
        title="Корзина"
        description="Проверьте товары в корзине, итоговую стоимость и переходите к оформлению заказа."
        canonicalPath="/cart"
        robots="noindex,nofollow"
      />
      <div className="page-shell">
        <div className="section-header mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Корзина</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Ваши товары для уюта</h1>
            <p className="text-sm text-muted mt-1">Проверьте состав заказа и добавьте подарок к комплекту.</p>
          </div>
          <Button as={Link} to="/category/popular" variant="ghost" size="sm">
            Продолжить покупки →
          </Button>
        </div>

        {items.length === 0 ? (
          <Card className="text-center p-8">
            <p className="text-lg font-semibold mb-2">Корзина пока пуста</p>
            <p className="text-sm text-muted mb-4">
              Выберите товары в каталоге и добавьте их в корзину — мы подготовим всё к доставке.
            </p>
            <Button as={Link} to="/category/popular">
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
                  className="flex flex-col gap-4 sm:flex-row sm:items-center"
                >
                  <div className="w-full sm:w-24 h-24 rounded-2xl overflow-hidden bg-sand/60 border border-white/70 flex-shrink-0">
                    {item.productInfo?.imageUrl ? (
                      <img src={item.productInfo.imageUrl} alt={item.productInfo?.name || 'Товар'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted px-2 text-center">
                        Нет фото
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
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
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
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
                          −
                        </Button>
                        <label className="sr-only" htmlFor={`cart-item-qty-${item.id}`}>
                          Количество товара {item.productInfo?.name || 'Товар'}
                        </label>
                        <Input
                          id={`cart-item-qty-${item.id}`}
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
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="!px-1 text-xs text-primary hover:text-primary"
                      >
                        Добавить ещё одну
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="!px-1 text-xs text-muted hover:text-primary"
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
                <h3 className="text-xl font-semibold mb-4">Сводка заказа</h3>
                <div className="flex justify-between mb-2 text-sm">
                  <span>Товары без скидок ({itemCount})</span>
                  <span>{originalSubtotal.toLocaleString('ru-RU')} ₽</span>
                </div>
                {productSaleDiscount > 0 ? (
                  <div className="flex justify-between mb-2 text-sm text-primary">
                    <span>Скидки на товары</span>
                    <span>−{productSaleDiscount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ) : null}
                {saleSubtotal !== originalSubtotal ? (
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Товары по акциям</span>
                    <span>{saleSubtotal.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ) : null}
                <form onSubmit={handleApplyPromoCode} className="my-4 rounded-2xl border border-ink/10 bg-sand/40 p-3">
                  <label className="text-sm font-semibold" htmlFor="cart-promo-code">
                    Акции и промокоды
                  </label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="cart-promo-code"
                      value={promoDraft}
                      onChange={(event) => setPromoDraft(event.target.value.toUpperCase())}
                      placeholder="PROMO"
                      autoComplete="off"
                      disabled={isPromoSubmitting}
                    />
                    <Button type="submit" disabled={isPromoSubmitting}>
                      {isPromoSubmitting ? 'Проверяем…' : 'Применить'}
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
                    <span>−{cartDiscount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ) : thresholdDiscount > 0 ? (
                  <div className="flex justify-between mb-2 text-sm text-muted">
                    <span>Доступна скидка по сумме корзины</span>
                    <span>до −{thresholdDiscount.toLocaleString('ru-RU')} ₽</span>
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
                {!isManager && (
                  <>
                    <Button block className="mb-2" onClick={handleCheckout}>
                      Оформить заказ
                    </Button>
                    {!isAuthenticated && (
                      <div className="mb-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-ink/90">
                        {CART_SESSION_STRATEGY.guestCheckoutMessage}
                      </div>
                    )}
                  </>
                )}
                <Button variant="secondary" block onClick={clearCart}>
                  Очистить корзину
                </Button>
              </Card>
              {isManager && (
                <Card padding="md" className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-accent">Инструменты менеджера</p>
                    <h3 className="text-lg font-semibold mt-2">Ссылка на оплату для клиента</h3>
                    <p className="text-sm text-muted mt-1">
                      Сформируйте заказ и отправьте клиенту ссылку на оплату. Стоимость доставки менеджер согласует отдельно.
                    </p>
                  </div>
                  <label className="text-sm">
                    <span className="text-muted">Имя клиента</span>
                    <Input
                      type="text"
                      className="mt-2 w-full"
                      placeholder="Иван Иванов"
                      value={managerName}
                      onChange={(event) => setManagerName(event.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-muted">Телефон клиента</span>
                    <Input
                      type="tel"
                      className="mt-2 w-full"
                      placeholder="+7 900 000-00-00"
                      value={managerPhone}
                      onChange={(event) => setManagerPhone(event.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-muted">Домашний адрес</span>
                    <Input
                      type="text"
                      className="mt-2 w-full"
                      placeholder="Город, улица, дом, квартира"
                      value={managerAddress}
                      onChange={(event) => setManagerAddress(event.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-muted">Email клиента</span>
                    <Input
                      type="email"
                      className="mt-2 w-full"
                      placeholder="client@example.com"
                      value={managerEmail}
                      onChange={(event) => setManagerEmail(event.target.value)}
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      block
                      onClick={() => handleCreateManagerLink({ sendEmail: true })}
                      disabled={isCreatingLink}
                    >
                      {isCreatingLink ? 'Создаём ссылку…' : 'Отправить ссылку'}
                    </Button>
                    <Button
                      variant="secondary"
                      block
                      onClick={() => handleCreateManagerLink({ sendEmail: false, copyAfter: true })}
                      disabled={isCreatingLink}
                    >
                      {isCreatingLink ? 'Готовим…' : 'Создать и скопировать'}
                    </Button>
                  </div>
                  {managerLink && (
                    <Card variant="quiet" padding="sm" className="text-xs break-all shadow-sm">
                      <div className="text-muted mb-2">Ссылка для клиента</div>
                      <div className="font-semibold">{managerLink}</div>
                      <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={handleCopyLink}>
                        Скопировать ссылку
                      </Button>
                    </Card>
                  )}
                  {managerStatus ? <NotificationBanner notification={managerStatus} compact /> : null}
                </Card>
              )}
              <Card padding="sm" className="text-sm space-y-2">
                <p className="font-semibold">Почему с нами спокойно</p>
                <p className="text-muted">После оплаты менеджер согласует варианты доставки и финальную стоимость.</p>
                <p className="text-muted">{paymentDescription} Поддержка ежедневно с 9:00 до 21:00.</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;

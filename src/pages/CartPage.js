import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../contexts/CartContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getProduct, isApiRequestError } from '../api';
import NotificationBanner from '../components/NotificationBanner';
import Seo from '../components/Seo';
import { moneyToNumber } from '../utils/product';
import { buildProductPath } from '../utils/url';
import { useAuth } from '../contexts/AuthContext';
import { usePaymentConfig } from '../contexts/PaymentConfigContext';
import { METRIKA_GOALS, trackGoal } from '../utils/metrika';
import { getPaymentSummaryLabel } from '../utils/payment';
import { Button, Card, Input } from '../components/ui';
import { readEnv } from '../config/runtime';
import QuickViewSheet from '../components/commerce/QuickViewSheet';
import DeliveryQuoteLink from '../components/commerce/DeliveryQuoteLink';
import { DELIVERY_SEPARATE_PAYMENT_NOTE } from '../utils/delivery';

function formatRub(value) {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

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
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [promoDraft, setPromoDraft] = useState('');
  const [promoStatus, setPromoStatus] = useState(null);
  const [isPromoSubmitting, setIsPromoSubmitting] = useState(false);
  const [isPromoExpanded, setIsPromoExpanded] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const managerRole = readEnv('REACT_APP_KEYCLOAK_MANAGER_ROLE', 'manager') || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);

  const fallbackTotal = items.reduce(
    (sum, item) => sum + (item.unitPriceValue ?? moneyToNumber(item.unitPrice)) * item.quantity,
    0
  );
  const originalSubtotal = pricing ? moneyToNumber(pricing.originalSubtotal) : fallbackTotal;
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
  const availabilityWarnings = items.filter((item) => {
    const line = item.pricingLine;
    if (!line) return false;
    return line.quantityAvailable === false || (line.availabilityStatus && line.availabilityStatus !== 'AVAILABLE');
  });
  const hasAvailabilityWarnings = availabilityWarnings.length > 0;

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
    if (activePromoCode) {
      setIsPromoExpanded(true);
    }
  }, [activePromoCode]);

  useEffect(() => {
    trackGoal(METRIKA_GOALS.VIEW_CART, {
      cart_items: itemCount,
      cart_total: Math.round(total),
      active_promotion_bucket: activePromoCode ? 'promo_applied' : 'no_promo'
    });
  }, [activePromoCode, itemCount, total]);

  if (isManager) {
    return <Navigate to="/manager/payment-link" replace />;
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
    if (parsed === item.quantity) {
      return;
    }
    updateQuantity(item.id, parsed);
  };

  const handleCheckout = () => {
    if (hasAvailabilityWarnings) {
      setPromoStatus({
        type: 'warning',
        title: 'Проверьте наличие товаров',
        message: 'Перед оформлением уменьшите количество или удалите позиции, которые сейчас недоступны.'
      });
      return;
    }
    trackGoal(METRIKA_GOALS.CHECKOUT_CTA_CLICK, {
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

  const handleEditItem = async (item) => {
    const productId = item?.productInfo?.id;
    if (!productId) return;
    setEditingItem(item);
    setEditingProduct(null);
    try {
      setEditingProduct(await getProduct(productId));
    } catch (error) {
      setEditingItem(null);
    }
  };

  return (
    <div className="cart-page pb-28 pt-4 sm:pt-7 lg:pb-14">
      <Seo
        title="Корзина"
        description="Проверьте товары в корзине, итоговую стоимость и переходите к оформлению заказа."
        canonicalPath="/cart"
        robots="noindex,nofollow"
      />
      <div className="page-shell max-w-[1170px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-3 sm:mb-7">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">Корзина</h1>
          {items.length > 0 ? (
            <Link to="/catalog" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline">
              Продолжить покупки <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </div>

        {items.length === 0 ? (
          <Card className="!rounded-lg !shadow-none text-center !p-8">
            <h2 className="mb-2 text-xl font-semibold">Корзина пока пуста</h2>
            <Button as={Link} to="/catalog" className="mt-3">Перейти в каталог</Button>
          </Card>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:gap-8 xl:gap-10">
            <div className="min-w-0">
              <ul className="divide-y divide-ink/10 overflow-hidden rounded-lg border border-line bg-white" role="list">
                {items.map((item) => {
                  const name = item.productInfo?.name || 'Товар';
                  const unitPrice = item.unitPriceValue ?? moneyToNumber(item.unitPrice);
                  const lineTotal = item.pricingLine?.lineTotal != null
                    ? moneyToNumber(item.pricingLine.lineTotal)
                    : unitPrice * item.quantity;
                  const variant = item.productInfo?.variantName;
                  const productPath = item.productInfo?.id ? buildProductPath(item.productInfo) : '';

                  return (
                    <li
                      key={item.id}
                      className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] gap-x-3 gap-y-2 p-3 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-x-4 sm:p-4"
                    >
                      <div className="h-[4.25rem] w-[4.25rem] overflow-hidden rounded-md bg-secondary sm:row-span-2 sm:h-24 sm:w-24">
                        {item.productInfo?.imageUrl ? (
                          <img src={item.productInfo.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="col-span-2 min-w-0 sm:col-span-1">
                        <h2 className="break-words text-base font-semibold leading-snug sm:text-lg">
                          {productPath ? <Link to={productPath} className="hover:text-primary hover:underline">{name}</Link> : name}
                        </h2>
                        {variant ? <p className="mt-1 text-sm text-muted">{variant}</p> : null}
                        <p className="mt-1.5 text-xs text-muted">
                          <span className="whitespace-nowrap tabular-nums">{formatRub(unitPrice)} за шт.</span>
                          {item.oldUnitPriceValue > unitPrice ? (
                            <del className="ml-2 whitespace-nowrap tabular-nums">{formatRub(item.oldUnitPriceValue)}</del>
                          ) : null}
                        </p>
                      </div>
                      <div className="col-span-2 col-start-1 row-start-2 flex items-center sm:col-span-1 sm:col-start-2">
                        <div className="inline-flex w-fit min-w-0 shrink-0 overflow-hidden rounded-md border border-ink/15">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const nextQuantity = Math.max(1, item.quantity - 1);
                              setQuantityDraft(item.id, String(nextQuantity));
                              updateQuantity(item.id, nextQuantity);
                            }}
                            className="!min-h-12 !w-12 !rounded-none border-r border-ink/15 text-lg"
                            aria-label={`Уменьшить количество: ${name}`}
                            disabled={item.quantity <= 1}
                          >
                            −
                          </Button>
                          <label className="sr-only" htmlFor={`cart-item-qty-${item.id}`}>{`Количество: ${name}`}</label>
                          <Input
                            id={`cart-item-qty-${item.id}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="!min-h-12 !w-12 !rounded-none !border-0 !px-1 text-center text-sm font-semibold tabular-nums"
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
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const nextQuantity = item.quantity + 1;
                              setQuantityDraft(item.id, String(nextQuantity));
                              updateQuantity(item.id, nextQuantity);
                            }}
                            className="!min-h-12 !w-12 !rounded-none border-l border-ink/15 text-lg"
                            aria-label={`Увеличить количество: ${name}`}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <p className="col-start-3 row-start-2 self-center whitespace-nowrap text-right text-base font-semibold tabular-nums sm:row-start-1 sm:self-start">
                        <span className="sr-only">Сумма за позицию </span>
                        {formatRub(lineTotal)}
                      </p>
                      <div className="col-span-3 flex flex-wrap items-center gap-x-3 border-t border-line pt-1 sm:justify-end">
                        {productPath ? (
                          <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)} className="!px-0 text-xs text-primary">
                            Изменить вариант
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="!px-0 text-xs text-muted hover:text-sale">
                          Удалить
                        </Button>
                      </div>
                      {(item.pricingLine?.availabilityMessage || item.pricingLine?.quantityAvailable === false) ? (
                        <p className="col-span-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          {item.pricingLine.availabilityMessage || 'Проверьте наличие: этот товар требует обновления количества.'}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {items.length > 1 ? (
                <Button variant="ghost" size="sm" className="mt-2 !px-0 text-xs text-muted" onClick={clearCart}>
                  Очистить корзину
                </Button>
              ) : null}
            </div>

            <aside className="rounded-lg border border-line bg-white p-4 sm:p-5 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] xl:p-6" aria-label="Сводка заказа">
              <h2 className="mb-4 text-2xl font-semibold">Ваш заказ</h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>Товары ({itemCount})</dt>
                  <dd className="whitespace-nowrap tabular-nums">{formatRub(originalSubtotal)}</dd>
                </div>
                {productSaleDiscount > 0 ? (
                  <div className="flex justify-between gap-3 text-sale">
                    <dt>Скидки на товары</dt>
                    <dd className="whitespace-nowrap tabular-nums">−{formatRub(productSaleDiscount)}</dd>
                  </div>
                ) : null}
                {cartDiscount > 0 ? (
                  <div className="flex justify-between gap-3 text-sale">
                    <dt>{pricing?.appliedCartDiscountLabel || 'Скидка по корзине'}</dt>
                    <dd className="whitespace-nowrap tabular-nums">−{formatRub(cartDiscount)}</dd>
                  </div>
                ) : thresholdDiscount > 0 ? (
                  <div className="flex justify-between gap-3 text-muted">
                    <dt>Доступна скидка по сумме корзины</dt>
                    <dd className="whitespace-nowrap tabular-nums">до −{formatRub(thresholdDiscount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3 text-muted">
                  <dt>Доставка</dt>
                  <dd className="text-right">Рассчитаем отдельно</dd>
                </div>
              </dl>

              <div className="mt-3 border-y border-line py-0.5">
                {isPromoExpanded ? (
                  <form onSubmit={handleApplyPromoCode} className="py-3">
                    <label className="mb-1.5 block text-sm font-medium" htmlFor="cart-promo-code">Промокод</label>
                    <div className="flex gap-2">
                      <Input
                        id="cart-promo-code"
                        value={promoDraft}
                        onChange={(event) => setPromoDraft(event.target.value.toUpperCase())}
                        placeholder="ПРОМО"
                        autoComplete="off"
                        className="min-w-0"
                        disabled={isPromoSubmitting}
                      />
                      <Button type="submit" variant="secondary" className="!px-3" disabled={isPromoSubmitting}>
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
                        <Button type="button" variant="ghost" size="sm" className="!px-1 text-xs" onClick={handleRemovePromoCode} disabled={isPromoSubmitting}>
                          Удалить
                        </Button>
                      </div>
                    ) : null}
                    {promoWasValidButNotChosen ? (
                      <p className="mt-2 text-xs text-muted">Скидка по сумме корзины сейчас выгоднее промокода.</p>
                    ) : null}
                  </form>
                ) : (
                  <Button type="button" variant="ghost" size="sm" className="!px-0 text-primary" onClick={() => setIsPromoExpanded(true)}>
                    У меня есть промокод <span aria-hidden="true">+</span>
                  </Button>
                )}
                {promoStatus ? <NotificationBanner notification={promoStatus} compact className="mb-3" /> : null}
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">К оплате за товары</p>
                <p className="whitespace-nowrap text-xl font-semibold tabular-nums">{formatRub(total)}</p>
              </div>
              <p id="cart-delivery-note" className="mt-1 text-xs leading-relaxed text-muted">{DELIVERY_SEPARATE_PAYMENT_NOTE}</p>
              <DeliveryQuoteLink className="hidden text-sm lg:inline-flex" />
              {hasAvailabilityWarnings ? (
                <NotificationBanner
                  notification={{
                    type: 'warning',
                    title: 'Нужно обновить корзину',
                    message: 'Некоторые позиции закончились или превышают доступное количество.'
                  }}
                  compact
                  className="mt-3"
                />
              ) : null}
              <Button
                block
                className="mt-4 hidden lg:inline-flex"
                onClick={handleCheckout}
                disabled={hasAvailabilityWarnings}
                aria-describedby="cart-delivery-note"
              >
                {hasAvailabilityWarnings ? 'Обновите корзину' : 'Оформить заказ'}
              </Button>
              {!isAuthenticated ? <p className="mt-2 text-xs text-muted">Можно оформить без аккаунта.</p> : null}
              <p className="mt-3 text-xs text-muted">{paymentSummaryLabel}</p>
            </aside>
          </div>
        )}
      </div>
      {items.length > 0 ? (
        <div
          data-testid="mobile-cart-checkout-bar"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/15 bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 lg:hidden"
        >
          <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="whitespace-nowrap text-lg font-semibold leading-tight tabular-nums">{formatRub(total)}</p>
              <p id="mobile-cart-delivery-note" className="sr-only">{DELIVERY_SEPARATE_PAYMENT_NOTE}</p>
              <DeliveryQuoteLink className="text-xs" />
            </div>
            <Button className="shrink-0 !px-3 text-sm" onClick={handleCheckout} disabled={hasAvailabilityWarnings} aria-describedby="mobile-cart-delivery-note">
              {hasAvailabilityWarnings ? 'Обновите корзину' : 'Оформить заказ'}
            </Button>
          </div>
        </div>
      ) : null}
      <QuickViewSheet
        open={Boolean(editingItem && editingProduct)}
        product={editingProduct}
        title="Изменить вариант"
        submitLabel="Заменить в корзине"
        onAddSuccess={() => {
          if (editingItem?.id) {
            removeItem(editingItem.id);
          }
        }}
        onClose={() => {
          setEditingItem(null);
          setEditingProduct(null);
        }}
      />
    </div>
  );
}

export default CartPage;

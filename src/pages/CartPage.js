import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../contexts/CartContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { isApiRequestError } from '../api';
import NotificationBanner from '../components/NotificationBanner';
import Seo from '../components/Seo';
import { moneyToNumber } from '../utils/product';
import { useAuth } from '../contexts/AuthContext';
import { usePaymentConfig } from '../contexts/PaymentConfigContext';
import { METRIKA_GOALS, trackGoal } from '../utils/metrika';
import {
  getCheckoutPaymentDescription,
  getPaymentSummaryLabel
} from '../utils/payment';
import { CART_SESSION_STRATEGY } from '../utils/account';
import { Button, Card, Input } from '../components/ui';
import { readEnv } from '../config/runtime';
import QuickViewSheet from '../components/commerce/QuickViewSheet';
import { useProductDirectoryData } from '../features/product-list/data';

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
  const { products } = useProductDirectoryData({ requireFull: true });
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

  const findProductForCartItem = (item) => {
    if (!item) return null;
    return products.find((product) => {
      if (String(product?.id || '') === String(item.productInfo?.id || '')) {
        return true;
      }
      const variants = Array.isArray(product?.variants) ? product.variants : Array.from(product?.variants || []);
      return variants.some((variant) => String(variant?.id || '') === String(item.variantId || ''));
    }) || null;
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
                  className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 sm:flex sm:flex-row sm:items-center"
                >
                  <div className="h-24 w-24 rounded-2xl overflow-hidden bg-sand/60 border border-white/70 flex-shrink-0">
                    {item.productInfo?.imageUrl ? (
                      <img src={item.productInfo.imageUrl} alt={item.productInfo?.name || 'Товар'} className="w-full h-full object-cover" />
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
                    {item.pricingLine?.availabilityMessage ? (
                      <p className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        {item.pricingLine.availabilityMessage}
                      </p>
                    ) : item.pricingLine?.quantityAvailable === false ? (
                      <p className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Проверьте наличие: этот товар требует обновления количества.
                      </p>
                    ) : null}
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
                          className="!h-12 !w-14 !rounded-xl !px-2 !py-1 text-center text-sm font-semibold"
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
                        className="text-xs text-primary hover:text-primary"
                      >
                        Добавить ещё одну
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                        className="text-xs text-primary hover:text-primary"
                      >
                        Изменить вариант
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-muted hover:text-primary"
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="w-full space-y-4 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:max-w-sm lg:self-start">
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
                <div className="my-4 rounded-2xl border border-ink/10 bg-sand/40 p-3">
                  {isPromoExpanded ? (
                    <form onSubmit={handleApplyPromoCode}>
                      <label className="text-sm font-semibold" htmlFor="cart-promo-code">
                        Акции и промокоды
                      </label>
                      <div className="mt-2 flex gap-2">
                        <Input
                          id="cart-promo-code"
                          value={promoDraft}
                          onChange={(event) => setPromoDraft(event.target.value.toUpperCase())}
                          placeholder="ПРОМО"
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
                    </form>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-start text-primary"
                      onClick={() => setIsPromoExpanded(true)}
                    >
                      У меня есть промокод
                    </Button>
                  )}
                  {promoStatus ? <NotificationBanner notification={promoStatus} compact className="mt-3" /> : null}
                </div>
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
                {hasAvailabilityWarnings ? (
                  <NotificationBanner
                    notification={{
                      type: 'warning',
                      title: 'Нужно обновить корзину',
                      message: 'Некоторые позиции закончились или превышают доступное количество.'
                    }}
                    compact
                    className="mb-3"
                  />
                ) : null}
                <Button block className="mb-2" onClick={handleCheckout} disabled={hasAvailabilityWarnings}>
                  {hasAvailabilityWarnings ? 'Обновите корзину' : 'Оформить заказ'}
                </Button>
                {!isAuthenticated && (
                  <div className="mb-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-ink/90">
                    {CART_SESSION_STRATEGY.guestCheckoutMessage}
                  </div>
                )}
                <Button variant="secondary" block onClick={clearCart}>
                  Очистить корзину
                </Button>
              </Card>
              <Card padding="sm" className="text-sm space-y-2">
                <p className="font-semibold">Почему с нами спокойно</p>
                <p className="text-muted">После оплаты менеджер согласует варианты доставки и финальную стоимость.</p>
                <p className="text-muted">{paymentDescription} Поддержка ежедневно с 9:00 до 21:00.</p>
              </Card>
            </div>
          </div>
        )}
      </div>
      <QuickViewSheet
        open={Boolean(editingItem)}
        product={findProductForCartItem(editingItem)}
        title="Изменить вариант"
        submitLabel="Заменить в корзине"
        onAddSuccess={() => {
          if (editingItem?.id) {
            removeItem(editingItem.id);
          }
        }}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
}

export default CartPage;

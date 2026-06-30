import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from '../ui';
import { CartContext } from '../../contexts/CartContext';
import { moneyToNumber } from '../../utils/product';

function formatRub(value) {
  return `${Math.max(0, Number(value) || 0).toLocaleString('ru-RU')} ₽`;
}

function resolveLineTotal(item) {
  return (item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity;
}

function MiniCartDrawer({ open, onClose }) {
  const { items, pricing, removeItem, updateQuantity } = useContext(CartContext);
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const fallbackTotal = useMemo(
    () => items.reduce((sum, item) => sum + resolveLineTotal(item), 0),
    [items]
  );
  const total = pricing ? moneyToNumber(pricing.finalTotal) : fallbackTotal;
  const cartDiscount = pricing ? moneyToNumber(pricing.cartDiscount) : 0;
  const thresholdDiscount = pricing ? moneyToNumber(pricing.thresholdDiscount) : 0;
  const nudge = cartDiscount > 0
    ? `${pricing?.appliedCartDiscountLabel || 'Скидка по корзине'} уже учтена: -${formatRub(cartDiscount)}.`
    : thresholdDiscount > 0
    ? `Автоматическая скидка проверена. Доступно до -${formatRub(thresholdDiscount)} по правилам акции.`
    : 'Скидки и промокоды пересчитаются на полной странице корзины.';

  return (
    <Modal
      open={open}
      onClose={onClose}
      placement="sheet"
      size="sm"
      title="Корзина"
      description={itemCount > 0 ? `${itemCount} товаров в заказе` : 'Пока пусто'}
      panelClassName="h-[86dvh] max-h-[86dvh]"
    >
      {items.length === 0 ? (
        <div className="space-y-4 pb-8">
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white/80 px-4 py-8 text-center">
            <p className="font-semibold">Корзина пока пуста</p>
            <p className="mt-1 text-sm text-muted">Добавьте товары из каталога и вернитесь к оформлению.</p>
          </div>
          <Button as={Link} to="/catalog" block onClick={onClose}>
            Перейти в каталог
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3 pb-32">
            {items.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-2xl border border-ink/10 bg-white/90 p-3"
              >
                <div className="h-[86px] overflow-hidden rounded-xl border border-ink/10 bg-sand/50">
                  {item.productInfo?.imageUrl ? (
                    <img
                      src={item.productInfo.imageUrl}
                      alt={item.productInfo?.name || 'Товар'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-muted">
                      Нет фото
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">
                    {item.productInfo?.name || 'Товар'}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {item.productInfo?.variantName || item.variantId}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="inline-flex min-h-[40px] items-center rounded-2xl border border-ink/10 bg-white p-1">
                      <button
                        type="button"
                        className="h-8 w-8 rounded-xl text-lg"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        aria-label="Уменьшить количество"
                      >
                        -
                      </button>
                      <span className="min-w-[1.75rem] text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-xl text-lg"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Увеличить количество"
                      >
                        +
                      </button>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-accent">
                      {formatRub(resolveLineTotal(item))}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-2 min-h-[32px] text-xs font-semibold text-muted"
                    onClick={() => removeItem(item.id)}
                  >
                    Удалить
                  </button>
                </div>
              </article>
            ))}

            <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-ink/90">
              {nudge}
            </div>
          </div>

          <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-ink/10 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 sm:-mx-5 sm:-mb-5 sm:px-5 lg:-mx-6 lg:-mb-6 lg:px-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">Итого</span>
              <span className="text-xl font-semibold text-ink">{formatRub(total)}</span>
            </div>
            <div className="grid gap-2">
              <Button as={Link} to="/checkout" block onClick={onClose}>
                Оформить заказ
              </Button>
              <Button as={Link} to="/cart" block variant="secondary" onClick={onClose}>
                Полная корзина
              </Button>
              <Button type="button" block variant="ghost" onClick={onClose}>
                Продолжить покупки
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

export default MiniCartDrawer;

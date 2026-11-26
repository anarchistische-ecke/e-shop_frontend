import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal } from '../ui';
import { CartContext } from '../../contexts/CartContext';
import { formatProductCount, moneyToNumber } from '../../utils/product';
import { DELIVERY_SEPARATE_PAYMENT_NOTE } from '../../utils/delivery';
import { TrashIcon } from '../header/icons';

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
  const nudge = cartDiscount > 0
    ? `${pricing?.appliedCartDiscountLabel || 'Скидка по корзине'}: −${formatRub(cartDiscount)}`
    : '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      placement="sheet"
      size="sm"
      title="Корзина"
      description={itemCount > 0 ? formatProductCount(itemCount) : 'Пока пусто'}
      panelClassName="flex h-[86dvh] max-h-[86dvh] flex-col overflow-hidden lg:h-full lg:max-h-none"
    >
      {items.length === 0 ? (
        <div className="space-y-4 pb-8">
          <div className="rounded-lg border border-line bg-canvas px-4 py-8 text-center">
            <p className="font-semibold">Корзина пока пуста</p>
            <p className="mt-1 text-sm text-muted">Добавьте товары из каталога и вернитесь к оформлению.</p>
          </div>
          <Button as={Link} to="/catalog" block onClick={onClose}>
            Перейти в каталог
          </Button>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-y-contain border-t border-line">
            {items.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-4"
              >
                <div className="h-[86px] overflow-hidden rounded-lg bg-secondary">
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
                    <div className="inline-flex items-center rounded-lg border border-line bg-white">
                      <button
                        type="button"
                        className="focus-ring-soft h-11 w-11 rounded-lg text-lg disabled:text-muted/70"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        aria-label="Уменьшить количество"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="min-w-[1.75rem] text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        className="focus-ring-soft h-11 w-11 rounded-lg text-lg"
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
                    className="focus-ring-soft mt-1 inline-flex min-h-11 items-center gap-1.5 rounded text-xs font-semibold text-muted hover:text-ink"
                    onClick={() => removeItem(item.id)}
                  >
                    <TrashIcon className="h-4 w-4" /> Удалить
                  </button>
                </div>
              </article>
            ))}

            {nudge ? <p className="py-3 text-sm font-semibold text-sale">{nudge}</p> : null}
          </div>

          <div className="shrink-0 border-t border-line pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold">Товары к оплате</span>
              <span className="whitespace-nowrap text-xl font-bold tabular-nums text-ink">{formatRub(total)}</span>
            </div>
            <p className="mb-3 text-xs text-muted">{DELIVERY_SEPARATE_PAYMENT_NOTE}</p>
            <div className="grid gap-1.5">
              <Button as={Link} to="/checkout" block onClick={onClose}>
                Оформить заказ
              </Button>
              <Button as={Link} to="/cart" block variant="secondary" onClick={onClose}>
                Открыть корзину
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

export default MiniCartDrawer;

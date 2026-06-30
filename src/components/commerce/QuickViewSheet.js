import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Modal } from '../ui';
import { CartContext } from '../../contexts/CartContext';
import { WishlistContext } from '../../contexts/WishlistContext';
import ResponsiveImage from '../media/ResponsiveImage';
import {
  getPrimaryImageUrl,
  getPrimaryVariant,
  moneyToNumber,
  normalizeProductImages,
  toArray
} from '../../utils/product';
import { buildProductPath } from '../../utils/url';
import { HeartIcon } from '../header/icons';

const NOTIFY_STORAGE_KEY = 'cozyhome-oos-notify:v1';

function getStockValue(entity) {
  return Number(entity?.stock ?? entity?.stockQuantity ?? 0);
}

function getVariantColorKey(variant) {
  return String(variant?.colorCode || variant?.colorLabel || variant?.colorHex || 'default')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function getVariantColorLabel(variant) {
  return variant?.colorLabel || variant?.colorCode || 'Цвет';
}

function getVariantSizeKey(variant) {
  return String(variant?.sizeCode || variant?.sizeLabel || variant?.name || variant?.sku || variant?.id || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function getVariantSizeLabel(variant) {
  return variant?.sizeLabel || variant?.name || variant?.sku || 'Вариант';
}

function readNotifyFlags() {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(NOTIFY_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeNotifyFlag(variantId) {
  if (typeof window === 'undefined' || !variantId) {
    return;
  }
  const next = {
    ...readNotifyFlags(),
    [variantId]: new Date().toISOString()
  };
  window.localStorage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify(next));
}

function pickInitialVariant(product) {
  const variants = toArray(product?.variants);
  return variants.find((variant) => getStockValue(variant) > 0) || getPrimaryVariant(product) || variants[0] || null;
}

function QuickViewSheet({
  open,
  product,
  onClose,
  onAddSuccess,
  submitLabel = 'Добавить в корзину',
  title = 'Быстрый просмотр'
}) {
  const location = useLocation();
  const { addItem } = useContext(CartContext);
  const { isWishlisted, toggle } = useContext(WishlistContext);
  const [selectedVariant, setSelectedVariant] = useState(() => pickInitialVariant(product));
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [status, setStatus] = useState(null);
  const [notifyFlags, setNotifyFlags] = useState(readNotifyFlags);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedVariant(pickInitialVariant(product));
    setQuantity(1);
    setStatus(null);
    setNotifyFlags(readNotifyFlags());
  }, [open, product]);

  const variants = useMemo(() => toArray(product?.variants), [product]);
  const images = useMemo(() => normalizeProductImages(product?.images || []), [product]);
  const selectedImage =
    getPrimaryImageUrl(product, selectedVariant?.id) ||
    images.find((image) => !image.variantId)?.url ||
    images[0]?.url ||
    '';
  const selectedMedia =
    images.find((image) => image.variantId === selectedVariant?.id)?.media ||
    images.find((image) => !image.variantId)?.media ||
    images[0]?.media ||
    product?.primaryMedia ||
    null;
  const price = selectedVariant ? moneyToNumber(selectedVariant.price) : moneyToNumber(product?.price);
  const oldPrice = selectedVariant?.oldPrice ? moneyToNumber(selectedVariant.oldPrice) : moneyToNumber(product?.oldPrice);
  const hasDiscount = oldPrice > price;
  const stock = selectedVariant ? getStockValue(selectedVariant) : 0;
  const isOutOfStock = !selectedVariant || stock <= 0;
  const productPath = product ? buildProductPath(product) : '/catalog';

  const colorOptions = useMemo(() => {
    const map = new Map();
    variants.forEach((variant) => {
      const key = getVariantColorKey(variant);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: getVariantColorLabel(variant),
          hex: variant?.colorHex || '',
          variant,
          available: false
        });
      }
      if (getStockValue(variant) > 0) {
        map.get(key).available = true;
      }
    });
    return Array.from(map.values());
  }, [variants]);

  const selectedColorKey = selectedVariant ? getVariantColorKey(selectedVariant) : '';
  const sizeOptions = useMemo(() => {
    const scoped = colorOptions.length > 1 && selectedColorKey
      ? variants.filter((variant) => getVariantColorKey(variant) === selectedColorKey)
      : variants;
    const map = new Map();
    scoped.forEach((variant) => {
      const key = getVariantSizeKey(variant);
      if (!map.has(key) || (getStockValue(map.get(key).variant) <= 0 && getStockValue(variant) > 0)) {
        map.set(key, {
          key,
          label: getVariantSizeLabel(variant),
          variant,
          stock: getStockValue(variant)
        });
      }
    });
    return Array.from(map.values());
  }, [colorOptions.length, selectedColorKey, variants]);

  if (!product) {
    return null;
  }

  const selectColor = (option) => {
    const nextVariant =
      option.variant?.id === selectedVariant?.id
        ? option.variant
        : variants.find((variant) => getVariantColorKey(variant) === option.key && getStockValue(variant) > 0) ||
          option.variant;
    setSelectedVariant(nextVariant);
    setStatus(null);
  };

  const handleAdd = async () => {
    if (!selectedVariant?.id || isOutOfStock || isAdding) {
      return;
    }
    setIsAdding(true);
    setStatus(null);
    try {
      const result = await addItem(product, selectedVariant.id, quantity, { notifyOnError: false });
      if (result?.ok === false) {
        setStatus(result.notification || { type: 'error', message: 'Не удалось добавить товар.' });
        return;
      }
      onAddSuccess?.({ product, variant: selectedVariant, quantity });
      onClose?.();
    } finally {
      setIsAdding(false);
    }
  };

  const handleNotify = () => {
    if (!selectedVariant?.id) {
      return;
    }
    writeNotifyFlag(selectedVariant.id);
    setNotifyFlags(readNotifyFlags());
    setStatus({
      type: 'success',
      message: 'Сохранили запрос. В этом браузере отметка останется в избранном.'
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      placement="sheet"
      size="md"
      title={title}
      description="Выберите вариант и добавьте товар без ухода со страницы."
      panelClassName="h-[86dvh] max-h-[86dvh] lg:max-w-lg"
    >
      <div className="space-y-4 pb-24">
        <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4">
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand/50">
            <div className="relative pt-[112%]">
              {selectedImage ? (
                <ResponsiveImage
                  media={selectedMedia}
                  src={selectedImage}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  sizes="136px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                  Нет фото
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-semibold leading-snug">{product.name}</h3>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-semibold text-accent">{price.toLocaleString('ru-RU')} ₽</span>
              {hasDiscount ? (
                <span className="text-sm text-muted line-through">{oldPrice.toLocaleString('ru-RU')} ₽</span>
              ) : null}
            </div>
            <p className={`mt-2 text-sm ${isOutOfStock ? 'text-red-700' : 'text-emerald-700'}`}>
              {isOutOfStock ? 'Нет в наличии' : stock <= 3 ? `Осталось ${stock} шт.` : 'В наличии'}
            </p>
            <button
              type="button"
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-ink/10 bg-white px-3 text-sm font-semibold text-ink"
              onClick={() => toggle(product)}
            >
              <HeartIcon className="h-4 w-4" filled={isWishlisted(product)} />
              {isWishlisted(product) ? 'В избранном' : 'В избранное'}
            </button>
          </div>
        </div>

        {colorOptions.length > 1 ? (
          <section>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Цвет</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {colorOptions.map((option) => {
                const active = option.key === selectedColorKey;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`min-h-[48px] min-w-[48px] rounded-2xl border px-2 text-xs font-semibold ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : option.available
                        ? 'border-ink/10 bg-white text-ink'
                        : 'border-ink/10 bg-secondary/50 text-muted'
                    }`}
                    onClick={() => selectColor(option)}
                    aria-pressed={active}
                  >
                    <span
                      className="mx-auto mb-1 block h-5 w-5 rounded-full border border-ink/15"
                      style={{ backgroundColor: option.hex || '#f3eee6' }}
                      aria-hidden="true"
                    />
                    <span className="block max-w-[72px] truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {sizeOptions.length > 0 ? (
          <section>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Размер</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {sizeOptions.map((option) => {
                const active = option.variant?.id === selectedVariant?.id;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`min-h-[48px] rounded-2xl border px-3 text-sm font-semibold ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : option.stock > 0
                        ? 'border-ink/10 bg-white text-ink'
                        : 'border-ink/10 bg-secondary/50 text-muted'
                    }`}
                    onClick={() => {
                      setSelectedVariant(option.variant);
                      setStatus(null);
                    }}
                    aria-pressed={active}
                  >
                    {option.label}
                    {option.stock <= 0 ? <span className="block text-[11px] font-normal">нет</span> : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <div className="inline-flex min-h-[48px] items-center rounded-2xl border border-ink/10 bg-white p-1">
            <button
              type="button"
              className="h-10 w-10 rounded-xl text-lg"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              aria-label="Уменьшить количество"
            >
              -
            </button>
            <span className="min-w-[2rem] text-center text-sm font-semibold">{quantity}</span>
            <button
              type="button"
              className="h-10 w-10 rounded-xl text-lg"
              onClick={() => setQuantity((value) => Math.min(Math.max(stock, 1), value + 1))}
              aria-label="Увеличить количество"
              disabled={isOutOfStock}
            >
              +
            </button>
          </div>
          <Button as={Link} to={productPath} state={{ fromPath: `${location.pathname}${location.search}` }} variant="secondary" block onClick={onClose}>
            Полная карточка
          </Button>
        </div>

        {status ? (
          <div className={`rounded-2xl border px-3 py-2 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {status.title ? <p className="font-semibold">{status.title}</p> : null}
            <p>{status.message}</p>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-ink/10 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 sm:-mx-5 sm:-mb-5 sm:px-5 lg:-mx-6 lg:-mb-6 lg:px-6">
        {isOutOfStock ? (
          <Button type="button" block variant="secondary" onClick={handleNotify} disabled={Boolean(notifyFlags[selectedVariant?.id])}>
            {notifyFlags[selectedVariant?.id] ? 'Уведомление сохранено' : 'Сообщить о поступлении'}
          </Button>
        ) : (
          <Button type="button" block onClick={handleAdd} disabled={isAdding}>
            {isAdding ? 'Добавляем...' : submitLabel}
          </Button>
        )}
      </div>
    </Modal>
  );
}

export default QuickViewSheet;

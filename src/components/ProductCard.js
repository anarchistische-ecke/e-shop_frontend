import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBanner from './NotificationBanner';
import { CartContext } from '../contexts/CartContext';
import { Button, Card } from './ui';
import {
  getPrimaryVariant,
  getProductPrice,
  moneyToNumber,
  normalizeProductImages,
} from '../utils/product';
import { buildProductPath } from '../utils/url';

function getStockCount(product) {
  if (!product) return 0;
  if (product.stock !== undefined || product.stockQuantity !== undefined) {
    return Number(product.stock ?? product.stockQuantity ?? 0);
  }

  const variants = Array.isArray(product.variants) ? product.variants : Array.from(product.variants || []);
  return variants.reduce(
    (sum, variant) => sum + Number(variant?.stock ?? variant?.stockQuantity ?? 0),
    0
  );
}

function ProductCard({ product }) {
  const location = useLocation();
  const primaryVariant = getPrimaryVariant(product);

  const currentPrice = primaryVariant?.price
    ? moneyToNumber(primaryVariant.price)
    : getProductPrice(product);
  const oldPrice = product.oldPrice ? moneyToNumber(product.oldPrice) : null;
  const hasDiscount = Boolean(oldPrice && oldPrice > currentPrice);
  const discount = hasDiscount
    ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : null;

  const images = useMemo(() => {
    const normalized = normalizeProductImages(product?.images || []);
    if (normalized.length > 0) return normalized;
    return [];
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    if (activeImageIndex > images.length - 1) {
      setActiveImageIndex(0);
    }
  }, [images.length, activeImageIndex]);

  useEffect(() => {
    if (!isHovered || images.length <= 1) return undefined;
    hoverTimerRef.current = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 1800);

    return () => {
      if (hoverTimerRef.current) clearInterval(hoverTimerRef.current);
    };
  }, [isHovered, images.length]);

  const activeImage = images[activeImageIndex]?.url || images[0]?.url || '';

  const stockCount = getStockCount(product);
  const isLowStock = stockCount > 0 && stockCount <= 3;
  const stockLabel =
    stockCount <= 0
      ? 'Нет в наличии'
      : isLowStock
      ? `Осталось ${stockCount} шт.`
      : 'В наличии';
  const stockTone =
    stockCount <= 0 ? 'text-red-700' : isLowStock ? 'text-amber-700' : 'text-emerald-700';

  const attributeLine =
    product?.material
      ? `Материал: ${product.material}`
      : product?.size
      ? `Размер: ${product.size}`
      : product?.color
      ? `Цвет: ${product.color}`
      : 'Подробности и характеристики на карточке товара';

  const badges = [
    isLowStock ? `Мало на складе: ${stockCount}` : '',
    product?.category === 'new' ? 'Новинка' : '',
  ].filter(Boolean);

  return (
    <Card
      variant="quiet"
      padding="sm"
      interactive
      className="product-card group h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={buildProductPath(product)}
        state={{ fromPath: `${location.pathname}${location.search}`, fromLabel: 'Каталог' }}
        className="block"
      >
        <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-sand/60">
          <div className="relative pt-[74%]">
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                Нет фото
              </div>
            )}
          </div>

          <div className="absolute inset-x-2 top-2 flex flex-wrap gap-2">
            {hasDiscount && (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                −{discount}%
              </span>
            )}
            {badges.slice(0, 2).map((badge) => (
              <span
                key={`${product.id}-${badge}`}
                className="rounded-full border border-ink/15 bg-white/90 px-2.5 py-1 text-[11px] text-ink/75"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </Link>

      <div className="mt-2 min-h-[34px]">
        {images.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {images.slice(0, 4).map((image, index) => (
              <button
                key={image.id || `${product.id}-thumb-${index}`}
                type="button"
                className={`h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg border ${
                  index === activeImageIndex
                    ? 'border-primary/55 ring-2 ring-primary/20'
                    : 'border-ink/15'
                }`}
                onClick={() => setActiveImageIndex(index)}
                aria-label={`Показать изображение ${index + 1}`}
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        <Link
          to={buildProductPath(product)}
          state={{ fromPath: `${location.pathname}${location.search}`, fromLabel: 'Каталог' }}
          className="block"
        >
          <p className="min-h-[2.75rem] line-clamp-2 text-sm font-semibold leading-snug text-ink">{product.name}</p>
        </Link>

        <div className={`min-h-[1.1rem] flex items-center gap-2 text-xs ${stockTone}`}>
          <span>{stockLabel}</span>
        </div>

        <p className="min-h-[1.1rem] line-clamp-1 text-xs text-muted">{attributeLine}</p>

        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-accent">
              {currentPrice.toLocaleString('ru-RU')} ₽
            </span>
            {hasDiscount && (
              <span className="line-through text-muted text-xs">
                {oldPrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
          <AddToCartButton
            product={product}
            variantId={primaryVariant?.id}
            disabled={stockCount <= 0}
          />
        </div>
      </div>
    </Card>
  );
}

function AddToCartButton({ product, variantId, disabled = false }) {
  const { addItem } = useContext(CartContext);
  const [status, setStatus] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setStatus(null);
    setIsAdding(false);
  }, [product?.id, variantId]);

  const handleClick = async (event) => {
    event.preventDefault();
    if (isAdding || disabled) {
      return;
    }
    setStatus(null);
    setIsAdding(true);
    try {
      const result = await addItem(product, variantId, 1);
      if (result?.ok === false) {
        setStatus(result.notification);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full sm:w-auto">
      <Button
        size="sm"
        className="w-full bg-accent px-3 py-2 text-xs shadow-[0_10px_20px_rgba(47,61,50,0.24)] hover:bg-accent/90 sm:w-auto"
        onClick={handleClick}
        disabled={disabled || isAdding}
      >
        <span>
          {disabled ? 'Нет в наличии' : isAdding ? 'Добавляем…' : 'В корзину'}
        </span>
      </Button>
      {status ? <NotificationBanner notification={status} compact className="mt-2 sm:max-w-[240px]" /> : null}
    </div>
  );
}

export default ProductCard;

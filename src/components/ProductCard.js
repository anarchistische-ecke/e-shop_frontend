import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { reviews } from '../data/reviews';
import {
  getPrimaryVariant,
  getProductPrice,
  moneyToNumber,
  normalizeProductImages,
} from '../utils/product';

const reviewStats = reviews.reduce((acc, review) => {
  const entry = acc[review.productId] || { total: 0, count: 0 };
  entry.total += review.rating;
  entry.count += 1;
  acc[review.productId] = entry;
  return acc;
}, {});

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

  const rating = Number(product?.rating || 0);
  const reviewCount =
    product.reviewCount ??
    product.reviewsCount ??
    product.reviews_count ??
    reviewStats[product.id]?.count ??
    0;

  const derivedRating = reviewStats[product.id]?.count
    ? reviewStats[product.id].total / reviewStats[product.id].count
    : rating;

  const displayRating = derivedRating || rating;
  const stockCount = getStockCount(product);
  const isLowStock = stockCount > 0 && stockCount <= 3;

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
    displayRating >= 4.8 ? 'Хит продаж' : '',
    !hasDiscount && displayRating >= 4.5 ? 'Новинка' : '',
  ].filter(Boolean);

  return (
    <div
      className="product-card group h-full rounded-[24px] border border-ink/10 bg-white/92 p-3 shadow-[0_16px_34px_rgba(43,39,34,0.11)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgba(43,39,34,0.16)] flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/product/${product.id}`}
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
          to={`/product/${product.id}`}
          state={{ fromPath: `${location.pathname}${location.search}`, fromLabel: 'Каталог' }}
          className="block"
        >
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{product.name}</p>
        </Link>

        <div className="flex items-center gap-2 text-xs text-muted">
          {displayRating > 0 ? (
            <>
              <span className="text-primary">★ {displayRating.toFixed(1)}</span>
              <span>({reviewCount})</span>
            </>
          ) : (
            <span>Нет отзывов</span>
          )}
        </div>

        <p className="line-clamp-1 text-xs text-muted">{attributeLine}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
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
          <AddToCartButton product={product} variantId={primaryVariant?.id} />
        </div>
      </div>
    </div>
  );
}

function AddToCartButton({ product, variantId }) {
  const { addItem } = useContext(CartContext);
  const [isBouncing, setIsBouncing] = useState(false);

  const handleClick = async (event) => {
    event.preventDefault();
    await addItem(product, variantId);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 450);
  };

  return (
    <button
      type="button"
      className={`inline-flex min-h-[40px] items-center gap-1 rounded-2xl bg-accent text-white px-3 py-2 text-xs font-semibold shadow-[0_10px_20px_rgba(47,61,50,0.24)] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${isBouncing ? 'animate-bounce' : ''}`}
      onClick={handleClick}
    >
      <span>В корзину</span>
    </button>
  );
}

export default ProductCard;

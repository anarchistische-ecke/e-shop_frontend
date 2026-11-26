import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBanner from './NotificationBanner';
import { CartContext } from '../contexts/CartContext';
import { WishlistContext } from '../contexts/WishlistContext';
import ResponsiveImage from './media/ResponsiveImage';
import { Button } from './ui';
import { HeartIcon } from './header/icons';
import {
  getPrimaryVariant,
  getProductPrice,
  moneyToNumber,
  normalizeProductImages,
} from '../utils/product';
import { buildProductPath } from '../utils/url';
import { trackProductClick } from '../utils/metrika';
import { buildOfferMicrodata } from '../seo/schema';

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

function ProductCard({
  product,
  deferThumbnails = false,
  priority = false,
  imageSizes = '(min-width: 1024px) 22vw, (min-width: 768px) 31vw, 46vw',
  listName = 'product_list',
  fromLabel = 'Каталог',
  position,
  withOfferCatalogMicrodata = false,
  onQuickView,
  showAddToCart = true
}) {
  const location = useLocation();
  const { isWishlisted, toggle } = useContext(WishlistContext);
  const primaryVariant = getPrimaryVariant(product);

  const currentPrice = primaryVariant?.price
    ? moneyToNumber(primaryVariant.price)
    : getProductPrice(product);
  const oldPrice = primaryVariant?.oldPrice
    ? moneyToNumber(primaryVariant.oldPrice)
    : product.oldPrice
    ? moneyToNumber(product.oldPrice)
    : null;
  const hasDiscount = Boolean(oldPrice && oldPrice > currentPrice);
  const discount = hasDiscount
    ? primaryVariant?.discountPercent || product.discountPercent || Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : null;

  const images = useMemo(() => {
    const normalized = normalizeProductImages(product?.images || []);
    if (normalized.length > 0) return normalized;
    return [];
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (activeImageIndex > images.length - 1) {
      setActiveImageIndex(0);
    }
  }, [images.length, activeImageIndex]);

  const activeImage = images[activeImageIndex]?.url || images[0]?.url || '';
  const activeMedia = images[activeImageIndex]?.media || images[0]?.media || product?.primaryMedia || null;
  const shouldRenderThumbnails = images.length > 1 && (!deferThumbnails || isHovered || activeImageIndex > 0);
  const offerMicrodata = useMemo(
    () =>
      withOfferCatalogMicrodata
        ? buildOfferMicrodata(product, {
            position,
            image: activeImage
          })
        : null,
    [activeImage, position, product, withOfferCatalogMicrodata]
  );

  const stockCount = getStockCount(product);
  const isAvailable = stockCount > 0;
  const isLowStock = isAvailable && stockCount <= 3;
  const stockLabel =
    !isAvailable
      ? 'Нет в наличии'
      : isLowStock
      ? `Осталось ${stockCount} шт.`
      : 'В наличии';

  const attributeCandidate = product?.attributes?.[0]
    || product?.material
    || product?.size
    || product?.color
    || product?.brandName
    || product?.brand?.name
    || '';
  const attributeLine = String(attributeCandidate).trim().replace(/\s+/g, ' ').toLowerCase() === stockLabel.toLowerCase()
    ? ''
    : attributeCandidate;

  const handleProductClick = () => {
    trackProductClick(product, {
      variant: primaryVariant,
      variantId: primaryVariant?.id,
      listName,
      position
    });
  };
  const isFavorite = isWishlisted(product);
  const handleWishlistClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggle(product);
  };

  return (
    <article
      className="product-card group flex h-full min-w-0 flex-col border-b border-ink/15 pb-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      itemProp={offerMicrodata ? 'itemListElement' : undefined}
      itemScope={Boolean(offerMicrodata) || undefined}
      itemType={offerMicrodata ? 'https://schema.org/Offer' : undefined}
    >
      {offerMicrodata ? (
        <>
          <meta itemProp="name" content={offerMicrodata.name} />
          <meta itemProp="description" content={offerMicrodata.description} />
          <link itemProp="url" href={offerMicrodata.url} />
          <link itemProp="image" href={offerMicrodata.image} />
          <link itemProp="availability" href={offerMicrodata.availability} />
          <meta itemProp="price" content={offerMicrodata.price} />
          <meta itemProp="priceCurrency" content={offerMicrodata.priceCurrency} />
        </>
      ) : null}
      <div className="relative">
        <Link
          to={buildProductPath(product)}
          state={{ fromPath: `${location.pathname}${location.search}`, fromLabel }}
          tabIndex={-1}
          aria-hidden="true"
          className="block"
          onClick={handleProductClick}
        >
          <div className="relative overflow-hidden rounded-lg bg-[#ede8df]">
            <div className="relative aspect-[4/3]">
              {activeImage ? (
                <ResponsiveImage
                  media={activeMedia}
                  src={activeImage}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 motion-safe:md:group-hover:scale-[1.025]"
                  sizes={imageSizes}
                  priority={priority}
                  loading={priority ? 'eager' : 'lazy'}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                  Нет фото
                </div>
              )}
            </div>

            {hasDiscount ? (
              <span className="absolute left-2 top-2 rounded bg-white px-2 py-1 text-[11px] font-semibold text-sale">
                −{discount}%
              </span>
            ) : null}
          </div>
        </Link>
        <button
          type="button"
          className={`focus-ring-soft absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center rounded-md border transition sm:right-2 sm:top-2 ${
            isFavorite
              ? 'border-primary/25 bg-primary text-white'
              : 'border-white/80 bg-white/95 text-ink hover:text-primary'
          }`}
          onClick={handleWishlistClick}
          aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          aria-pressed={isFavorite}
        >
          <HeartIcon className="h-5 w-5" filled={isFavorite} />
        </button>
        {shouldRenderThumbnails ? (
          <div className={deferThumbnails ? 'absolute inset-x-1 bottom-1 rounded-md bg-white/90 p-1' : 'mt-1.5'}>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {images.slice(0, 4).map((image, index) => (
                <button
                  key={image.id || `${product.id}-thumb-${index}`}
                  type="button"
                  className={`h-11 w-11 shrink-0 overflow-hidden rounded-lg border ${
                    index === activeImageIndex ? 'border-primary/55 ring-2 ring-primary/20' : 'border-ink/15'
                  }`}
                  onClick={() => setActiveImageIndex(index)}
                  aria-label={`Показать изображение ${index + 1}`}
                  aria-pressed={index === activeImageIndex}
                >
                  <ResponsiveImage
                    media={image.media}
                    src={image.url}
                    alt=""
                    className="h-full w-full object-cover"
                    sizes="2rem"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-1 flex-col gap-1.5">
        <Link
          to={buildProductPath(product)}
          state={{ fromPath: `${location.pathname}${location.search}`, fromLabel }}
          className="focus-ring-soft block rounded-sm hover:text-primary"
          onClick={handleProductClick}
        >
          <p className="line-clamp-2 text-sm font-semibold leading-snug sm:text-[15px]">{product.name}</p>
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={`text-base font-bold tabular-nums ${hasDiscount ? 'text-sale' : 'text-ink'}`}>
            {currentPrice.toLocaleString('ru-RU')} ₽
          </span>
          {hasDiscount ? (
            <span className="text-xs tabular-nums text-muted line-through">{oldPrice.toLocaleString('ru-RU')} ₽</span>
          ) : null}
        </div>

        {attributeLine ? <p className="line-clamp-1 text-xs text-muted">{attributeLine}</p> : null}
        <p className={`text-xs ${isAvailable ? 'text-primary' : 'font-semibold text-muted'}`}>{stockLabel}</p>

        {isAvailable && (onQuickView || showAddToCart) ? (
          <div className="mt-auto pt-1">
            {onQuickView ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full !min-h-11 border-primary/30 !px-2 text-xs text-primary shadow-none hover:bg-primary/5 sm:hidden"
                onClick={() => onQuickView(product)}
              >
                Быстрый просмотр
              </Button>
            ) : null}
            {showAddToCart ? (
              <div className={onQuickView ? 'hidden sm:block' : ''}>
                <AddToCartButton product={product} variantId={primaryVariant?.id} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function AddToCartButton({ product, variantId }) {
  const { addItem } = useContext(CartContext);
  const [status, setStatus] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setStatus(null);
    setIsAdding(false);
  }, [product?.id, variantId]);

  const handleClick = async (event) => {
    event.preventDefault();
    if (isAdding) {
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
    <div className="w-full">
      <Button
        size="sm"
        variant="secondary"
        className="w-full !min-h-11 border-primary/30 !px-2 text-xs text-primary shadow-none hover:bg-primary/5"
        onClick={handleClick}
        disabled={isAdding}
      >
        <span>
          {isAdding ? 'Добавляем…' : 'В корзину'}
        </span>
      </Button>
      {status ? <NotificationBanner notification={status} compact className="mt-2 sm:max-w-[240px]" /> : null}
    </div>
  );
}

export default ProductCard;

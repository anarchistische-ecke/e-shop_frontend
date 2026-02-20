import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { getCategories, getProduct, getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import { reviews } from '../data/reviews';
import {
  getPrimaryVariant,
  getProductPrice,
  moneyToNumber,
  normalizeProductImages,
} from '../utils/product';

function resolveCategoryToken(entity) {
  if (!entity) return '';
  return String(entity.slug || entity.id || entity.name || '');
}

function resolveProductCategoryToken(product) {
  const categoryValue =
    product?.category ||
    product?.categoryId ||
    product?.category_id ||
    product?.categorySlug ||
    product?.category_slug ||
    product?.category?.id ||
    product?.category?.slug ||
    product?.category?.name;

  return String(
    typeof categoryValue === 'string'
      ? categoryValue
      : categoryValue?.id || categoryValue?.slug || categoryValue?.name || ''
  );
}

function TrustIcon({ type }) {
  if (type === 'delivery') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7h11v8H3z" />
        <path d="M14 10h4l3 3v2h-7" />
        <circle cx="7" cy="18" r="1.5" />
        <circle cx="17" cy="18" r="1.5" />
      </svg>
    );
  }

  if (type === 'returns') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11a8 8 0 1 1 2.4 5.7" />
        <path d="M3 15v-4h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ProductPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [bundleSelections, setBundleSelections] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [showZoomHint, setShowZoomHint] = useState(true);
  const [sheetType, setSheetType] = useState('shipping');
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [isVariantTransitioning, setIsVariantTransitioning] = useState(false);

  const transitionTimerRef = useRef(null);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    setActiveTab('about');
    setActiveImageIndex(0);
    setRelatedProducts([]);
    setBundleSelections({});
    setIsLoading(true);

    getProduct(id)
      .then((data) => {
        if (!data || data?.isActive === false) {
          setProduct(null);
          setSelectedVariant(null);
          return;
        }
        setProduct(data);
        const variants = Array.isArray(data.variants) ? data.variants : [];
        setSelectedVariant(variants[0] || null);
      })
      .catch((err) => {
        console.error('Failed to fetch product:', err);
        setProduct(null);
        setSelectedVariant(null);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    let mounted = true;
    if (!product) return undefined;

    getProducts()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        const targetCategoryToken = resolveProductCategoryToken(product);
        const related = list.filter((item) => {
          if (!item || item.id === product.id || item?.isActive === false) return false;
          if (!targetCategoryToken) return true;
          return resolveProductCategoryToken(item) === targetCategoryToken;
        });
        setRelatedProducts(related.slice(0, 4));
      })
      .catch((err) => console.error('Failed to fetch related products:', err));

    return () => {
      mounted = false;
    };
  }, [product]);

  useEffect(() => {
    if (!relatedProducts.length) return;
    setBundleSelections((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next = {};
      relatedProducts.slice(0, 2).forEach((item) => {
        if (item?.id) next[item.id] = true;
      });
      return next;
    });
  }, [relatedProducts]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const images = useMemo(() => normalizeProductImages(product?.images || []), [product]);

  const orderedImages = useMemo(() => {
    if (!images.length) return [];
    if (selectedVariant?.id) {
      const scoped = images.filter((img) => img.variantId === selectedVariant.id);
      if (scoped.length > 0) {
        const rest = images.filter((img) => img.variantId !== selectedVariant.id);
        return [...scoped, ...rest];
      }
    }
    return images;
  }, [images, selectedVariant]);

  useEffect(() => {
    if (!orderedImages.length) {
      setActiveImageIndex(0);
      return;
    }

    setActiveImageIndex((prev) => {
      if (prev <= orderedImages.length - 1) return prev;
      return 0;
    });
  }, [orderedImages]);

  const activeImage = orderedImages[activeImageIndex] || null;
  const mainImage = activeImage?.url || '';

  const productReviews = useMemo(
    () => reviews.filter((review) => String(review.productId) === String(id)),
    [id]
  );

  const ratingDistribution = useMemo(() => {
    const distribution = [5, 4, 3, 2, 1].map((value) => ({
      rating: value,
      count: productReviews.filter((review) => Number(review.rating) === value).length,
    }));

    const maxCount = Math.max(1, ...distribution.map((entry) => entry.count));

    return distribution.map((entry) => ({
      ...entry,
      width: `${Math.round((entry.count / maxCount) * 100)}%`,
    }));
  }, [productReviews]);

  const variantNameById = useMemo(() => {
    const map = {};
    (product?.variants || []).forEach((variant) => {
      if (!variant?.id) return;
      map[variant.id] = variant.name || variant.sku || variant.id;
    });
    return map;
  }, [product]);

  const specificationSections = useMemo(() => {
    const raw = product?.specifications;
    if (!Array.isArray(raw)) return [];

    return raw
      .map((section) => {
        if (!section) return null;
        const items = Array.isArray(section.items)
          ? section.items
              .map((item) => ({
                label: item?.label || '',
                value: item?.value || '',
              }))
              .filter((item) => item.label || item.value)
          : [];

        return {
          title: section.title || '',
          description: section.description || '',
          items,
        };
      })
      .filter((section) => section && (section.title || section.description || section.items.length > 0));
  }, [product]);

  const activeCategory = useMemo(() => {
    const productToken = resolveProductCategoryToken(product);
    if (!productToken) return null;

    return (
      categories.find((category) => {
        const token = resolveCategoryToken(category);
        return token === productToken || String(category.id) === productToken;
      }) || null
    );
  }, [categories, product]);

  const fallbackSpecs = [
    product?.size ? `Размер: ${product.size}` : 'Размеры соответствуют стандартам',
    product?.color ? `Цвет: ${product.color}` : 'Стабильный оттенок после стирок',
    product?.care || 'Уход: деликатная стирка при 30°',
  ];

  const highlights = [
    product?.material ? `Материал: ${product.material}` : 'Натуральные ткани',
    product?.threadCount ? `Плотность: ${product.threadCount}` : 'Мягкая воздухопроницаемая структура',
    'Сертифицировано и подходит для чувствительной кожи',
  ];

  const price = selectedVariant
    ? moneyToNumber(selectedVariant.price)
    : moneyToNumber(product?.price || 0);
  const oldPrice = product?.oldPrice ? moneyToNumber(product.oldPrice) : 0;
  const hasDiscount = oldPrice > price;

  const availableStock = selectedVariant
    ? Number(selectedVariant.stock ?? selectedVariant.stockQuantity ?? 0)
    : Number(product?.stock ?? product?.stockQuantity ?? 0);

  const rating = Number(product?.rating || 0);
  const reviewCount = Number(
    product?.reviewCount || product?.reviewsCount || product?.reviews_count || productReviews.length
  );
  const isLowStock = availableStock > 0 && availableStock <= 3;

  const bundleItems = relatedProducts.slice(0, 3);
  const bundleAddOnTotal = bundleItems.reduce((sum, item) => {
    if (!bundleSelections[item.id]) return sum;
    return sum + getProductPrice(item);
  }, 0);
  const bundleTotal = price + bundleAddOnTotal;

  const deliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }, []);

  const selectImageByIndex = (index) => {
    if (!orderedImages.length) return;
    const safeIndex = (index + orderedImages.length) % orderedImages.length;
    const nextImage = orderedImages[safeIndex];
    setActiveImageIndex(safeIndex);

    if (nextImage?.variantId && selectedVariant?.id !== nextImage.variantId) {
      const variant = (product?.variants || []).find((item) => item.id === nextImage.variantId);
      if (variant) {
        setSelectedVariant(variant);
      }
    }
  };

  const handleVariantChange = (variant) => {
    if (!variant || variant.id === selectedVariant?.id) return;

    setIsVariantTransitioning(true);
    setSelectedVariant(variant);

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = setTimeout(() => {
      setIsVariantTransitioning(false);
    }, 200);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (availableStock <= 0) return;

    const variantId = selectedVariant?.id || product.id;
    await addItem(product, variantId);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (availableStock <= 0) return;

    const variantId = selectedVariant?.id || product.id;
    await addItem(product, variantId);
    navigate('/checkout');
  };

  const handleAddBundle = async () => {
    await handleAddToCart();
    bundleItems.forEach((item) => {
      if (!bundleSelections[item.id]) return;
      const variant = getPrimaryVariant(item);
      if (variant?.id) addItem(item, variant.id);
    });
  };

  if (isLoading) {
    return (
      <div className="product-page py-8 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-[30px] border border-ink/10 bg-white/90 p-4">
              <div className="skeleton shimmer-safe h-[65vh] rounded-[24px]" />
              <div className="mt-4 grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="skeleton shimmer-safe h-20 rounded-2xl" />
                ))}
              </div>
            </div>
            <div className="soft-card p-5 sm:p-6">
              <div className="skeleton shimmer-safe h-6 w-2/5 rounded-full" />
              <div className="mt-4 skeleton shimmer-safe h-8 w-4/5 rounded-full" />
              <div className="mt-3 skeleton shimmer-safe h-5 w-3/5 rounded-full" />
              <div className="mt-5 space-y-2">
                <div className="skeleton shimmer-safe h-12 rounded-2xl" />
                <div className="skeleton shimmer-safe h-12 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-semibold mb-2">Товар не найден</h1>
          <p>К сожалению, продукта с указанным идентификатором не существует.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page py-8 sm:py-10 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-24">
      <div className="container mx-auto px-4">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted">
          {location.state?.fromPath ? (
            <Link to={location.state.fromPath} className="text-primary hover:text-accent">
              ← {location.state.fromLabel || 'Назад к результатам'}
            </Link>
          ) : null}
          <Link to="/" className="hover:text-primary">Главная</Link>
          <span className="text-ink/40">›</span>
          <Link to="/category/popular" className="hover:text-primary">Каталог</Link>
          {activeCategory && (
            <>
              <span className="text-ink/40">›</span>
              <Link to={`/category/${resolveCategoryToken(activeCategory)}`} className="hover:text-primary">
                {activeCategory.name}
              </Link>
            </>
          )}
          <span className="text-ink/40">›</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-6 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)]">
          <div>
            <div
              className={`relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-white/80 shadow-[0_24px_60px_rgba(43,39,34,0.16)] bg-gradient-to-br from-sand/70 to-white transition-opacity duration-200 ${
                isVariantTransitioning ? 'opacity-80' : 'opacity-100'
              }`}
            >
              <div className="relative w-full pt-[112%] sm:pt-[95%]">
                {mainImage ? (
                  <button
                    type="button"
                    className="absolute inset-0 block"
                    onClick={() => {
                      setIsImageZoomOpen(true);
                      setShowZoomHint(false);
                    }}
                    aria-label="Увеличить изображение"
                  >
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                    <span className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/88 text-ink shadow-sm">
                      +
                    </span>
                  </button>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
                    Изображение появится после загрузки
                  </div>
                )}

                {showZoomHint && (
                  <p className="absolute bottom-3 left-3 rounded-xl bg-white/85 px-3 py-1 text-xs text-ink/75">
                    Нажмите, чтобы увеличить
                  </p>
                )}

                {activeImage?.variantId && (
                  <div className="absolute top-3 left-3 rounded-2xl border border-ink/10 bg-white/88 px-3 py-1 text-xs">
                    Вариант: {variantNameById[activeImage.variantId] || activeImage.variantId}
                  </div>
                )}

                {orderedImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl border border-ink/10 bg-white/90 text-ink shadow"
                      onClick={() => selectImageByIndex(activeImageIndex - 1)}
                      aria-label="Предыдущее изображение"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl border border-ink/10 bg-white/90 text-ink shadow"
                      onClick={() => selectImageByIndex(activeImageIndex + 1)}
                      aria-label="Следующее изображение"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {(orderedImages.length > 0 ? orderedImages : [null]).map((image, index) => (
                <button
                  key={image ? image.id || index : index}
                  type="button"
                  onClick={() => selectImageByIndex(index)}
                  className={`relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-2xl border snap-center ${
                    index === activeImageIndex
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-ink/10'
                  } bg-sand/60`}
                >
                  {image ? (
                    <img src={image.url} alt={`Изображение ${index + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">Нет фото</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3 sm:gap-3">
              {highlights.map((entry) => (
                <div key={entry} className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-xs sm:text-sm shadow-sm">
                  {entry}
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] h-fit space-y-4">
            <div className="soft-card p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Бестселлер</p>
              <h1 className="mt-2 text-xl sm:text-2xl font-semibold">{product.name}</h1>

              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                {rating > 0 ? (
                  <>
                    <span className="text-primary">★ {rating.toFixed(1)}</span>
                    <span>({reviewCount})</span>
                  </>
                ) : (
                  <span>Пока без отзывов</span>
                )}
              </div>

              <div className="mt-4 text-accent text-2xl font-semibold">
                {price.toLocaleString('ru-RU')} ₽
                {hasDiscount && (
                  <span className="ml-3 text-base line-through text-muted">{oldPrice.toLocaleString('ru-RU')} ₽</span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <p>Delivers {deliveryDate}</p>
                <button
                  type="button"
                  className="text-primary"
                  onClick={() => {
                    setSheetType('shipping');
                    setIsInfoSheetOpen(true);
                  }}
                >
                  Детали доставки
                </button>
              </div>

              {product.variants && product.variants.length > 1 && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Выберите вариант</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const isActive = selectedVariant?.id === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          className={`min-h-[44px] rounded-2xl border px-3 py-1.5 text-sm transition ${
                            isActive
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-ink/10 bg-white/90 hover:border-primary/40 hover:text-primary'
                          }`}
                          onClick={() => handleVariantChange(variant)}
                        >
                          {variant.name || variant.sku || variant.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-1 text-sm">
                {availableStock > 0 ? (
                  <span className="text-emerald-700">В наличии: {availableStock} шт.</span>
                ) : (
                  <span className="text-red-700">Нет в наличии</span>
                )}
                {isLowStock && (
                  <span className="text-xs text-amber-700">Осталось мало, возможен быстрый out of stock.</span>
                )}
              </div>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  className="button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddToCart}
                  disabled={availableStock <= 0}
                >
                  Add to cart
                </button>

                <button
                  type="button"
                  className="button-gray w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleBuyNow}
                  disabled={availableStock <= 0}
                >
                  Buy now
                </button>

                {availableStock <= 0 && (
                  <button type="button" className="button-ghost w-full text-sm">
                    Сообщить о поступлении
                  </button>
                )}

                <button
                  type="button"
                  className="button-ghost w-full text-sm"
                  onClick={() => {
                    setSheetType('returns');
                    setIsInfoSheetOpen(true);
                  }}
                >
                  Shipping & returns
                </button>
              </div>
            </div>

            <div className="soft-card p-5 text-sm space-y-3">
              <div className="flex items-center gap-2 text-ink/85">
                <TrustIcon type="delivery" />
                <span>Бесплатная доставка от 5000 ₽</span>
              </div>
              <div className="flex items-center gap-2 text-ink/85">
                <TrustIcon type="returns" />
                <span>Free returns within 30 days</span>
              </div>
              <div className="flex items-center gap-2 text-ink/85">
                <TrustIcon type="secure" />
                <span>Защищённая оплата через ЮKassa</span>
              </div>
            </div>

            {bundleItems.length > 0 && (
              <div className="soft-card p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Соберите комплект</p>
                <p className="mt-2 text-sm text-muted">
                  Часто покупают вместе: добавьте всё за один клик.
                </p>

                <div className="mt-3 space-y-3">
                  {bundleItems.map((item) => (
                    <label key={item.id} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-primary"
                        checked={Boolean(bundleSelections[item.id])}
                        onChange={(event) => {
                          setBundleSelections((prev) => ({
                            ...prev,
                            [item.id]: event.target.checked,
                          }));
                        }}
                      />
                      <span>
                        <span className="block font-medium">{item.name}</span>
                        <span className="text-xs text-muted">{getProductPrice(item).toLocaleString('ru-RU')} ₽</span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted">Итого</span>
                  <span className="font-semibold">{bundleTotal.toLocaleString('ru-RU')} ₽</span>
                </div>

                <button type="button" className="button w-full mt-3" onClick={handleAddBundle}>
                  Добавить комплект
                </button>
              </div>
            )}
          </aside>
        </div>

        <div className="mt-10 sm:mt-12">
          <div className="border-b border-ink/10 flex flex-wrap gap-6 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`py-2 ${activeTab === 'about' ? 'border-b-2 border-primary font-semibold' : 'text-muted'}`}
            >
              О товаре
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`py-2 ${activeTab === 'reviews' ? 'border-b-2 border-primary font-semibold' : 'text-muted'}`}
            >
              Отзывы ({reviewCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-2 ${activeTab === 'details' ? 'border-b-2 border-primary font-semibold' : 'text-muted'}`}
            >
              Характеристики
            </button>
          </div>

          {activeTab === 'about' && (
            <div className="mt-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">
                {product.description || 'Описание отсутствует.'}
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="mt-4 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-ink/10 bg-white/90 p-4">
                <p className="text-sm font-semibold">Распределение оценок</p>
                <div className="mt-3 space-y-2">
                  {ratingDistribution.map((entry) => (
                    <div key={entry.rating} className="grid grid-cols-[24px_minmax(0,1fr)_28px] items-center gap-2 text-xs text-muted">
                      <span>{entry.rating}</span>
                      <div className="h-2 rounded-full bg-secondary/70 overflow-hidden">
                        <div className="h-full rounded-full bg-primary/65" style={{ width: entry.width }} />
                      </div>
                      <span className="text-right">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {productReviews.length > 0 ? (
                  productReviews.map((review, index) => (
                    <div key={index} className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
                      <div className="text-primary text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                      <p className="mt-2 text-sm">{review.text}</p>
                      <p className="text-xs text-muted italic">— {review.author}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">На этот товар пока нет отзывов.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="mt-4">
              {specificationSections.length > 0 ? (
                <div className="space-y-8">
                  {specificationSections.map((section, index) => (
                    <div key={`${section.title || 'section'}-${index}`}>
                      {section.title && (
                        <h3 className="text-sm font-semibold text-ink mb-3">{section.title}</h3>
                      )}
                      {section.items.length > 0 && (
                        <dl className="space-y-2">
                          {section.items.map((item, itemIndex) => (
                            <div
                              key={`${item.label || 'item'}-${itemIndex}`}
                              className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-1 sm:gap-6 text-sm"
                            >
                              <dt className="text-muted">{item.label || '—'}</dt>
                              <dd className="text-ink whitespace-pre-line break-words">{item.value || '—'}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {section.description && (
                        <p className="mt-3 text-sm leading-relaxed text-ink/80 whitespace-pre-line">
                          {section.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {fallbackSpecs.map((entry) => (
                    <div key={entry} className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                      {entry}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-10 sm:mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Дополните набор</h2>
              <Link to="/category/popular" className="text-sm text-primary">Смотреть больше</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-ink/10 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden z-30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted">Итого</p>
            <p className="text-base font-semibold">{price.toLocaleString('ru-RU')} ₽</p>
          </div>
          <button
            className="button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={availableStock <= 0}
          >
            Add to cart
          </button>
        </div>
      </div>

      {isImageZoomOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Увеличенное изображение">
          <button
            type="button"
            className="absolute right-4 top-4 h-11 w-11 rounded-2xl border border-white/30 bg-black/40 text-white"
            onClick={() => setIsImageZoomOpen(false)}
            aria-label="Закрыть"
          >
            ✕
          </button>
          <div className="mx-auto flex h-full max-w-5xl items-center justify-center">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="max-h-full max-w-full object-contain" />
            ) : null}
          </div>
        </div>
      )}

      {isInfoSheetOpen && (
        <div className="fixed inset-0 z-[65]">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setIsInfoSheetOpen(false)}
            aria-label="Закрыть"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white p-5 shadow-[0_24px_70px_rgba(43,39,34,0.26)] md:rounded-l-[26px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  {sheetType === 'shipping' ? 'Доставка' : 'Возвраты'}
                </p>
                <h2 className="text-2xl font-semibold mt-1">
                  {sheetType === 'shipping' ? 'Shipping & delivery' : 'Returns policy'}
                </h2>
              </div>
              <button
                type="button"
                className="h-11 w-11 rounded-2xl border border-ink/10 text-ink/70"
                onClick={() => setIsInfoSheetOpen(false)}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            {sheetType === 'shipping' ? (
              <div className="mt-4 space-y-3 text-sm text-ink/85">
                <p>Ориентировочная дата доставки: {deliveryDate}.</p>
                <p>Стоимость и интервалы подтверждаются до оплаты на шаге checkout.</p>
                <p>
                  Бесплатная доставка от 5000 ₽. Для удалённых регионов срок может увеличиваться.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-ink/85">
                <p>Возврат возможен в течение 30 дней после получения заказа.</p>
                <p>Если товар не подошёл, оформите заявку через поддержку и выберите способ возврата.</p>
                <p>
                  Условия и исключения доступны в разделе
                  {' '}
                  <Link to="/usloviya-prodazhi" className="text-primary">«Условия продажи»</Link>.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default ProductPage;

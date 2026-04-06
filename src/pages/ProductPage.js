import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { getCategories, getProduct, getProducts } from '../api';
import NotificationBanner from '../components/NotificationBanner';
import ProductCard from '../components/ProductCard';
import { Button, Card, FieldError, Input, Modal, Tabs } from '../components/ui';
import { reviews } from '../data/reviews';
import {
  getPrimaryVariant,
  getProductPrice,
  moneyToNumber,
  normalizeProductImages,
} from '../utils/product';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function formatRub(value) {
  return `${Math.max(0, Number(value) || 0).toLocaleString('ru-RU')} ₽`;
}

function detectScaleImage(images = []) {
  const scalePattern = /human|model|hand|interior|room|lifestyle|body|context|size|scale|on-body|в\s*интерьере|в\s*масштабе/i;
  return images.some((image) => {
    const source = `${image?.id || ''} ${image?.alt || ''} ${image?.url || ''}`;
    return scalePattern.test(source);
  });
}

function detectDimensionsImage(images = []) {
  const dimensionPattern = /dimension|measure|size-chart|размер|габарит|чертеж|схема/i;
  return images.some((image) => {
    const source = `${image?.id || ''} ${image?.alt || ''} ${image?.url || ''}`;
    return dimensionPattern.test(source);
  });
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
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [showZoomHint, setShowZoomHint] = useState(true);
  const [sheetType, setSheetType] = useState('shipping');
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [isVariantTransitioning, setIsVariantTransitioning] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyState, setNotifyState] = useState({ type: '', message: '' });
  const [cartStatus, setCartStatus] = useState(null);

  const transitionTimerRef = useRef(null);
  const cartInputRef = useRef({ quantity: 1, variantId: null });

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShowZoomHint(window.localStorage.getItem('pdp-zoom-hint-seen') !== '1');
  }, []);

  useEffect(() => {
    const nextInputs = {
      quantity,
      variantId: selectedVariant?.id || null
    };
    const prevInputs = cartInputRef.current;

    if (
      cartStatus &&
      (prevInputs.quantity !== nextInputs.quantity || prevInputs.variantId !== nextInputs.variantId)
    ) {
      setCartStatus(null);
    }

    cartInputRef.current = nextInputs;
  }, [cartStatus, quantity, selectedVariant?.id]);

  useEffect(() => {
    setActiveTab('about');
    setActiveImageIndex(0);
    setRelatedProducts([]);
    setBundleSelections({});
    setQuantity(1);
    setNotifyEmail('');
    setNotifyState({ type: '', message: '' });
    setCartStatus(null);
    setIsLoading(true);

    getProduct(id)
      .then((data) => {
        if (!data || data?.isActive === false) {
          setProduct(null);
          setSelectedVariant(null);
          return;
        }

        setProduct(data);
        const primaryVariant = getPrimaryVariant(data);
        setSelectedVariant(primaryVariant || null);
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

  const hasScaleImage = useMemo(() => detectScaleImage(orderedImages), [orderedImages]);
  const hasDimensionsImage = useMemo(() => detectDimensionsImage(orderedImages), [orderedImages]);

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
    product?.size ? `Размер: ${product.size}` : 'Размеры соответствуют стандартам категории',
    product?.color ? `Цвет: ${product.color}` : 'Стабильный оттенок после стирок',
    product?.care || 'Уход: деликатная стирка при 30°',
  ];

  const highlights = [
    product?.material ? `Материал: ${product.material}` : 'Натуральные ткани',
    product?.threadCount ? `Плотность: ${product.threadCount}` : 'Мягкая воздухопроницаемая структура',
    'Подходит для ежедневного использования и частых стирок',
  ];

  const price = selectedVariant
    ? moneyToNumber(selectedVariant.price)
    : moneyToNumber(product?.price || 0);
  const oldPrice =
    selectedVariant?.oldPrice
      ? moneyToNumber(selectedVariant.oldPrice)
      : product?.oldPrice
      ? moneyToNumber(product.oldPrice)
      : 0;
  const hasDiscount = oldPrice > price;
  const discountPercent = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  const availableStock = selectedVariant
    ? Number(selectedVariant.stock ?? selectedVariant.stockQuantity ?? 0)
    : Number(product?.stock ?? product?.stockQuantity ?? 0);

  const rating = Number(product?.rating || 0);
  const reviewCount = Number(
    product?.reviewCount || product?.reviewsCount || product?.reviews_count || productReviews.length
  );
  const isLowStock = availableStock > 0 && availableStock <= 3;

  const productTabs = useMemo(
    () => [
      { value: 'about', label: 'О товаре' },
      { value: 'reviews', label: `Отзывы (${reviewCount})` },
      { value: 'details', label: 'Характеристики' },
    ],
    [reviewCount]
  );

  const bundleItems = relatedProducts.slice(0, 3);
  const bundleAddOnTotal = bundleItems.reduce((sum, item) => {
    if (!bundleSelections[item.id]) return sum;
    return sum + getProductPrice(item);
  }, 0);
  const bundleTotal = price * quantity + bundleAddOnTotal;

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

  const openImageZoom = () => {
    setIsImageZoomOpen(true);
    if (!showZoomHint) return;
    setShowZoomHint(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pdp-zoom-hint-seen', '1');
    }
  };

  const handleVariantChange = (variant) => {
    if (!variant || variant.id === selectedVariant?.id) return;

    setIsVariantTransitioning(true);
    setSelectedVariant(variant);

    const scopedIndex = orderedImages.findIndex((image) => image.variantId === variant.id);
    if (scopedIndex >= 0) {
      setActiveImageIndex(scopedIndex);
    }

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = setTimeout(() => {
      setIsVariantTransitioning(false);
    }, 200);
  };

  const handleAddToCart = async () => {
    if (!product || availableStock <= 0) return;
    const variantId = selectedVariant?.id || product.id;
    setCartStatus(null);
    const result = await addItem(product, variantId, quantity);
    if (result?.ok === false) {
      setCartStatus(result.notification);
      return false;
    }
    return true;
  };

  const handleBuyNow = async () => {
    if (!product || availableStock <= 0) return;
    const didAdd = await handleAddToCart();
    if (!didAdd) return;
    navigate('/checkout');
  };

  const handleAddBundle = async () => {
    const didAddPrimary = await handleAddToCart();
    if (!didAddPrimary) return;

    for (const item of bundleItems) {
      if (!bundleSelections[item.id]) continue;
      const variant = getPrimaryVariant(item);
      if (!variant?.id) continue;
      const result = await addItem(item, variant.id, 1);
      if (result?.ok === false) {
        setCartStatus(result.notification);
        return;
      }
    }
  };

  const handleNotifyMe = () => {
    const value = notifyEmail.trim();
    if (!value) {
      setNotifyState({ type: 'error', message: 'Введите email, чтобы получить уведомление.' });
      return;
    }

    if (!EMAIL_RE.test(value)) {
      setNotifyState({ type: 'error', message: 'Проверьте формат email. Например, name@example.ru.' });
      return;
    }

    setNotifyState({
      type: 'success',
      message: `Отправим письмо на ${value}, когда вариант снова появится в наличии.`,
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
            <Card padding="md" className="sm:p-6">
              <div className="skeleton shimmer-safe h-6 w-2/5 rounded-full" />
              <div className="mt-4 skeleton shimmer-safe h-8 w-4/5 rounded-full" />
              <div className="mt-3 skeleton shimmer-safe h-5 w-3/5 rounded-full" />
              <div className="mt-5 space-y-2">
                <div className="skeleton shimmer-safe h-12 rounded-2xl" />
                <div className="skeleton shimmer-safe h-12 rounded-2xl" />
              </div>
            </Card>
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
          <Button as={Link} to="/category/popular" className="mt-4">Вернуться в каталог</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page py-8 sm:py-10 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-24">
      <div className="container mx-auto px-4">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted" aria-label="Хлебные крошки">
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
          <span className="text-ink/80" aria-current="page">{product.name}</span>
        </nav>

        <div className="grid gap-6 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)]">
          <section>
            <div
              className={`group relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-white/80 shadow-[0_24px_60px_rgba(43,39,34,0.16)] bg-gradient-to-br from-sand/70 to-white transition-opacity duration-200 ${
                isVariantTransitioning ? 'opacity-80' : 'opacity-100'
              }`}
            >
              <div className="relative w-full pt-[112%] sm:pt-[95%]">
                {mainImage ? (
                  <button
                    type="button"
                    className="absolute inset-0 block"
                    onClick={openImageZoom}
                    aria-label="Увеличить изображение"
                  >
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                    <span className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/88 text-ink shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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

                <div className="absolute left-3 top-3 flex flex-wrap gap-2 text-[11px]">
                  {hasScaleImage && (
                    <span className="rounded-full border border-ink/10 bg-white/90 px-2.5 py-1 text-ink/75">Есть фото в масштабе</span>
                  )}
                  {hasDimensionsImage && (
                    <span className="rounded-full border border-ink/10 bg-white/90 px-2.5 py-1 text-ink/75">Есть схема размеров</span>
                  )}
                </div>

                {activeImage?.variantId && (
                  <div className="absolute top-3 right-14 rounded-2xl border border-ink/10 bg-white/88 px-3 py-1 text-xs">
                    Вариант: {variantNameById[activeImage.variantId] || activeImage.variantId}
                  </div>
                )}

                {orderedImages.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-white/90"
                      onClick={() => selectImageByIndex(activeImageIndex - 1)}
                      aria-label="Предыдущее изображение"
                    >
                      ‹
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-white/90"
                      onClick={() => selectImageByIndex(activeImageIndex + 1)}
                      aria-label="Следующее изображение"
                    >
                      ›
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
              <p>Фото: {orderedImages.length || 1} · Масштаб и фактуру можно проверить через zoom</p>
              <Button variant="ghost" size="sm" className="!px-1 text-primary" onClick={openImageZoom}>
                Открыть крупно
              </Button>
            </div>

            <div className="mt-3 flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
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
                <Card key={entry} variant="quiet" padding="sm" className="text-xs shadow-sm sm:text-sm">
                  {entry}
                </Card>
              ))}
            </div>
          </section>

          <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] h-fit space-y-4">
            <Card padding="md" className={`sm:p-6 transition-opacity duration-200 ${isVariantTransitioning ? 'opacity-80' : 'opacity-100'}`}>
              <p className="text-xs uppercase tracking-[0.25em] text-accent">Карточка товара</p>
              <h1 className="mt-2 text-xl sm:text-2xl font-semibold">{product.name}</h1>

              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                {rating > 0 ? (
                  <>
                    <span className="text-primary">★ {rating.toFixed(1)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!min-h-0 !px-0 !py-0 underline-offset-2 hover:text-primary hover:underline"
                      onClick={() => setActiveTab('reviews')}
                    >
                      {reviewCount} отзывов
                    </Button>
                  </>
                ) : (
                  <span>Пока без отзывов</span>
                )}
              </div>

              <div className="mt-4 flex items-end gap-3">
                <p className="text-accent text-3xl font-semibold leading-none">{formatRub(price)}</p>
                {hasDiscount && (
                  <>
                    <span className="text-base line-through text-muted">{formatRub(oldPrice)}</span>
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      −{discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <div className="mt-3 rounded-2xl border border-ink/10 bg-secondary/45 px-3 py-2 text-sm">
                <p>
                  Доставим <span className="font-semibold">{deliveryDate}</span>
                  {' '}при заказе до 14:00 (местное время).
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 !min-h-0 !px-0 !py-0 text-xs text-primary"
                  onClick={() => {
                    setSheetType('shipping');
                    setIsInfoSheetOpen(true);
                  }}
                >
                  Как рассчитывается дата и стоимость
                </Button>
              </div>

              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="!min-h-0 !px-0 !py-0 text-sm text-primary"
                  onClick={() => {
                    setSheetType('returns');
                    setIsInfoSheetOpen(true);
                  }}
                >
                  Доставка и возврат
                </Button>
              </div>

              {product.variants && product.variants.length > 1 && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Выберите вариант</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const isActive = selectedVariant?.id === variant.id;
                      const variantStock = Number(variant?.stock ?? variant?.stockQuantity ?? 0);
                      return (
                        <Button
                          key={variant.id}
                          variant="secondary"
                          size="sm"
                          className={`h-auto min-h-[44px] px-3 py-1.5 text-sm ${
                            isActive
                              ? 'border-primary bg-primary/10 text-primary shadow-none'
                              : 'border-ink/10 bg-white/90 hover:border-primary/40 hover:text-primary'
                          }`}
                          onClick={() => handleVariantChange(variant)}
                        >
                          <span className="block font-medium">{variant.name || variant.sku || variant.id}</span>
                          <span className="block text-[11px] text-muted">
                            {formatRub(moneyToNumber(variant.price))}
                            {variantStock > 0 ? ` · ${variantStock} шт.` : ' · нет в наличии'}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Количество</p>
                <div className="mt-2 inline-flex items-center rounded-2xl border border-ink/10 bg-white/90 p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl border border-transparent text-lg text-ink/75 hover:text-primary"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    aria-label="Уменьшить количество"
                  >
                    −
                  </Button>
                  <span className="min-w-[42px] text-center text-sm font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl border border-transparent text-lg text-ink/75 hover:text-primary"
                    onClick={() => setQuantity((prev) => Math.min(99, prev + 1))}
                    aria-label="Увеличить количество"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-1 text-sm">
                {availableStock > 0 ? (
                  <span className="text-emerald-700">В наличии: {availableStock} шт.</span>
                ) : (
                  <span className="text-red-700">Нет в наличии</span>
                )}
                {isLowStock && (
                  <span className="text-xs text-amber-700">Осталось мало: {availableStock} шт.</span>
                )}
              </div>

              <div className="mt-5 space-y-2">
                <Button
                  block
                  onClick={handleAddToCart}
                  disabled={availableStock <= 0}
                >
                  Добавить в корзину
                </Button>

                <Button
                  variant="secondary"
                  block
                  onClick={handleBuyNow}
                  disabled={availableStock <= 0}
                >
                  Купить сейчас
                </Button>

                <Button
                  variant="ghost"
                  block
                  size="sm"
                  className="text-sm"
                  onClick={() => {
                    setSheetType('shipping');
                    setIsInfoSheetOpen(true);
                  }}
                >
                  Условия доставки и возврата
                </Button>
              </div>

              {cartStatus ? <NotificationBanner notification={cartStatus} className="mt-3" /> : null}

              {availableStock <= 0 && (
                <Card variant="quiet" padding="sm" className="mt-4 text-sm">
                  <p className="font-medium text-ink">Сообщить о поступлении</p>
                  <p className="mt-1 text-xs text-muted">Ожидаем пополнение в течение 5–9 дней. Оставьте email, чтобы не пропустить.</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <Input
                      type="email"
                      value={notifyEmail}
                      onChange={(event) => {
                        setNotifyEmail(event.target.value);
                        if (notifyState.type) setNotifyState({ type: '', message: '' });
                      }}
                      placeholder="name@example.ru"
                      invalid={notifyState.type === 'error'}
                      aria-label="Email для уведомления"
                    />
                    <Button variant="secondary" onClick={handleNotifyMe}>
                      Уведомить
                    </Button>
                  </div>
                  {notifyState.type === 'error' ? (
                    <FieldError>{notifyState.message}</FieldError>
                  ) : notifyState.message ? (
                    <p className="mt-2 text-xs text-emerald-700">{notifyState.message}</p>
                  ) : null}
                  <Button
                    as={Link}
                    to={`/category/${resolveCategoryToken(activeCategory) || 'popular'}`}
                    variant="ghost"
                    size="sm"
                    className="mt-2 inline-flex !min-h-0 !px-0 !py-0 text-xs text-primary"
                  >
                    Показать похожие товары
                  </Button>
                </Card>
              )}
            </Card>

            <Card padding="md" className="text-sm space-y-3">
              <div className="flex items-center gap-2 text-ink/85">
                <TrustIcon type="delivery" />
                <span>Бесплатная доставка от 5000 ₽</span>
              </div>
              <div className="flex items-center gap-2 text-ink/85">
                <TrustIcon type="returns" />
                <span>Бесплатный возврат в течение 30 дней</span>
              </div>
              <div className="flex items-center gap-2 text-ink/85">
                <TrustIcon type="secure" />
                <span>Защищённая оплата и безопасный checkout</span>
              </div>
            </Card>

            {bundleItems.length > 0 && (
              <Card padding="md">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Соберите комплект</p>
                <p className="mt-2 text-sm text-muted">Часто покупают вместе: добавьте всё за один клик.</p>

                <div className="mt-3 space-y-3">
                  {bundleItems.map((item) => (
                    <label key={item.id} className="block">
                      <Card
                        variant="quiet"
                        padding="sm"
                        interactive
                        className="flex items-start gap-3 rounded-2xl text-sm"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
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
                          <span className="text-xs text-muted">{formatRub(getProductPrice(item))}</span>
                        </span>
                      </Card>
                    </label>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted">Итого</span>
                  <span className="font-semibold">{formatRub(bundleTotal)}</span>
                </div>

                <Button block className="mt-3" onClick={handleAddBundle}>
                  Добавить комплект
                </Button>
              </Card>
            )}
          </aside>
        </div>

        <section id="product-tabs" className="mt-10 sm:mt-12">
          <Tabs
            items={productTabs}
            value={activeTab}
            onChange={setActiveTab}
            ariaLabel="Разделы товара"
            fullWidth
            className="max-w-3xl"
          />

          {activeTab === 'about' && (
            <Card padding="md" className="mt-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">
                {product.description || 'Описание отсутствует.'}
              </p>
            </Card>
          )}

          {activeTab === 'reviews' && (
            <div className="mt-4 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              <Card variant="quiet" padding="md" className="rounded-3xl">
                <p className="text-sm font-semibold">Распределение оценок</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-2xl font-semibold text-primary">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                  <span className="text-xs text-muted">на основе {reviewCount} отзывов</span>
                </div>
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
              </Card>

              <div className="space-y-3">
                {productReviews.length > 0 ? (
                  productReviews.map((review, index) => (
                    <Card key={index} variant="quiet" padding="md" className="rounded-3xl">
                      <div className="text-primary text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                      <p className="mt-2 text-sm">{review.text}</p>
                      <p className="text-xs text-muted italic">— {review.author}</p>
                    </Card>
                  ))
                ) : (
                  <Card variant="quiet" padding="md">
                    <p className="text-sm text-muted">На этот товар пока нет отзывов.</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="mt-4">
              {specificationSections.length > 0 ? (
                <div className="space-y-8">
                  {specificationSections.map((section, index) => (
                    <Card key={`${section.title || 'section'}-${index}`} padding="md">
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
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {fallbackSpecs.map((entry) => (
                    <Card key={entry} variant="quiet" padding="sm">{entry}</Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-10 sm:mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Дополните набор</h2>
              <Button as={Link} to="/category/popular" variant="ghost" size="sm">
                Смотреть больше
              </Button>
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
        <div className="container mx-auto px-4 py-3">
          {cartStatus ? <NotificationBanner notification={cartStatus} compact className="mb-3" /> : null}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted">К оплате</p>
              <p className="text-base font-semibold">{formatRub(price * quantity)}</p>
            </div>
            <Button
              block
              className="flex-1"
              onClick={handleAddToCart}
              disabled={availableStock <= 0}
            >
              В корзину
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={isImageZoomOpen}
        onClose={() => setIsImageZoomOpen(false)}
        placement="center"
        size="lg"
        showCloseButton={false}
        closeLabel="Закрыть просмотр изображения"
        overlayClassName="bg-black/80 backdrop-blur-sm"
        panelClassName="max-w-5xl border-white/10 bg-black/35 p-0 shadow-none"
      >
        <div className="relative min-h-[60vh]">
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-4 z-10 border-white/30 bg-black/40 text-white hover:border-white/50 hover:bg-black/55 hover:text-white"
            onClick={() => setIsImageZoomOpen(false)}
            aria-label="Закрыть"
          >
            ✕
          </Button>

          {orderedImages.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 border-white/30 bg-black/40 text-white hover:border-white/50 hover:bg-black/55 hover:text-white"
                onClick={() => selectImageByIndex(activeImageIndex - 1)}
                aria-label="Предыдущее изображение"
              >
                ‹
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 border-white/30 bg-black/40 text-white hover:border-white/50 hover:bg-black/55 hover:text-white"
                onClick={() => selectImageByIndex(activeImageIndex + 1)}
                aria-label="Следующее изображение"
              >
                ›
              </Button>
            </>
          )}

          <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center p-6 sm:p-10">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="max-h-[75vh] w-auto max-w-full object-contain" />
            ) : null}
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/25 bg-black/40 px-3 py-1 text-xs text-white/90">
            {activeImageIndex + 1} / {Math.max(1, orderedImages.length)}
          </p>
        </div>
      </Modal>

      <Modal
        open={isInfoSheetOpen}
        onClose={() => setIsInfoSheetOpen(false)}
        placement="sheet"
        size="sm"
        title={sheetType === 'shipping' ? 'Доставка' : 'Условия возврата'}
        description={sheetType === 'shipping' ? 'Доставка' : 'Возвраты'}
      >
        {sheetType === 'shipping' ? (
          <div className="space-y-3 text-sm text-ink/85">
            <p>Ориентировочная дата доставки: {deliveryDate} (при заказе до 14:00 по местному времени).</p>
            <p>Стоимость и доступные интервалы показываются до оплаты на шаге оформления заказа.</p>
            <p>Бесплатная доставка от 5000 ₽. Для удалённых регионов срок может увеличиваться.</p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-ink/85">
            <p>Возврат возможен в течение 30 дней после получения заказа.</p>
            <p>Если товар не подошёл, оформите заявку через поддержку и выберите удобный способ возврата.</p>
            <p>
              Полные условия доступны в разделе{' '}
              <Link to="/usloviya-prodazhi" className="text-primary">
                «Условия продажи»
              </Link>.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ProductPage;

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { getProduct } from '../api';
import NotificationBanner from '../components/NotificationBanner';
import Seo from '../components/Seo';
import {
  CataloguePresentationBlocks,
  CataloguePresentationHero,
} from '../components/cms/CataloguePresentationSections';
import CmsStorefrontCollectionRail from '../components/cms/CmsStorefrontCollectionRail';
import { CmsRichText } from '../components/cms/cmsBlockShared';
import ProductCard from '../components/ProductCard';
import ProductMediaViewer from '../components/product/ProductMediaViewer';
import { Button, Card, Modal, Tabs } from '../components/ui';
import { legalTokens } from '../data/legal/constants';
import { useProductDirectoryData } from '../features/product-list/data';
import {
  getPrimaryVariant,
  getProductPrice,
  moneyToNumber,
  normalizeProductImages,
} from '../utils/product';
import { buildProductPath, getCanonicalUrl } from '../utils/url';
import { useSsrData } from '../ssr/SsrDataContext';

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

function getStockValue(entity) {
  return Number(entity?.stock ?? entity?.stockQuantity ?? 0);
}

function resolveInitialSelectedVariant(product) {
  if (!product) {
    return null;
  }

  const variants = Array.isArray(product?.variants)
    ? product.variants
    : Array.from(product?.variants || []);
  const primaryVariant = getPrimaryVariant(product);
  const firstAvailableVariant = variants.find((variant) => getStockValue(variant) > 0);

  return firstAvailableVariant || primaryVariant || null;
}

function getAvailabilityMeta(stock, { selected = false } = {}) {
  if (stock <= 0) {
    return {
      tone: 'text-red-700',
      badgeClass: 'border-red-200 bg-red-50/80 text-red-700',
      label: selected ? 'Нет в наличии для выбранного варианта' : 'Нет в наличии',
      detail: selected
        ? 'Выберите другой вариант или посмотрите похожие товары.'
        : 'Сейчас недоступно'
    };
  }

  if (stock <= 3) {
    return {
      tone: 'text-amber-700',
      badgeClass: 'border-amber-200 bg-amber-50/80 text-amber-800',
      label: selected ? `Осталось ${stock} шт. для выбранного варианта` : `Осталось ${stock} шт.`,
      detail: 'Редкий остаток, лучше оформить заказ без задержки.'
    };
  }

  return {
    tone: 'text-emerald-700',
    badgeClass: 'border-emerald-200 bg-emerald-50/80 text-emerald-800',
    label: selected ? `В наличии ${stock} шт. для выбранного варианта` : `В наличии ${stock} шт.`,
    detail: 'Можно добавить в корзину или перейти сразу к оформлению.'
  };
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

function ProductInfoCard({ icon, title, summary, caption, onOpen }) {
  return (
    <Card
      as="button"
      type="button"
      variant="quiet"
      padding="sm"
      interactive
      className="w-full rounded-3xl text-left"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-ink/10 bg-white/80 text-ink/85">
          <TrustIcon type={icon} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className="mt-1 block text-sm text-ink/85">{summary}</span>
          <span className="mt-2 block text-xs text-muted">{caption}</span>
          <span className="mt-2 inline-flex text-xs font-medium text-primary">Подробнее</span>
        </span>
      </div>
    </Card>
  );
}

function ProductPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useContext(CartContext);
  const { routeData } = useSsrData();
  const { categories, products: directoryProducts } = useProductDirectoryData();
  const hasProductRouteSeed =
    routeData?.kind === 'product' && String(routeData.productId || '') === String(id);
  const hasInitialProductLoad = hasProductRouteSeed && Boolean(routeData.product);
  const hasConfirmedNotFound = hasProductRouteSeed && routeData.product == null && routeData.notFound === true;
  const initialProduct = hasInitialProductLoad ? routeData.product : null;

  const [product, setProduct] = useState(initialProduct);
  const [selectedVariant, setSelectedVariant] = useState(() =>
    resolveInitialSelectedVariant(initialProduct)
  );
  const [activeTab, setActiveTab] = useState('about');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [bundleSelections, setBundleSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(!hasInitialProductLoad && !hasConfirmedNotFound);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [showZoomHint, setShowZoomHint] = useState(true);
  const [sheetType, setSheetType] = useState('shipping');
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [isVariantTransitioning, setIsVariantTransitioning] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [cartStatus, setCartStatus] = useState(null);

  const transitionTimerRef = useRef(null);
  const cartInputRef = useRef({ quantity: 1, variantId: null });

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
    setBundleSelections({});
    setQuantity(1);
    setPendingAction('');
    setCartStatus(null);
    setProduct(initialProduct);
    setSelectedVariant(resolveInitialSelectedVariant(initialProduct));
    setIsLoading(!hasInitialProductLoad && !hasConfirmedNotFound);

    if (hasInitialProductLoad || hasConfirmedNotFound) {
      return undefined;
    }

    getProduct(id)
      .then((data) => {
        if (!data || data?.isActive === false) {
          setProduct(null);
          setSelectedVariant(null);
          return;
        }

        setProduct(data);
        const variants = Array.isArray(data?.variants) ? data.variants : Array.from(data?.variants || []);
        const primaryVariant = getPrimaryVariant(data);
        const firstAvailableVariant = variants.find((variant) => getStockValue(variant) > 0);
        setSelectedVariant(firstAvailableVariant || primaryVariant || null);
      })
      .catch((err) => {
        console.error('Failed to fetch product:', err);
        setProduct(null);
        setSelectedVariant(null);
      })
      .finally(() => setIsLoading(false));
    return undefined;
  }, [hasConfirmedNotFound, hasInitialProductLoad, id, initialProduct]);

  const relatedProducts = useMemo(() => {
    if (!product) {
      return [];
    }

    const targetCategoryToken = resolveProductCategoryToken(product);
    return directoryProducts
      .filter((item) => {
        if (!item || item.id === product.id || item?.isActive === false) {
          return false;
        }
        if (!targetCategoryToken) {
          return true;
        }
        return resolveProductCategoryToken(item) === targetCategoryToken;
      })
      .slice(0, 4);
  }, [directoryProducts, product]);

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
  const productVariants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : Array.from(product?.variants || [])),
    [product]
  );

  const variantNameById = useMemo(() => {
    const map = {};
    productVariants.forEach((variant) => {
      if (!variant?.id) return;
      map[variant.id] = variant.name || variant.sku || variant.id;
    });
    return map;
  }, [productVariants]);

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
  const productPresentation = product?.presentation || null;
  const marketingTitle = productPresentation?.marketingTitle || product?.name || '';
  const marketingSubtitle =
    productPresentation?.marketingSubtitle ||
    (activeCategory?.name ? `Категория: ${activeCategory.name}` : '');
  const introBody = productPresentation?.introBody || product?.description || '';

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
  const discountPercent = hasDiscount
    ? selectedVariant?.discountPercent || product?.discountPercent || Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  const availableStock = selectedVariant
    ? getStockValue(selectedVariant)
    : getStockValue(product);
  const availabilityMeta = getAvailabilityMeta(availableStock, { selected: true });
  const availableVariants = useMemo(
    () => productVariants.filter((variant) => getStockValue(variant) > 0),
    [productVariants]
  );
  const fallbackAvailableVariant = useMemo(
    () =>
      availableVariants.find((variant) => variant.id !== selectedVariant?.id) ||
      availableVariants[0] ||
      null,
    [availableVariants, selectedVariant?.id]
  );
  const hasSelectableFallbackVariant = Boolean(
    fallbackAvailableVariant && fallbackAvailableVariant.id !== selectedVariant?.id
  );

  const productTabs = useMemo(
    () => [
      { value: 'about', label: 'О товаре' },
      { value: 'details', label: 'Характеристики' },
    ],
    []
  );

  const bundleItems = relatedProducts.slice(0, 3);
  const bundleAddOnTotal = bundleItems.reduce((sum, item) => {
    if (!bundleSelections[item.id]) return sum;
    return sum + getProductPrice(item);
  }, 0);
  const bundleTotal = price * quantity + bundleAddOnTotal;

  const infoHighlights = useMemo(
    () => [
      {
        key: 'shipping',
        icon: 'delivery',
        title: 'Доставка',
        summary: 'Согласует менеджер',
        caption: 'После оплаты менеджер уточнит варианты и финальную стоимость.'
      },
      {
        key: 'returns',
        icon: 'returns',
        title: 'Возврат',
        summary: '30 дней на возврат',
        caption: 'Если товар не подошёл, поможем оформить возврат без лишних шагов.'
      },
      {
        key: 'payment',
        icon: 'secure',
        title: 'Оплата',
        summary: 'Безопасный checkout',
        caption: 'Оплата подтверждается на защищённом шаге и не дублируется.'
      }
    ],
    []
  );
  const hasBundleSelection = bundleItems.some((item) => bundleSelections[item.id]);
  const isCartActionPending = Boolean(pendingAction);
  const canPurchaseSelectedVariant = availableStock > 0 && !isCartActionPending;
  const canonicalProductPath = useMemo(() => buildProductPath(product), [product]);
  const canonicalProductUrl = useMemo(
    () => getCanonicalUrl(canonicalProductPath, { origin: legalTokens.SITE_URL }) || canonicalProductPath,
    [canonicalProductPath]
  );
  const presentationPage = useMemo(
    () => ({
      title: marketingTitle || product?.name || 'Товар',
      navLabel: activeCategory?.name || marketingTitle || product?.name || 'Товар',
      path: canonicalProductPath,
    }),
    [activeCategory?.name, canonicalProductPath, marketingTitle, product?.name]
  );
  const seoTitle = useMemo(() => {
    if (productPresentation?.seoTitle) {
      return productPresentation.seoTitle;
    }
    if (!product?.name) {
      return 'Карточка товара';
    }

    return activeCategory?.name
      ? `Купить ${product.name} — ${activeCategory.name}`
      : `Купить ${product.name}`;
  }, [activeCategory?.name, product?.name, productPresentation?.seoTitle]);
  const seoDescription = useMemo(() => {
    if (productPresentation?.seoDescription) {
      return productPresentation.seoDescription;
    }
    if (!product) {
      return 'Карточка товара интернет-магазина домашнего текстиля.';
    }
    const summary = product.description || highlights.filter(Boolean).join('. ');
    return `${summary} ${availabilityMeta.label}.`;
  }, [availabilityMeta.label, highlights, product, productPresentation?.seoDescription]);
  const seoImage = productPresentation?.seoImage?.url || activeImage?.url || orderedImages[0]?.url || '';
  const seoImageUrl = useMemo(() => {
    if (!seoImage || seoImage.startsWith('data:')) {
      return '';
    }

    return getCanonicalUrl(seoImage, { origin: legalTokens.SITE_URL }) || seoImage;
  }, [seoImage]);
  const productJsonLd = useMemo(() => {
    if (!product?.name) {
      return null;
    }

    const offer = {
      '@type': 'Offer',
      priceCurrency: 'RUB',
      price: Number(price || 0).toFixed(2),
      availability:
        availableStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: canonicalProductUrl,
    };
    const brandName =
      typeof product.brand === 'string' ? product.brand : product.brand?.name || '';
    const aggregateRatingValue = Number(product.rating || 0);
    const aggregateReviewCount = Number(product.reviewCount || product.reviewsCount || 0);

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: marketingTitle || product.name,
      description: seoDescription,
      url: canonicalProductUrl,
      sku: selectedVariant?.sku || product.sku || selectedVariant?.id || product.id,
      category: activeCategory?.name || undefined,
      image: seoImageUrl ? [seoImageUrl] : undefined,
      brand: brandName
        ? {
            '@type': 'Brand',
            name: brandName,
          }
        : undefined,
      aggregateRating:
        aggregateRatingValue > 0 && aggregateReviewCount > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: aggregateRatingValue.toFixed(1),
              reviewCount: aggregateReviewCount,
            }
          : undefined,
      offers: offer,
    };
  }, [
    activeCategory?.name,
    availableStock,
    canonicalProductUrl,
    price,
    marketingTitle,
    product,
    seoDescription,
    seoImageUrl,
    selectedVariant?.id,
    selectedVariant?.sku,
  ]);

  useEffect(() => {
    if (availableStock > 0) {
      setQuantity((prev) => Math.max(1, Math.min(prev, availableStock)));
    }
  }, [availableStock]);

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

  const openInfoSheet = (nextSheetType) => {
    setSheetType(nextSheetType);
    setIsInfoSheetOpen(true);
  };

  const addSelectedVariantToCart = async () => {
    if (!product || availableStock <= 0) return false;
    setCartStatus(null);
    const result = await addItem(product, selectedVariant?.id || null, quantity);
    if (result?.ok === false) {
      setCartStatus(result.notification);
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!product || availableStock <= 0 || isCartActionPending) return false;
    setPendingAction('add');
    try {
      return await addSelectedVariantToCart();
    } finally {
      setPendingAction('');
    }
  };

  const handleBuyNow = async () => {
    if (!product || availableStock <= 0 || isCartActionPending) return;
    setPendingAction('buy');
    try {
      const didAdd = await addSelectedVariantToCart();
      if (!didAdd) return;
      navigate('/checkout');
    } finally {
      setPendingAction('');
    }
  };

  const handleAddBundle = async () => {
    if (!product || availableStock <= 0 || isCartActionPending || !hasBundleSelection) return;
    setPendingAction('bundle');
    try {
      const didAddPrimary = await addSelectedVariantToCart();
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
    } finally {
      setPendingAction('');
    }
  };

  const handleSelectAvailableVariant = () => {
    if (!fallbackAvailableVariant) {
      return;
    }
    handleVariantChange(fallbackAvailableVariant);
  };

  if (isLoading) {
    return (
      <div className="product-page page-section">
        <Seo
          title="Карточка товара"
          description="Загружаем карточку товара и доступные варианты."
          canonicalPath={location.pathname}
        />
        <div className="page-shell">
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
      <div className="page-section">
        <div className="page-shell">
          <Seo
            title="Товар не найден"
            description="Запрошенная карточка товара недоступна. Попробуйте вернуться в каталог."
            canonicalPath={location.pathname}
            robots="noindex,nofollow"
          />
          <h1 className="text-2xl font-semibold mb-2">Товар не найден</h1>
          <p>К сожалению, продукта с указанным идентификатором не существует.</p>
          <Button as={Link} to="/category/popular" className="mt-4">Вернуться в каталог</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page page-section pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-24">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalProductPath}
        image={seoImage}
        type="product"
        jsonLd={productJsonLd}
      />
      <div className="page-shell">
        <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted sm:mb-5" aria-label="Хлебные крошки">
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
          <span className="text-ink/80" aria-current="page">{marketingTitle || product.name}</span>
        </nav>

        <CataloguePresentationHero
          hero={productPresentation?.hero}
          page={presentationPage}
          className="mb-6"
        />

        <div className="grid gap-5 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)]">
          <section>
            <div
              data-testid="product-gallery-card"
              className={`group relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-white/80 shadow-[0_24px_60px_rgba(43,39,34,0.16)] bg-gradient-to-br from-sand/70 to-white transition-opacity duration-200 ${
                isVariantTransitioning ? 'opacity-80' : 'opacity-100'
              }`}
            >
              <div className="relative w-full pt-[96%] sm:pt-[95%]">
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
                      className="absolute inset-0 h-full w-full object-contain p-3 sm:p-4"
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

                <div className="absolute left-2 top-2 flex max-w-[calc(100%-5.5rem)] flex-wrap gap-1.5 text-[10px] sm:left-3 sm:top-3 sm:max-w-none sm:gap-2 sm:text-[11px]">
                  {hasScaleImage && (
                    <span className="rounded-full border border-ink/10 bg-white/90 px-2.5 py-1 text-ink/75">Есть фото в масштабе</span>
                  )}
                  {hasDimensionsImage && (
                    <span className="rounded-full border border-ink/10 bg-white/90 px-2.5 py-1 text-ink/75">Есть схема размеров</span>
                  )}
                </div>

                {activeImage?.variantId && (
                  <div className="absolute right-12 top-2 max-w-[calc(100%-8rem)] truncate rounded-2xl border border-ink/10 bg-white/88 px-2.5 py-1 text-[11px] sm:top-3 sm:right-14 sm:max-w-none sm:px-3 sm:text-xs">
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

            <div className="mt-4 hidden items-center justify-between gap-3 text-xs text-muted sm:flex">
              <p>Фото: {orderedImages.length || 1} · Масштаб и фактуру можно проверить через zoom</p>
              <Button variant="ghost" size="sm" className="!px-1 text-primary" onClick={openImageZoom}>
                Открыть крупно
              </Button>
            </div>

            <div
              data-testid="product-gallery-rail"
              className="mt-2 flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory sm:mt-3 sm:gap-3"
            >
              {(orderedImages.length > 0 ? orderedImages : [null]).map((image, index) => (
                <button
                  key={image ? image.id || index : index}
                  type="button"
                  onClick={() => selectImageByIndex(index)}
                  className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border snap-center sm:h-20 sm:w-20 ${
                    index === activeImageIndex
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-ink/10'
                  } bg-sand/60`}
                >
                  {image ? (
                    <img src={image.url} alt={`Изображение ${index + 1}`} className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">Нет фото</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 hidden gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
              {highlights.map((entry) => (
                <Card key={entry} variant="quiet" padding="sm" className="text-xs shadow-sm sm:text-sm">
                  {entry}
                </Card>
              ))}
            </div>
          </section>

          <aside className="h-fit space-y-4 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)]">
            <Card
              data-testid="product-purchase-card"
              padding="md"
              className={`sm:p-6 transition-opacity duration-200 ${isVariantTransitioning ? 'opacity-80' : 'opacity-100'}`}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-accent">Карточка товара</p>
              <h1 className="mt-2 text-xl sm:text-2xl font-semibold">{marketingTitle || product.name}</h1>
              {marketingSubtitle ? <p className="mt-2 text-sm text-muted">{marketingSubtitle}</p> : null}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                {activeCategory ? (
                  <Link to={`/category/${resolveCategoryToken(activeCategory)}`} className="text-primary hover:text-accent">
                    {activeCategory.name}
                  </Link>
                ) : null}
                {product?.material ? <span>Материал: {product.material}</span> : null}
                {selectedVariant?.name ? <span>Вариант: {selectedVariant.name}</span> : null}
                {productPresentation?.badgeText ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {productPresentation.badgeText}
                  </span>
                ) : null}
                {productPresentation?.ribbonText ? (
                  <span className="rounded-full border border-ink/10 bg-white/90 px-2.5 py-1 text-xs text-ink/75">
                    {productPresentation.ribbonText}
                  </span>
                ) : null}
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

              <div className={`mt-4 rounded-2xl border px-3 py-3 text-sm ${availabilityMeta.badgeClass}`}>
                <p className={`font-semibold ${availabilityMeta.tone}`}>{availabilityMeta.label}</p>
                <p className="mt-1 text-xs text-ink/70">{availabilityMeta.detail}</p>
              </div>

              <div className="mt-4 grid gap-2">
                {infoHighlights.map((item) => (
                  <ProductInfoCard
                    key={item.key}
                    icon={item.icon}
                    title={item.title}
                    summary={item.summary}
                    caption={item.caption}
                    onOpen={() => openInfoSheet(item.key)}
                  />
                ))}
              </div>

              {productVariants.length > 1 && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Выберите вариант</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {productVariants.map((variant) => {
                      const isActive = selectedVariant?.id === variant.id;
                      const variantStock = getStockValue(variant);
                      const variantStatus =
                        variantStock <= 0
                          ? 'Нет в наличии'
                          : variantStock <= 3
                          ? `Осталось ${variantStock} шт.`
                          : 'В наличии';
                      return (
                        <Button
                          key={variant.id}
                          variant="secondary"
                          size="sm"
                          className={`h-auto min-h-[44px] px-3 py-1.5 text-sm ${
                            isActive
                              ? 'border-primary bg-primary/10 text-primary shadow-none'
                              : variantStock <= 0
                              ? 'border-red-200 bg-red-50/70 text-red-700 shadow-none hover:border-red-300 hover:text-red-800'
                              : 'border-ink/10 bg-white/90 hover:border-primary/40 hover:text-primary'
                          }`}
                          onClick={() => handleVariantChange(variant)}
                          disabled={isCartActionPending}
                          aria-pressed={isActive}
                        >
                          <span className="block font-medium">{variant.name || variant.sku || variant.id}</span>
                          <span className={`block text-[11px] ${variantStock <= 0 ? 'text-red-700/90' : 'text-muted'}`}>
                            {formatRub(moneyToNumber(variant.price))}
                            {` · ${variantStatus}`}
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
                    disabled={isCartActionPending || availableStock <= 0}
                  >
                    −
                  </Button>
                  <span className="min-w-[42px] text-center text-sm font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl border border-transparent text-lg text-ink/75 hover:text-primary"
                    onClick={() => setQuantity((prev) => Math.min(Math.max(1, availableStock || 99), 99, prev + 1))}
                    aria-label="Увеличить количество"
                    disabled={isCartActionPending || availableStock <= 0}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-1 text-sm">
                <span className={availabilityMeta.tone}>{availabilityMeta.label}</span>
                <span className="text-xs text-muted">
                  {selectedVariant?.name
                    ? `Покупка и остаток считаются для варианта «${selectedVariant.name}».`
                    : 'Покупка и остаток рассчитываются по текущему товару.'}
                </span>
              </div>

              <div className="mt-5 space-y-2">
                <Button
                  block
                  onClick={handleAddToCart}
                  disabled={!canPurchaseSelectedVariant}
                >
                  {pendingAction === 'add' ? 'Добавляем…' : 'Добавить в корзину'}
                </Button>

                <Button
                  variant="secondary"
                  block
                  onClick={handleBuyNow}
                  disabled={!canPurchaseSelectedVariant}
                >
                  {pendingAction === 'buy' ? 'Переходим к оформлению…' : 'Купить сейчас'}
                </Button>
              </div>

              {cartStatus ? <NotificationBanner notification={cartStatus} className="mt-3" /> : null}

              {availableStock <= 0 && (
                <Card variant="quiet" padding="sm" className="mt-4 text-sm">
                  <p className="font-medium text-ink">Этот вариант сейчас недоступен</p>
                  <p className="mt-1 text-xs text-muted">
                    Не показываем форму «сообщить о поступлении», пока она не подключена к реальному сервису.
                    Выберите доступный вариант или откройте похожие товары.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hasSelectableFallbackVariant ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSelectAvailableVariant}
                        disabled={isCartActionPending}
                      >
                        Выбрать доступный вариант
                      </Button>
                    ) : null}
                    {!hasSelectableFallbackVariant && fallbackAvailableVariant ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSelectAvailableVariant}
                        disabled={isCartActionPending}
                      >
                        Выбрать вариант в наличии
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInfoSheet('shipping')}
                    >
                      Уточнить доставку
                    </Button>
                  </div>
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

                <Button block className="mt-3" onClick={handleAddBundle} disabled={!canPurchaseSelectedVariant || !hasBundleSelection}>
                  {pendingAction === 'bundle' ? 'Добавляем комплект…' : 'Добавить комплект'}
                </Button>
              </Card>
            )}
          </aside>

          <div data-testid="product-mobile-highlights" className="grid gap-2 sm:hidden">
            {highlights.map((entry) => (
              <Card key={entry} variant="quiet" padding="sm" className="text-sm shadow-sm">
                {entry}
              </Card>
            ))}
          </div>
        </div>

        <section id="product-tabs" className="mt-10 sm:mt-12">
          <Tabs
            items={productTabs}
            value={activeTab}
            onChange={setActiveTab}
            ariaLabel="Разделы товара"
            idBase="product-tabs"
            fullWidth
            className="max-w-3xl"
          />

          {activeTab === 'about' && (
            <Card
              as="section"
              id="product-tabs-panel-about"
              role="tabpanel"
              aria-labelledby="product-tabs-tab-about"
              tabIndex={0}
              padding="md"
              className="mt-4"
            >
              {introBody ? (
                <CmsRichText html={introBody} className="text-sm leading-relaxed text-ink/80" />
              ) : (
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">
                  Описание отсутствует.
                </p>
              )}
            </Card>
          )}

          {activeTab === 'details' && (
            <div
              id="product-tabs-panel-details"
              role="tabpanel"
              aria-labelledby="product-tabs-tab-details"
              tabIndex={0}
              className="mt-4"
            >
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

        <CataloguePresentationBlocks
          blocks={productPresentation?.blocks}
          page={presentationPage}
          className="mt-10 sm:mt-12"
        />
        <CmsStorefrontCollectionRail
          collectionKeys={productPresentation?.linkedCollectionKeys}
          className="mt-10 sm:mt-12"
        />

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

      <div
        data-testid="product-mobile-cart-bar"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-ink/10 bg-white/90 backdrop-blur pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="page-shell py-2.5">
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
              disabled={!canPurchaseSelectedVariant}
            >
              {pendingAction === 'add' ? 'Добавляем…' : 'В корзину'}
            </Button>
          </div>
        </div>
      </div>

      <ProductMediaViewer
        open={isImageZoomOpen}
        items={orderedImages}
        activeIndex={activeImageIndex}
        productName={marketingTitle || product.name}
        variantNameById={variantNameById}
        onSelect={selectImageByIndex}
        onClose={() => setIsImageZoomOpen(false)}
      />

      <Modal
        open={isInfoSheetOpen}
        onClose={() => setIsInfoSheetOpen(false)}
        placement="sheet"
        size="sm"
        title={
          sheetType === 'shipping'
            ? 'Доставка'
            : sheetType === 'payment'
            ? 'Оплата'
            : 'Условия возврата'
        }
        description={
          sheetType === 'shipping'
            ? 'Доставка'
            : sheetType === 'payment'
            ? 'Оплата'
            : 'Возвраты'
        }
      >
        {sheetType === 'shipping' ? (
          <div className="space-y-3 text-sm text-ink/85">
            <p>Финальную стоимость и варианты доставки согласует менеджер после оформления заказа.</p>
            <p>При онлайн-оплате вы оплачиваете только товары. Доставка оплачивается отдельно после согласования.</p>
            <p>Наш менеджер свяжется с вами в ближайшее время после оплаты.</p>
          </div>
        ) : sheetType === 'payment' ? (
          <div className="space-y-3 text-sm text-ink/85">
            <p>Оплата подтверждается только на защищённом шаге оформления заказа или на странице заказа.</p>
            <p>Если соединение нестабильно, магазин не дублирует покупку: можно безопасно вернуться к заказу и продолжить оплату.</p>
            <p>
              Подробнее о способах оплаты:
              {' '}
              <Link to="/info/payment" className="text-primary">
                «Оплата»
              </Link>.
            </p>
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

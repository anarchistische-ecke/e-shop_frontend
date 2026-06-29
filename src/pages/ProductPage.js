import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { WishlistContext } from '../contexts/WishlistContext';
import { getProduct } from '../api';
import NotificationBanner from '../components/NotificationBanner';
import Seo from '../components/Seo';
import { CataloguePresentationBlocks } from '../components/cms/CataloguePresentationSections';
import CmsStorefrontCollectionRail from '../components/cms/CmsStorefrontCollectionRail';
import { CmsRichText } from '../components/cms/cmsBlockShared';
import ProductCard from '../components/ProductCard';
import ResponsiveImage from '../components/media/ResponsiveImage';
import ProductMediaViewer from '../components/product/ProductMediaViewer';
import { Button, Card, Modal } from '../components/ui';
import { HeartIcon } from '../components/header/icons';
import { useProductDirectoryData } from '../features/product-list/data';
import {
  getPrimaryVariant,
  getProductPrice,
  moneyToNumber,
  normalizeProductImages,
} from '../utils/product';
import { buildProductPath } from '../utils/url';
import { useSsrData } from '../ssr/SsrDataContext';
import {
  METRIKA_GOALS,
  trackGoal,
  trackProductDetail,
  trackProductList
} from '../utils/metrika';
import {
  buildBreadcrumbJsonLd,
  buildJsonLdGraph,
  buildProductJsonLd,
  buildProductMicrodata,
  buildWebPageJsonLd
} from '../seo/schema';

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

function splitSpecLine(entry) {
  const parts = String(entry || '').split(':');
  if (parts.length < 2) {
    return {
      label: 'Параметр',
      value: String(entry || ''),
    };
  }

  return {
    label: parts.shift().trim(),
    value: parts.join(':').trim(),
  };
}

function getFirstImageUrl(product) {
  return normalizeProductImages(product?.images || [])[0]?.url || '';
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

function normalizeOptionToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function getVariantColorKey(variant) {
  const explicitValue = variant?.colorCode || variant?.colorLabel || variant?.colorHex;
  return normalizeOptionToken(explicitValue) || 'default-color';
}

function getVariantColorLabel(variant) {
  return variant?.colorLabel || variant?.colorCode || 'Цвет';
}

function getVariantSizeKey(variant) {
  return normalizeOptionToken(variant?.sizeCode || variant?.sizeLabel || variant?.name || variant?.sku || variant?.id);
}

function getVariantSizeLabel(variant) {
  return variant?.sizeLabel || variant?.name || variant?.sku || 'Вариант';
}

function hasStructuredColor(variant) {
  return Boolean(variant?.colorCode || variant?.colorLabel || variant?.colorHex);
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
    <button
      type="button"
      className="group flex min-h-[64px] w-full items-start gap-3 border-b border-ink/10 py-3 text-left transition hover:border-primary/30"
      onClick={onOpen}
    >
      <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center text-primary">
        <TrustIcon type={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-sm text-ink/70">{summary}</span>
        <span className="mt-1 block text-xs text-muted">{caption}</span>
      </span>
      <span className="mt-1 text-xs uppercase tracking-[0.16em] text-primary/70 group-hover:text-primary">
        Подробнее
      </span>
    </button>
  );
}

function ProductAccordionItem({ id, title, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-ink/10">
      <button
        type="button"
        className="flex min-h-[48px] w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-ink"
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
      >
        <span>{title}</span>
        <span className="text-xl leading-none text-primary">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen ? (
        <div id={`${id}-panel`} className="pb-5 text-sm leading-relaxed text-ink/78">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ProductPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useContext(CartContext);
  const { isWishlisted, toggle: toggleWishlist } = useContext(WishlistContext);
  const { routeData } = useSsrData();
  const { categories, products: directoryProducts } = useProductDirectoryData({ requireFull: true });
  const hasProductRouteSeed =
    routeData?.kind === 'product' && String(routeData.productId || '') === String(id);
  const hasInitialProductLoad = hasProductRouteSeed && Boolean(routeData.product);
  const hasConfirmedNotFound = hasProductRouteSeed && routeData.product == null && routeData.notFound === true;
  const initialProduct = hasInitialProductLoad ? routeData.product : null;

  const [product, setProduct] = useState(initialProduct);
  const [selectedVariant, setSelectedVariant] = useState(() =>
    resolveInitialSelectedVariant(initialProduct)
  );
  const [openAccordions, setOpenAccordions] = useState({ bundle: true, description: true });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [bundleSelections, setBundleSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(!hasInitialProductLoad && !hasConfirmedNotFound);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [showZoomHint, setShowZoomHint] = useState(true);
  const [sheetType, setSheetType] = useState('shipping');
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [isVariantTransitioning, setIsVariantTransitioning] = useState(false);
  const [isVariantMenuOpen, setIsVariantMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [cartStatus, setCartStatus] = useState(null);
  const [showMobileCartBar, setShowMobileCartBar] = useState(true);

  const transitionTimerRef = useRef(null);
  const cartInputRef = useRef({ quantity: 1, variantId: null });
  const variantMenuRef = useRef(null);
  const galleryGestureRef = useRef(null);
  const detailTrackedRef = useRef('');
  const primaryAddToCartRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShowZoomHint(window.localStorage.getItem('pdp-zoom-hint-seen') !== '1');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !primaryAddToCartRef.current) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateVisibility = (entry) => {
      if (!mediaQuery.matches) {
        setShowMobileCartBar(false);
        return;
      }
      setShowMobileCartBar(!entry?.isIntersecting);
    };
    const observer = new IntersectionObserver(
      ([entry]) => updateVisibility(entry),
      {
        root: null,
        threshold: 0.35,
        rootMargin: '0px 0px -72px 0px'
      }
    );
    observer.observe(primaryAddToCartRef.current);
    const handleMediaChange = () => updateVisibility();
    mediaQuery.addEventListener?.('change', handleMediaChange);
    handleMediaChange();

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener?.('change', handleMediaChange);
    };
  }, [product?.id, selectedVariant?.id]);

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
    setOpenAccordions({ bundle: true, description: true });
    setActiveImageIndex(0);
    setBundleSelections({});
    setQuantity(1);
    setIsVariantMenuOpen(false);
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

  useEffect(() => {
    if (!isVariantMenuOpen || typeof document === 'undefined') {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (variantMenuRef.current?.contains(event.target)) {
        return;
      }
      setIsVariantMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isVariantMenuOpen]);

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
  const galleryItems = orderedImages.length > 0 ? orderedImages : [null];

  const hasScaleImage = useMemo(() => detectScaleImage(orderedImages), [orderedImages]);
  const hasDimensionsImage = useMemo(() => detectDimensionsImage(orderedImages), [orderedImages]);
  const productVariants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : Array.from(product?.variants || [])),
    [product]
  );
  const hasColorOptions = useMemo(
    () => productVariants.some(hasStructuredColor),
    [productVariants]
  );
  const selectedColorKey = selectedVariant ? getVariantColorKey(selectedVariant) : '';
  const selectedSizeKey = selectedVariant ? getVariantSizeKey(selectedVariant) : '';
  const colorOptions = useMemo(() => {
    const map = new Map();
    productVariants.forEach((variant) => {
      const key = getVariantColorKey(variant);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: getVariantColorLabel(variant),
          hex: variant?.colorHex || '',
          variants: []
        });
      }
      map.get(key).variants.push(variant);
    });
    return Array.from(map.values()).map((option) => ({
      ...option,
      available: option.variants.some((variant) => getStockValue(variant) > 0)
    }));
  }, [productVariants]);
  const sizeOptions = useMemo(() => {
    const source =
      hasColorOptions && selectedColorKey
        ? productVariants.filter((variant) => getVariantColorKey(variant) === selectedColorKey)
        : productVariants;
    const map = new Map();
    source.forEach((variant) => {
      const key = getVariantSizeKey(variant);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: getVariantSizeLabel(variant),
          variant,
          stock: getStockValue(variant)
        });
        return;
      }
      const current = map.get(key);
      if (current.stock <= 0 && getStockValue(variant) > 0) {
        map.set(key, {
          key,
          label: getVariantSizeLabel(variant),
          variant,
          stock: getStockValue(variant)
        });
      }
    });
    return Array.from(map.values());
  }, [hasColorOptions, productVariants, selectedColorKey]);

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
  const descriptionBody = product?.description || productPresentation?.introBody || '';

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

  const variantImageSwatches = useMemo(
    () =>
      productVariants
        .map((variant) => ({
          variant,
          image: images.find((image) => image.variantId === variant.id),
        }))
        .filter((entry) => entry.image?.url),
    [images, productVariants]
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
        summary: '14 дней на возврат',
        caption: 'Если товар не подошёл, поможем оформить возврат без лишних шагов.'
      },
      {
        key: 'payment',
        icon: 'secure',
        title: 'Оплата',
        summary: 'Безопасная оплата',
        caption: 'Оплата подтверждается на защищённом шаге и не дублируется.'
      }
    ],
    []
  );
  const hasBundleSelection = bundleItems.some((item) => bundleSelections[item.id]);
  const isCartActionPending = Boolean(pendingAction);
  const canPurchaseSelectedVariant = Boolean(selectedVariant) && availableStock > 0 && !isCartActionPending;
  const variantSelectionHint =
    !selectedVariant
      ? 'Выберите цвет и размер, чтобы добавить товар в корзину.'
      : availableStock <= 0
      ? 'Выбранная комбинация сейчас недоступна. Выберите другой размер или цвет.'
      : '';
  const isProductFavorite = isWishlisted(product);
  const careText = product?.care || 'Деликатная стирка при 30°. Следуйте рекомендациям на ярлыке изделия.';
  const hasDetailsContent = specificationSections.length > 0 || fallbackSpecs.length > 0;
  const canonicalProductPath = useMemo(() => buildProductPath(product), [product]);
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
  const productBreadcrumbs = useMemo(
    () =>
      buildBreadcrumbJsonLd([
        { name: 'Главная', path: '/' },
        { name: 'Каталог', path: '/catalog' },
        activeCategory
          ? { name: activeCategory.name, path: `/category/${resolveCategoryToken(activeCategory)}` }
          : null,
        { name: marketingTitle || product?.name || 'Товар', path: canonicalProductPath }
      ].filter(Boolean)),
    [activeCategory, canonicalProductPath, marketingTitle, product?.name]
  );
  const productStructuredData = useMemo(
    () =>
      buildProductJsonLd({
        product,
        variant: selectedVariant,
        categoryName: activeCategory?.name || '',
        title: marketingTitle || product?.name || '',
        description: seoDescription,
        path: canonicalProductPath,
        image: seoImage,
        price,
        stock: availableStock
      }),
    [
      activeCategory?.name,
      availableStock,
      canonicalProductPath,
      marketingTitle,
      price,
      product,
      selectedVariant,
      seoDescription,
      seoImage
    ]
  );
  const productJsonLd = useMemo(() => {
    const webPage = buildWebPageJsonLd({
      title: seoTitle,
      description: seoDescription,
      path: canonicalProductPath,
      image: seoImage,
      breadcrumbs: productBreadcrumbs,
      type: 'ItemPage'
    });

    return buildJsonLdGraph([webPage, productBreadcrumbs, productStructuredData]);
  }, [
    canonicalProductPath,
    productBreadcrumbs,
    productStructuredData,
    seoDescription,
    seoImage,
    seoTitle
  ]);
  const productMicrodata = useMemo(
    () =>
      buildProductMicrodata(product, {
        variant: selectedVariant,
        categoryName: activeCategory?.name || '',
        title: marketingTitle || product?.name || '',
        description: seoDescription,
        path: canonicalProductPath,
        image: seoImage,
        price,
        stock: availableStock
      }),
    [
      activeCategory?.name,
      availableStock,
      canonicalProductPath,
      marketingTitle,
      price,
      product,
      selectedVariant,
      seoDescription,
      seoImage
    ]
  );

  useEffect(() => {
    if (availableStock > 0) {
      setQuantity((prev) => Math.max(1, Math.min(prev, availableStock)));
    }
  }, [availableStock]);

  useEffect(() => {
    if (!product?.id) return;
    const trackingKey = `${product.id}:${selectedVariant?.id || ''}`;
    if (detailTrackedRef.current === trackingKey) return;
    trackProductDetail(product, {
      variant: selectedVariant,
      variantId: selectedVariant?.id
    });
    detailTrackedRef.current = trackingKey;
  }, [product, selectedVariant]);

  useEffect(() => {
    if (!relatedProducts.length) return;
    trackProductList(relatedProducts, {
      listName: 'pdp_related_products',
      pageType: 'product'
    });
  }, [relatedProducts]);

  const selectImageByIndex = (index) => {
    if (!orderedImages.length) return;
    const safeIndex = (index + orderedImages.length) % orderedImages.length;
    const nextImage = orderedImages[safeIndex];
    setActiveImageIndex(safeIndex);
    trackGoal(METRIKA_GOALS.PRODUCT_GALLERY_INTERACTION, {
      product_id: product?.id,
      image_index: safeIndex + 1,
      action: 'select'
    });

    if (nextImage?.variantId && selectedVariant?.id !== nextImage.variantId) {
      const variant = (product?.variants || []).find((item) => item.id === nextImage.variantId);
      if (variant) {
        setSelectedVariant(variant);
      }
    }
  };

  const openImageZoom = () => {
    setIsImageZoomOpen(true);
    trackGoal(METRIKA_GOALS.PRODUCT_GALLERY_INTERACTION, {
      product_id: product?.id,
      image_index: activeImageIndex + 1,
      action: 'zoom_open'
    });
    if (!showZoomHint) return;
    setShowZoomHint(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pdp-zoom-hint-seen', '1');
    }
  };

  const openImageZoomAtIndex = (index) => {
    selectImageByIndex(index);
    openImageZoom();
  };

  const handleMobileGalleryPointerDown = (event) => {
    galleryGestureRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      didSwipe: false,
    };
  };

  const handleMobileGalleryPointerUp = (event) => {
    const gesture = galleryGestureRef.current;
    if (!gesture || orderedImages.length < 2) {
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > 42 && absX > absY * 1.2) {
      gesture.didSwipe = true;
      trackGoal(METRIKA_GOALS.PRODUCT_GALLERY_INTERACTION, {
        product_id: product?.id,
        image_index: activeImageIndex + 1,
        action: deltaX < 0 ? 'swipe_next' : 'swipe_prev'
      });
      selectImageByIndex(activeImageIndex + (deltaX < 0 ? 1 : -1));
    }
  };

  const handleMobileGalleryPointerCancel = () => {
    galleryGestureRef.current = null;
  };

  const handleMobileGalleryClick = (event) => {
    if (galleryGestureRef.current?.didSwipe) {
      event.preventDefault();
      galleryGestureRef.current = null;
      return;
    }

    galleryGestureRef.current = null;
    openImageZoom();
  };

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    trackGoal(METRIKA_GOALS.PRODUCT_SPEC_INTERACTION, {
      product_id: product?.id,
      section: key,
      action: openAccordions[key] ? 'collapse' : 'expand'
    });
  };

  const openDetailsAccordion = () => {
    setOpenAccordions((prev) => ({
      ...prev,
      details: true,
    }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        document.getElementById('pdp-details-panel')?.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }, 0);
    }
  };

  const handleVariantChange = (variant) => {
    if (!variant || variant.id === selectedVariant?.id) return;

    setIsVariantTransitioning(true);
    setSelectedVariant(variant);
    trackGoal(METRIKA_GOALS.PRODUCT_VARIANT_CHANGE, {
      product_id: product?.id,
      variant_id: variant.id,
      stock: getStockValue(variant)
    });

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

  const handleVariantSelect = (variant) => {
    handleVariantChange(variant);
    setIsVariantMenuOpen(false);
  };

  const handleColorSelect = (colorKey) => {
    if (!colorKey || colorKey === selectedColorKey) return;
    const candidates = productVariants.filter((variant) => getVariantColorKey(variant) === colorKey);
    if (!candidates.length) return;
    const preservedSize = selectedSizeKey
      ? candidates.find(
          (variant) => getVariantSizeKey(variant) === selectedSizeKey && getStockValue(variant) > 0
        )
      : null;
    const nextVariant =
      preservedSize ||
      candidates.find((variant) => getStockValue(variant) > 0) ||
      candidates[0];
    handleVariantChange(nextVariant);
  };

  const handleSizeSelect = (option) => {
    if (!option?.variant || option.stock <= 0) return;
    handleVariantChange(option.variant);
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product);
  };

  const openInfoSheet = (nextSheetType) => {
    setSheetType(nextSheetType);
    setIsInfoSheetOpen(true);
    trackGoal(METRIKA_GOALS.PRODUCT_INFO_OPEN, {
      product_id: product?.id,
      sheet_type: nextSheetType
    });
  };

  const addSelectedVariantToCart = async () => {
    if (!product || !selectedVariant || availableStock <= 0) {
      setCartStatus({
        type: 'warning',
        title: 'Выберите доступный вариант',
        message: variantSelectionHint || 'Перед добавлением нужен доступный цвет и размер.'
      });
      return false;
    }
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
    trackGoal(METRIKA_GOALS.BUNDLE_SELECT, {
      product_id: product.id,
      selected_count: bundleItems.filter((item) => bundleSelections[item.id]).length,
      bundle_total: Math.round(bundleTotal)
    });
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
    <div
      className="product-page pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-0 lg:pb-16"
      itemScope={Boolean(productMicrodata) || undefined}
      itemType={productMicrodata ? 'https://schema.org/Product' : undefined}
    >
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalProductPath}
        image={seoImage}
        imageAlt={marketingTitle || product.name}
        type="product"
        jsonLd={productJsonLd}
      />
      {productMicrodata ? (
        <>
          <meta itemProp="name" content={productMicrodata.name} />
          <meta itemProp="description" content={productMicrodata.description} />
          {productMicrodata.image ? <link itemProp="image" href={productMicrodata.image} /> : null}
          {productMicrodata.sku ? <meta itemProp="sku" content={productMicrodata.sku} /> : null}
          {productMicrodata.brand ? (
            <span itemProp="brand" itemScope itemType="https://schema.org/Brand">
              <meta itemProp="name" content={productMicrodata.brand} />
            </span>
          ) : null}
          {productMicrodata.offer ? (
            <span itemProp="offers" itemScope itemType="https://schema.org/Offer">
              <meta itemProp="price" content={productMicrodata.offer.price} />
              <meta itemProp="priceCurrency" content={productMicrodata.offer.priceCurrency} />
              <link itemProp="availability" href={productMicrodata.offer.availability} />
              <link itemProp="itemCondition" href={productMicrodata.offer.itemCondition} />
              <link itemProp="url" href={productMicrodata.offer.url} />
              {productMicrodata.offer.sku ? <meta itemProp="sku" content={productMicrodata.offer.sku} /> : null}
            </span>
          ) : null}
        </>
      ) : null}
      <div className="page-shell page-shell--wide pt-4 sm:pt-6">
        <nav className="mb-4 hidden flex-wrap items-center gap-2 text-[11px] text-ink/55 sm:mb-5 md:flex" aria-label="Хлебные крошки">
          {location.state?.fromPath ? (
            <Link to={location.state.fromPath} className="underline-offset-4 hover:underline">
              ← {location.state.fromLabel || 'Назад к результатам'}
            </Link>
          ) : null}
          <Link to="/" className="hover:text-ink">Главная</Link>
          <span>›</span>
          <Link to="/category/popular" className="hover:text-ink">Каталог</Link>
          {activeCategory && (
            <>
              <span>›</span>
              <Link to={`/category/${resolveCategoryToken(activeCategory)}`} className="hover:text-ink">
                {activeCategory.name}
              </Link>
            </>
          )}
          <span>›</span>
          <span className="text-ink/80" aria-current="page">{marketingTitle || product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:items-start xl:gap-10">
          <section
            data-testid="product-gallery-card"
            className={`min-w-0 transition-opacity duration-200 ${
              isVariantTransitioning ? 'opacity-80' : 'opacity-100'
            }`}
          >
            <div className="lg:hidden">
              <div className="relative mx-[calc(var(--page-inline)*-1)] overflow-hidden border-y border-white/80 bg-sand/45 shadow-[0_18px_42px_rgba(43,39,34,0.12)] sm:mx-0 sm:rounded-[28px] sm:border">
                {mainImage ? (
                  <button
                    type="button"
                    className="relative block aspect-square w-full touch-pan-y"
                    onPointerDown={handleMobileGalleryPointerDown}
                    onPointerUp={handleMobileGalleryPointerUp}
                    onPointerCancel={handleMobileGalleryPointerCancel}
                    onClick={handleMobileGalleryClick}
                    aria-label="Увеличить изображение"
                  >
                    <ResponsiveImage
                      media={activeImage?.media}
                      src={mainImage}
                      alt={activeImage?.alt || product.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                      draggable={false}
                    />
                    {showZoomHint && (
                      <span className="absolute bottom-3 left-3 rounded-xl bg-white/90 px-3 py-1 text-xs text-ink/70">
                        Нажмите, чтобы увеличить
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="flex aspect-square items-center justify-center text-sm text-muted">
                    Изображение появится после загрузки
                  </div>
                )}
              </div>

              <div
                data-testid="product-gallery-rail"
                className="mt-4 flex items-center justify-center gap-2"
                aria-label="Изображения товара"
              >
                {galleryItems.map((image, index) => (
                  <button
                    key={image ? image.id || index : index}
                    type="button"
                    onClick={() => selectImageByIndex(index)}
                    className="focus-ring-soft flex h-12 w-10 items-center justify-center rounded-full"
                    aria-label={`Показать изображение ${index + 1}`}
                    aria-current={index === activeImageIndex ? 'true' : undefined}
                  >
                    <span
                      className={`h-1.5 rounded-full transition-all ${
                        index === activeImageIndex ? 'w-7 bg-primary' : 'w-7 bg-ink/15'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:grid lg:gap-4">
              <div className="overflow-hidden rounded-[28px] border border-white/80 bg-sand/45 shadow-[0_18px_42px_rgba(43,39,34,0.12)]">
                {galleryItems[0] ? (
                  <button
                    type="button"
                    className="group relative block aspect-[1/0.82] w-full"
                    onClick={() => openImageZoomAtIndex(0)}
                    aria-label="Увеличить изображение"
                  >
                    <ResponsiveImage
                      media={galleryItems[0].media}
                      src={galleryItems[0].url}
                      alt={galleryItems[0].alt || product.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                      draggable={false}
                    />
                    <span className="absolute bottom-3 right-3 rounded-xl bg-white/90 px-3 py-1 text-xs text-ink/70 opacity-0 transition-opacity group-hover:opacity-100">
                      Открыть крупно
                    </span>
                  </button>
                ) : (
                  <div className="flex aspect-[1/0.82] items-center justify-center text-sm text-muted">
                    Изображение появится после загрузки
                  </div>
                )}
              </div>

              {galleryItems.length > 1 && (
                <div className="grid grid-cols-2 gap-4">
                  {galleryItems.slice(1).map((image, index) => {
                    const imageIndex = index + 1;
                    return (
                      <button
                        key={image ? image.id || imageIndex : imageIndex}
                        type="button"
                        className="relative aspect-square overflow-hidden rounded-[24px] border border-white/80 bg-sand/45 shadow-[0_12px_28px_rgba(43,39,34,0.1)]"
                        onClick={() => openImageZoomAtIndex(imageIndex)}
                        aria-label={`Увеличить изображение ${imageIndex + 1}`}
                      >
                        {image ? (
                          <ResponsiveImage
                            media={image.media}
                            src={image.url}
                            alt={image.alt || `${product.name}, изображение ${imageIndex + 1}`}
                            className="absolute inset-0 h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs text-muted">
                            Нет фото
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-3 hidden items-center gap-3 text-xs text-ink/50 lg:flex">
              <span>Фото: {orderedImages.length || 1}</span>
              {hasScaleImage ? <span>Есть фото в масштабе</span> : null}
              {hasDimensionsImage ? <span>Есть схема размеров</span> : null}
            </div>
          </section>

          <aside className="min-w-0 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)]">
            <div
              data-testid="product-purchase-card"
              className={`rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_50px_rgba(43,39,34,0.1)] transition-opacity duration-200 sm:p-6 ${
                isVariantTransitioning ? 'opacity-80' : 'opacity-100'
              }`}
            >
              <div className="border-b border-ink/10 pb-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <h1 className="max-w-xl text-2xl font-medium leading-tight tracking-normal text-ink sm:text-3xl lg:text-3xl">
                    {marketingTitle || product.name}
                  </h1>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className={`!rounded-full ${isProductFavorite ? 'text-primary' : ''}`}
                    onClick={handleWishlistToggle}
                    aria-label={isProductFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                    aria-pressed={isProductFavorite}
                  >
                    <HeartIcon className="h-5 w-5" filled={isProductFavorite} />
                  </Button>
                </div>
                {productPresentation?.marketingSubtitle ? (
                  <p className="mt-3 text-sm leading-relaxed text-ink/65">
                    {productPresentation.marketingSubtitle}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.14em] text-ink/50">
                  {activeCategory ? (
                    <Link to={`/category/${resolveCategoryToken(activeCategory)}`} className="hover:text-ink">
                      {activeCategory.name}
                    </Link>
                  ) : null}
                  {product?.material ? <span>{product.material}</span> : null}
                  {selectedVariant?.name ? <span>{selectedVariant.name}</span> : null}
                  {productPresentation?.badgeText ? <span>{productPresentation.badgeText}</span> : null}
                  {productPresentation?.ribbonText ? <span>{productPresentation.ribbonText}</span> : null}
                </div>
              </div>

              <div className="border-b border-ink/10 py-5">
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-medium leading-none text-ink">{formatRub(price)}</p>
                  {hasDiscount && (
                    <>
                      <span className="text-base line-through text-ink/45">{formatRub(oldPrice)}</span>
                      <span className="text-sm text-primary">−{discountPercent}%</span>
                    </>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                  <div>
                    <p className={`font-medium ${availabilityMeta.tone}`}>{availabilityMeta.label}</p>
                    <p className="mt-1 text-xs text-ink/55">{availabilityMeta.detail}</p>
                  </div>
                  {hasDetailsContent ? (
                    <button
                      type="button"
                      className="flex-shrink-0 text-xs text-ink/60 underline underline-offset-4 hover:text-ink"
                      onClick={openDetailsAccordion}
                    >
                      Таблица размеров
                    </button>
                  ) : null}
                </div>
              </div>

              {productVariants.length > 0 && (
                <div className="border-b border-ink/10 py-5">
                  {hasColorOptions && colorOptions.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-ink/50">Цвет</p>
                        <p className="text-xs text-muted">
                          {selectedVariant ? getVariantColorLabel(selectedVariant) : 'Выберите цвет'}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {colorOptions.map((option) => {
                          const isActive = option.key === selectedColorKey;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              className={`focus-ring-soft inline-flex min-h-[48px] items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                                isActive
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : option.available
                                  ? 'border-ink/12 bg-white/85 text-ink hover:border-primary/35'
                                  : 'border-ink/10 bg-sand/35 text-muted line-through opacity-60'
                              }`}
                              onClick={() => handleColorSelect(option.key)}
                              disabled={!option.available || isCartActionPending}
                              aria-pressed={isActive}
                            >
                              <span
                                className="inline-flex h-5 w-5 rounded-full border border-ink/15"
                                style={{ backgroundColor: option.hex || '#f5eee3' }}
                                aria-hidden="true"
                              />
                              <span>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className={hasColorOptions ? 'mt-5' : ''}>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink/50">
                      Размер
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sizeOptions.map((option) => {
                        const isActive = option.key === selectedSizeKey;
                        const isDisabled = option.stock <= 0 || isCartActionPending;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            className={`focus-ring-soft min-h-[46px] rounded-2xl border px-4 py-2 text-left text-sm transition ${
                              isActive
                                ? 'border-primary bg-primary/10 text-primary'
                                : isDisabled
                                ? 'border-ink/10 bg-sand/35 text-muted line-through opacity-60'
                                : 'border-ink/12 bg-white/85 text-ink hover:border-primary/35'
                            }`}
                            onClick={() => handleSizeSelect(option)}
                            disabled={isDisabled}
                            aria-pressed={isActive}
                          >
                            <span className="block font-medium">{option.label}</span>
                            <span className="mt-0.5 block text-xs opacity-75">
                              {option.stock <= 0
                                ? 'Нет в наличии'
                                : option.stock <= 3
                                ? `Осталось ${option.stock} шт.`
                                : 'В наличии'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {variantImageSwatches.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-ink/50">Фото вариантов</p>
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {variantImageSwatches.map(({ variant, image }) => {
                          const isActive = selectedVariant?.id === variant.id;
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden border ${
                                isActive ? 'rounded-2xl border-primary shadow-[0_10px_22px_rgba(182,91,74,0.18)]' : 'rounded-2xl border-ink/10'
                              }`}
                              onClick={() => handleVariantChange(variant)}
                              aria-label={`Выбрать вариант ${variant.name || variant.sku || variant.id}`}
                              aria-pressed={isActive}
                              disabled={isCartActionPending}
                            >
                              <ResponsiveImage
                                media={image.media}
                                src={image.url}
                                alt={image.alt || variant.name || ''}
                                className="h-full w-full object-cover"
                                draggable={false}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {variantSelectionHint ? (
                    <p className="mt-3 rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-ink/75">
                      {variantSelectionHint}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="border-b border-ink/10 py-5">
                <p className="text-xs uppercase tracking-[0.18em] text-ink/50">Количество</p>
                <div className="mt-2 inline-grid min-h-[48px] grid-cols-[48px_56px_48px] overflow-hidden rounded-2xl border border-ink/12 bg-white/85 text-sm shadow-[0_10px_22px_rgba(43,39,34,0.08)]">
                  <button
                    type="button"
                    className="border-r border-ink/10 text-lg text-ink/70 transition hover:bg-secondary/70 hover:text-primary disabled:opacity-40"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    aria-label="Уменьшить количество"
                    disabled={isCartActionPending || availableStock <= 0}
                  >
                    −
                  </button>
                  <span className="flex items-center justify-center font-medium">{quantity}</span>
                  <button
                    type="button"
                    className="border-l border-ink/10 text-lg text-ink/70 transition hover:bg-secondary/70 hover:text-primary disabled:opacity-40"
                    onClick={() => setQuantity((prev) => Math.min(Math.max(1, availableStock || 99), 99, prev + 1))}
                    aria-label="Увеличить количество"
                    disabled={isCartActionPending || availableStock <= 0}
                  >
                    +
                  </button>
                </div>

                <div className="mt-5 grid gap-2">
                  <Button
                    ref={primaryAddToCartRef}
                    block
                    className="!rounded-2xl"
                    onClick={handleAddToCart}
                    disabled={!canPurchaseSelectedVariant}
                  >
                    {pendingAction === 'add' ? 'Добавляем…' : 'Добавить в корзину'}
                  </Button>

                  <Button
                    variant="secondary"
                    block
                    className="!rounded-2xl"
                    onClick={handleBuyNow}
                    disabled={!canPurchaseSelectedVariant}
                  >
                    {pendingAction === 'buy' ? 'Переходим к оформлению…' : 'Купить сейчас'}
                  </Button>
                </div>

                <div className="mt-3 rounded-2xl border border-ink/10 bg-sand/35 px-3 py-2 text-xs leading-relaxed text-ink/70">
                  Возврат в течение 14 дней после получения. Онлайн-оплата проходит через YooKassa,
                  электронный чек 54-ФЗ придёт на email из заказа.
                </div>

                {cartStatus ? <NotificationBanner notification={cartStatus} className="mt-3" /> : null}

                {availableStock <= 0 && (
                  <Card variant="quiet" padding="sm" className="mt-4 rounded-2xl border-primary/20 bg-primary/5 text-sm shadow-none">
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
                          className="!rounded-2xl !shadow-none"
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
                          className="!rounded-2xl !shadow-none"
                          onClick={handleSelectAvailableVariant}
                          disabled={isCartActionPending}
                        >
                          Выбрать вариант в наличии
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!rounded-2xl"
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
                      className="mt-2 inline-flex !min-h-0 !rounded-none !px-0 !py-0 text-xs text-primary"
                    >
                      Показать похожие товары
                    </Button>
                  </Card>
                )}
              </div>

              <div data-testid="product-mobile-highlights" className="border-b border-ink/10">
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

              {bundleItems.length > 0 && (
                <section className="border-b border-ink/10 py-6">
                  <h2 className="text-xl font-medium tracking-normal text-ink">Товары коллекции</h2>
                  <div className="mt-4 space-y-4">
                    {bundleItems.map((item) => {
                      const itemImage = getFirstImageUrl(item);
                      return (
                        <label key={item.id} className="grid cursor-pointer grid-cols-[18px_72px_minmax(0,1fr)] gap-3 text-sm">
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
                          <span className="block aspect-square overflow-hidden rounded-2xl border border-white/80 bg-sand/45">
                            {itemImage ? (
                              <img src={itemImage} alt={item.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <Link
                              to={buildProductPath(item)}
                              className="block font-medium leading-snug text-ink hover:underline"
                            >
                              {item.name}
                            </Link>
                            <span className="mt-1 block text-ink/65">от {formatRub(getProductPrice(item))}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex items-center justify-between text-sm">
                    <span className="text-ink/55">Итого с комплектом</span>
                    <span className="font-medium text-ink">{formatRub(bundleTotal)}</span>
                  </div>

                  <Button
                    block
                    className="mt-3 !rounded-2xl"
                    onClick={handleAddBundle}
                    disabled={!canPurchaseSelectedVariant || !hasBundleSelection}
                  >
                    {pendingAction === 'bundle' ? 'Добавляем комплект…' : 'Добавить комплект'}
                  </Button>
                  <Button
                    as={Link}
                    to={`/category/${resolveCategoryToken(activeCategory) || 'popular'}`}
                    variant="ghost"
                    size="sm"
                    className="mt-2 !min-h-0 !rounded-none !px-0 !py-0 text-xs text-primary underline underline-offset-4"
                  >
                    Смотреть все
                  </Button>
                </section>
              )}

              <section className="divide-y-0" aria-label="Информация о товаре">
                <ProductAccordionItem
                  id="pdp-bundle"
                  title="Что входит в комплект"
                  isOpen={Boolean(openAccordions.bundle)}
                  onToggle={() => toggleAccordion('bundle')}
                >
                  <p>Комплектация, размер и выбранный вариант указаны в карточке товара и составе заказа.</p>
                  {highlights.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5">
                      {highlights.filter(Boolean).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </ProductAccordionItem>

                <ProductAccordionItem
                  id="pdp-description"
                  title="Описание"
                  isOpen={Boolean(openAccordions.description)}
                  onToggle={() => toggleAccordion('description')}
                >
                  {descriptionBody ? (
                    <CmsRichText html={descriptionBody} className="text-sm leading-relaxed text-ink/78" />
                  ) : (
                    <p>Описание отсутствует.</p>
                  )}
                </ProductAccordionItem>

                {hasDetailsContent && (
                  <ProductAccordionItem
                    id="pdp-details"
                    title="Характеристики"
                    isOpen={Boolean(openAccordions.details)}
                    onToggle={() => toggleAccordion('details')}
                  >
                    {specificationSections.length > 0 ? (
                      <div className="space-y-6">
                        {specificationSections.map((section, index) => (
                          <div key={`${section.title || 'section'}-${index}`}>
                            {section.title ? <h3 className="mb-3 text-sm font-medium text-ink">{section.title}</h3> : null}
                            {section.items.length > 0 && (
                              <dl className="border-t border-ink/10">
                                {section.items.map((item, itemIndex) => (
                                  <div
                                    key={`${item.label || 'item'}-${itemIndex}`}
                                    className="grid grid-cols-[42%_minmax(0,1fr)] gap-4 border-b border-ink/10 py-2"
                                  >
                                    <dt className="text-ink/55">{item.label || '—'}</dt>
                                    <dd className="break-words text-ink/80">{item.value || '—'}</dd>
                                  </div>
                                ))}
                              </dl>
                            )}
                            {section.description ? (
                              <p className="mt-3 whitespace-pre-line text-ink/78">{section.description}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <dl className="border-t border-ink/10">
                        {fallbackSpecs.map((entry) => {
                          const spec = splitSpecLine(entry);
                          return (
                            <div key={entry} className="grid grid-cols-[42%_minmax(0,1fr)] gap-4 border-b border-ink/10 py-2">
                              <dt className="text-ink/55">{spec.label}</dt>
                              <dd className="text-ink/80">{spec.value}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    )}
                  </ProductAccordionItem>
                )}

                {careText ? (
                  <ProductAccordionItem
                    id="pdp-care"
                    title="Состав и уход"
                    isOpen={Boolean(openAccordions.care)}
                    onToggle={() => toggleAccordion('care')}
                  >
                    <p className="whitespace-pre-line">{careText}</p>
                  </ProductAccordionItem>
                ) : null}

                <ProductAccordionItem
                  id="pdp-delivery-payment"
                  title="Доставка и возврат"
                  isOpen={Boolean(openAccordions.service)}
                  onToggle={() => toggleAccordion('service')}
                >
                  <div className="space-y-3">
                    <p>Финальную стоимость и варианты доставки согласует менеджер после оформления заказа.</p>
                    <p>При онлайн-оплате вы оплачиваете только товары. Доставка оплачивается отдельно после согласования.</p>
                    <p>Возврат возможен в течение 14 дней после получения. Оплата подтверждается на защищённом шаге оформления заказа или на странице заказа.</p>
                    <div className="flex flex-wrap gap-3 pt-1 text-xs">
                      <Link to="/info/payment" className="underline underline-offset-4">Оплата</Link>
                      <Link to="/info/delivery" className="underline underline-offset-4">Доставка</Link>
                    </div>
                  </div>
                </ProductAccordionItem>

              </section>
            </div>
          </aside>
        </div>

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
          <section className="mt-12 sm:mt-14">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-medium tracking-normal">С этим товаром покупают</h2>
              <Button as={Link} to="/category/popular" variant="ghost" size="sm" className="!rounded-2xl">
                Смотреть больше
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {relatedProducts.map((item, index) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  listName="pdp_related_products"
                  position={index + 1}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <div
        data-testid="product-mobile-cart-bar"
        className={`fixed bottom-0 left-0 right-0 z-30 border-t border-white/80 bg-white/90 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] shadow-[0_-18px_36px_rgba(43,39,34,0.1)] backdrop-blur transition-transform duration-200 lg:hidden ${
          showMobileCartBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showMobileCartBar}
      >
        <div className="page-shell py-2.5">
          {cartStatus ? <NotificationBanner notification={cartStatus} compact className="mb-3" /> : null}
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(10rem,1.3fr)] items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs text-ink/55">К оплате</p>
              <p className="truncate text-lg font-medium text-ink">{formatRub(price * quantity)}</p>
            </div>
            <Button
              block
              className="!rounded-2xl"
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
            <p>Возврат возможен в течение 14 дней после получения заказа.</p>
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

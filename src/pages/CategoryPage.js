import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getBrands, getCategories, getProducts } from '../api';
import {
  formatPrice,
  getPrimaryImageUrl,
  getProductPrice,
  moneyToNumber,
  normalizeProductImages,
} from '../utils/product';
import {
  normalizeSearchText,
  resolveSearchCorrection,
  searchProducts,
} from '../utils/search';

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

function resolveBrandToken(product) {
  if (!product) return '';
  if (typeof product.brand === 'string') return product.brand;
  if (product.brand && typeof product.brand === 'object') {
    return product.brand.slug || product.brand.id || product.brand.name || '';
  }
  return product.brandSlug || product.brandId || product.brand_id || '';
}

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

function getReviewCount(product) {
  return Number(
    product?.reviewCount || product?.reviewsCount || product?.reviews_count || 0
  );
}

function buildDiversityRanking(list) {
  if (!list.length) return new Map();

  const byPrice = [...list].sort((a, b) => getProductPrice(a) - getProductPrice(b));
  const bucketCount = 3;
  const buckets = Array.from({ length: bucketCount }, () => []);

  byPrice.forEach((item, index) => {
    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.floor((index / Math.max(1, byPrice.length - 1)) * bucketCount)
    );
    buckets[bucketIndex].push(item);
  });

  buckets.forEach((bucket) => {
    bucket.sort((a, b) => {
      const ratingDelta = (b?.rating || 0) - (a?.rating || 0);
      if (ratingDelta !== 0) return ratingDelta;
      return getReviewCount(b) - getReviewCount(a);
    });
  });

  const ordered = [];
  let hasItems = true;
  while (hasItems) {
    hasItems = false;
    buckets.forEach((bucket) => {
      if (bucket.length > 0) {
        hasItems = true;
        ordered.push(bucket.shift());
      }
    });
  }

  const ranking = new Map();
  ordered.forEach((item, index) => {
    ranking.set(item.id, ordered.length - index);
  });

  return ranking;
}

function SearchScopeChips({ options, activeScope, onScopeChange }) {
  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        type="button"
        onClick={() => onScopeChange('')}
        className={`rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition ${
          !activeScope
            ? 'border-primary/45 bg-primary/10 text-primary'
            : 'border-ink/10 bg-white/85 text-ink/70 hover:border-primary/45 hover:text-primary'
        }`}
      >
        Весь каталог
      </button>
      {options.map((option) => {
        const token = normalizeSearchText(resolveCategoryToken(option));
        const isActive = token === activeScope;
        return (
          <button
            key={resolveCategoryToken(option)}
            type="button"
            onClick={() => onScopeChange(isActive ? '' : token)}
            className={`rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition ${
              isActive
                ? 'border-primary/45 bg-primary/10 text-primary'
                : 'border-ink/10 bg-white/85 text-ink/70 hover:border-primary/45 hover:text-primary'
            }`}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}

function CategoryCard({ product, fromPath, fromLabel }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = useRef(null);

  const images = useMemo(() => {
    const normalized = normalizeProductImages(product?.images || []);
    if (normalized.length > 0) return normalized;
    const fallback = getPrimaryImageUrl(product);
    return fallback
      ? [{ id: `${product.id}-fallback`, url: fallback, variantId: null, alt: product?.name || '' }]
      : [];
  }, [product]);

  useEffect(() => {
    if (!isHovered || images.length <= 1) return undefined;
    hoverTimerRef.current = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 1700);

    return () => {
      if (hoverTimerRef.current) clearInterval(hoverTimerRef.current);
    };
  }, [isHovered, images.length]);

  useEffect(() => {
    if (activeImageIndex > images.length - 1) {
      setActiveImageIndex(0);
    }
  }, [images.length, activeImageIndex]);

  const currentImage = images[activeImageIndex]?.url || '';
  const price = getProductPrice(product);
  const oldPrice = product?.oldPrice ? moneyToNumber(product.oldPrice) : 0;
  const hasDiscount = oldPrice > price;
  const discount = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const rating = Number(product?.rating || 0);
  const reviewCount = getReviewCount(product);
  const stockCount = getStockCount(product);

  const badges = [
    stockCount > 0 && stockCount <= 3 ? `Мало на складе: ${stockCount}` : '',
    rating >= 4.8 ? 'Хит продаж' : '',
    !oldPrice && rating >= 4.5 ? 'Новинка' : '',
  ].filter(Boolean);

  const attributeLine =
    product?.material
      ? `Материал: ${product.material}`
      : product?.size
      ? `Размер: ${product.size}`
      : product?.color
      ? `Цвет: ${product.color}`
      : 'Подробные характеристики на странице товара';

  return (
    <Link
      to={`/product/${product.id}`}
      state={{ fromPath, fromLabel }}
      className="group block rounded-[24px] border border-ink/10 bg-white/92 p-3 shadow-[0_16px_34px_rgba(43,39,34,0.11)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgba(43,39,34,0.16)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-sand/60">
        <div className="relative pt-[74%]">
          {currentImage ? (
            <img
              src={currentImage}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">Нет фото</div>
          )}
        </div>

        <div className="absolute inset-x-2 top-2 flex flex-wrap items-start gap-2">
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

      {images.length > 1 && (
        <div className="mt-2 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={image.id || `${product.id}-${index}`}
              type="button"
              className={`h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg border ${
                index === activeImageIndex
                  ? 'border-primary/55 ring-2 ring-primary/20'
                  : 'border-ink/15'
              }`}
              onClick={(event) => {
                event.preventDefault();
                setActiveImageIndex(index);
              }}
              aria-label={`Показать изображение ${index + 1}`}
            >
              <img src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{product.name}</p>

        <div className="flex items-center gap-2 text-xs text-muted">
          {rating > 0 ? (
            <>
              <span className="text-primary">★ {rating.toFixed(1)}</span>
              <span>({reviewCount})</span>
            </>
          ) : (
            <span>Нет оценок</span>
          )}
        </div>

        <p className="line-clamp-1 text-xs text-muted">{attributeLine}</p>

        <div className="flex items-end justify-between gap-3 pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-accent">{price.toLocaleString('ru-RU')} ₽</span>
            {hasDiscount && (
              <span className="text-xs text-muted line-through">{oldPrice.toLocaleString('ru-RU')} ₽</span>
            )}
          </div>
          <span className="text-xs text-primary">Открыть →</span>
        </div>
      </div>
    </Link>
  );
}

function CategoryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const searchTerm = query.get('query') || '';
  const searchScope = normalizeSearchText(query.get('scope') || '');
  const searchScopeLabel = query.get('scopeLabel') || '';
  const searchOriginal = query.get('original') || '';
  const brandFilterFromUrl = query.get('brand') || '';

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [sortKey, setSortKey] = useState('bestMatch');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [minRating, setMinRating] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [brandFilter, setBrandFilter] = useState(brandFilterFromUrl);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const resultsRef = useRef(null);

  useEffect(() => {
    setBrandFilter(brandFilterFromUrl);
  }, [brandFilterFromUrl]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));

    getBrands()
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch brands:', err));
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getProducts()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setProducts(list.filter((product) => product?.isActive !== false));
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        if (!isMounted) return;
        setProducts([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [slug, searchTerm, searchScope, brandFilter, priceMin, priceMax, minRating, inStockOnly, onSaleOnly, sortKey, itemsPerPage]);

  useEffect(() => {
    if (slug === 'new') {
      setSortKey('newest');
      return;
    }
    setSortKey('bestMatch');
  }, [slug]);

  useEffect(() => {
    if (!isFilterOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFilterOpen]);

  useEffect(() => {
    if (currentPage <= 1 || !resultsRef.current) return;
    resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage]);

  const categoriesByToken = useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      const token = resolveCategoryToken(category);
      if (!token) return;
      map[token] = category;
      map[String(category.id)] = category;
      map[String(category.slug)] = category;
    });
    return map;
  }, [categories]);

  const categoryNameByToken = useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      const token = normalizeSearchText(resolveCategoryToken(category));
      if (!token) return;
      map[token] = category.name;
      map[normalizeSearchText(String(category.id || ''))] = category.name;
      map[normalizeSearchText(String(category.slug || ''))] = category.name;
    });
    return map;
  }, [categories]);

  const activeCategory =
    categories.find((category) => resolveCategoryToken(category) === slug || String(category.id) === slug) || null;

  const childrenByParent = useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      const parent = String(category?.parentId || '');
      if (!parent) return;
      if (!map[parent]) map[parent] = [];
      map[parent].push(category);
    });

    Object.keys(map).forEach((parent) => {
      map[parent].sort(
        (a, b) =>
          (a.position ?? 0) - (b.position ?? 0) ||
          (a.name || '').localeCompare(b.name || '')
      );
    });

    return map;
  }, [categories]);

  const categoryTokensForListing = useMemo(() => {
    if (!activeCategory) return new Set();
    const tokens = new Set();
    const queue = [activeCategory];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      tokens.add(normalizeSearchText(resolveCategoryToken(current)));
      tokens.add(normalizeSearchText(String(current.id || '')));
      const children = childrenByParent[String(current.id)] || [];
      queue.push(...children);
    }

    return tokens;
  }, [activeCategory, childrenByParent]);

  const searchResults = useMemo(() => {
    if (slug !== 'search') {
      return {
        list: [],
        appliedQuery: '',
        correctionApplied: false,
      };
    }

    const initial = searchProducts(products, searchTerm, {
      categoryNameByToken,
      scopeToken: searchScope,
      allowFuzzy: true,
    });

    if (initial.length > 0) {
      return {
        list: initial,
        appliedQuery: searchTerm,
        correctionApplied: false,
      };
    }

    const dictionary = [
      ...categories.map((category) => category.name),
      ...products.map((product) => product.name),
    ];

    const correction = resolveSearchCorrection(searchTerm, dictionary);
    if (!correction.isCorrected || !correction.correctedQuery) {
      return {
        list: initial,
        appliedQuery: searchTerm,
        correctionApplied: false,
      };
    }

    const correctedResults = searchProducts(products, correction.correctedQuery, {
      categoryNameByToken,
      scopeToken: searchScope,
      allowFuzzy: true,
    });

    return {
      list: correctedResults,
      appliedQuery: correction.correctedQuery,
      correctionApplied: correctedResults.length > 0,
    };
  }, [slug, products, searchTerm, categories, categoryNameByToken, searchScope]);

  const baseProducts = useMemo(() => {
    if (slug === 'search') {
      return searchResults.list;
    }

    if (slug === 'popular' || slug === 'new') {
      return products;
    }

    if (!activeCategory) {
      return products;
    }

    if (categoryTokensForListing.size === 0) {
      return products;
    }

    return products.filter((product) => {
      const token = normalizeSearchText(resolveProductCategoryToken(product));
      return categoryTokensForListing.has(token);
    });
  }, [slug, products, activeCategory, categoryTokensForListing, searchResults.list]);

  const minRatingValue = minRating ? Number(minRating) : 0;

  const priceBounds = useMemo(() => {
    const prices = baseProducts
      .map((product) => getProductPrice(product))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (!prices.length) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [baseProducts]);

  const priceFilter = useMemo(() => {
    const minValue = priceMin !== '' ? Number(priceMin) : null;
    const maxValue = priceMax !== '' ? Number(priceMax) : null;
    let safeMin = Number.isFinite(minValue) ? minValue : null;
    let safeMax = Number.isFinite(maxValue) ? maxValue : null;

    if (safeMin !== null && safeMax !== null && safeMin > safeMax) {
      [safeMin, safeMax] = [safeMax, safeMin];
    }

    return { min: safeMin, max: safeMax };
  }, [priceMin, priceMax]);

  const filteredProducts = useMemo(() => {
    return baseProducts.filter((product) => {
      if (brandFilter) {
        const brandToken = String(resolveBrandToken(product));
        if (!brandToken || brandToken !== brandFilter) {
          return false;
        }
      }

      const productPrice = getProductPrice(product);
      if (priceFilter.min !== null && productPrice < priceFilter.min) return false;
      if (priceFilter.max !== null && productPrice > priceFilter.max) return false;

      if (minRatingValue && Number(product?.rating || 0) < minRatingValue) return false;
      if (inStockOnly && getStockCount(product) <= 0) return false;

      if (onSaleOnly) {
        const oldPrice = product?.oldPrice ? moneyToNumber(product.oldPrice) : 0;
        if (!oldPrice || oldPrice <= productPrice) return false;
      }

      return true;
    });
  }, [baseProducts, brandFilter, priceFilter, minRatingValue, inStockOnly, onSaleOnly]);

  const diversityRank = useMemo(
    () => buildDiversityRanking(filteredProducts),
    [filteredProducts]
  );

  const searchRank = useMemo(() => {
    const rank = new Map();
    searchResults.list.forEach((product, index) => {
      rank.set(product.id, searchResults.list.length - index);
    });
    return rank;
  }, [searchResults.list]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];

    const sorters = {
      bestMatch: (a, b) => {
        const rankA = slug === 'search' ? (searchRank.get(a.id) || 0) : (diversityRank.get(a.id) || 0);
        const rankB = slug === 'search' ? (searchRank.get(b.id) || 0) : (diversityRank.get(b.id) || 0);
        if (rankB !== rankA) return rankB - rankA;

        const ratingDelta = (b?.rating || 0) - (a?.rating || 0);
        if (ratingDelta !== 0) return ratingDelta;

        return getReviewCount(b) - getReviewCount(a);
      },
      newest: (a, b) => String(b.id).localeCompare(String(a.id)),
      priceAsc: (a, b) => getProductPrice(a) - getProductPrice(b),
      priceDesc: (a, b) => getProductPrice(b) - getProductPrice(a),
      rating: (a, b) => {
        const ratingDelta = (b?.rating || 0) - (a?.rating || 0);
        if (ratingDelta !== 0) return ratingDelta;
        return getReviewCount(b) - getReviewCount(a);
      },
      discount: (a, b) => {
        const discountA = (() => {
          const old = a?.oldPrice ? moneyToNumber(a.oldPrice) : 0;
          const current = getProductPrice(a);
          return old > current ? (old - current) / old : 0;
        })();
        const discountB = (() => {
          const old = b?.oldPrice ? moneyToNumber(b.oldPrice) : 0;
          const current = getProductPrice(b);
          return old > current ? (old - current) / old : 0;
        })();
        return discountB - discountA;
      },
    };

    const sorter = sorters[sortKey] || sorters.bestMatch;
    list.sort(sorter);
    return list;
  }, [filteredProducts, sortKey, slug, searchRank, diversityRank]);

  const totalItems = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProducts = sortedProducts.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    if (start > 2) pages.push('...');
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);

    return pages;
  }, [safePage, totalPages]);

  const activeBrand = brands.find((brand) => String(brand.slug || brand.id) === brandFilter);

  const childCategories = activeCategory
    ? categories
        .filter((category) => String(category.parentId || '') === String(activeCategory.id || ''))
        .sort(
          (a, b) =>
            (a.position ?? 0) - (b.position ?? 0) ||
            (a.name || '').localeCompare(b.name || '')
        )
    : [];

  const childCategoryCounts = useMemo(() => {
    if (!childCategories.length) return {};

    const tokens = new Set(
      childCategories.map((category) => normalizeSearchText(resolveCategoryToken(category)))
    );

    return baseProducts.reduce((acc, product) => {
      const token = normalizeSearchText(resolveProductCategoryToken(product));
      if (!tokens.has(token)) return acc;
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});
  }, [childCategories, baseProducts]);

  const activeFilters = [];
  if (brandFilter) {
    activeFilters.push({
      label: `Бренд: ${activeBrand?.name || brandFilter}`,
      onClear: () => {
        setBrandFilter('');
        const params = new URLSearchParams(location.search);
        params.delete('brand');
        navigate(`/category/${slug}?${params.toString()}`);
      },
    });
  }

  if (priceFilter.min !== null || priceFilter.max !== null) {
    const parts = [];
    if (priceFilter.min !== null) parts.push(`от ${formatPrice(priceFilter.min)} ₽`);
    if (priceFilter.max !== null) parts.push(`до ${formatPrice(priceFilter.max)} ₽`);
    activeFilters.push({
      label: `Цена ${parts.join(' ')}`,
      onClear: () => {
        setPriceMin('');
        setPriceMax('');
      },
    });
  }

  if (minRatingValue) {
    activeFilters.push({
      label: `Рейтинг от ${minRatingValue}+`,
      onClear: () => setMinRating(''),
    });
  }

  if (inStockOnly) {
    activeFilters.push({
      label: 'Только в наличии',
      onClear: () => setInStockOnly(false),
    });
  }

  if (onSaleOnly) {
    activeFilters.push({
      label: 'Со скидкой',
      onClear: () => setOnSaleOnly(false),
    });
  }

  const clearAllFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setMinRating('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setBrandFilter('');

    const params = new URLSearchParams(location.search);
    params.delete('brand');
    navigate(`/category/${slug}?${params.toString()}`);
  };

  const updateScope = (nextScope) => {
    const params = new URLSearchParams(location.search);
    if (nextScope) {
      params.set('scope', nextScope);
      const scopeCategory = categories.find(
        (category) => normalizeSearchText(resolveCategoryToken(category)) === nextScope
      );
      if (scopeCategory?.name) {
        params.set('scopeLabel', scopeCategory.name);
      }
    } else {
      params.delete('scope');
      params.delete('scopeLabel');
    }

    navigate(`/category/${slug}?${params.toString()}`);
  };

  const updateBrandFilter = (nextBrand) => {
    setBrandFilter(nextBrand);
    const params = new URLSearchParams(location.search);
    if (nextBrand) params.set('brand', nextBrand);
    else params.delete('brand');
    navigate(`/category/${slug}?${params.toString()}`);
  };

  const formatItemsLabel = (count) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'товар';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара';
    return 'товаров';
  };

  let heading = activeCategory ? activeCategory.name : 'Каталог';
  let headingNote = '';

  if (slug === 'search') {
    heading = 'Результаты поиска';
    headingNote = searchTerm
      ? `По запросу “${searchTerm}”`
      : 'Введите запрос, чтобы увидеть товары.';
  } else if (slug === 'popular') {
    heading = 'Лучшее для дома';
    headingNote = 'Рекомендуем на основе популярности и разнообразия моделей.';
  } else if (slug === 'new') {
    heading = 'Новинки';
    headingNote = 'Свежие поступления из последних коллекций.';
  }

  const sortLabelByKey = {
    bestMatch: 'Лучшее совпадение',
    newest: 'Сначала новые',
    priceAsc: 'Цена: по возрастанию',
    priceDesc: 'Цена: по убыванию',
    rating: 'Рейтинг',
    discount: 'По скидке',
  };

  const topCategories = categories
    .filter((category) => !category.parentId)
    .slice()
    .sort(
      (a, b) =>
        (a.position ?? 0) - (b.position ?? 0) ||
        (a.name || '').localeCompare(b.name || '')
    );

  const searchCorrectionNote = (() => {
    if (slug !== 'search') return '';
    if (searchOriginal && searchTerm && normalizeSearchText(searchOriginal) !== normalizeSearchText(searchTerm)) {
      return `Показываем результаты для “${searchTerm}”. Вы искали: “${searchOriginal}”.`;
    }
    if (searchResults.correctionApplied && searchResults.appliedQuery) {
      return `Показываем результаты для “${searchResults.appliedQuery}”.`;
    }
    return '';
  })();

  const searchScopeTitle = searchScopeLabel ||
    (searchScope
      ? categories.find((category) => normalizeSearchText(resolveCategoryToken(category)) === searchScope)?.name || searchScope
      : '');

  const gridClassName =
    viewMode === 'compact'
      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5';

  const fromPath = `${location.pathname}${location.search}`;

  return (
    <div className="category-page relative overflow-hidden py-8 md:py-10">
      <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4">
        <nav className="text-xs text-muted flex flex-wrap items-center gap-2">
          {location.state?.fromPath ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-primary hover:text-accent"
            >
              ← Назад
            </button>
          ) : null}
          <Link to="/" className="hover:text-primary transition">Главная</Link>
          <span className="text-ink/40">›</span>
          <Link to="/category/popular" className="hover:text-primary transition">Каталог</Link>
          {activeCategory && (
            <>
              <span className="text-ink/40">›</span>
              <span className="text-ink">{activeCategory.name}</span>
            </>
          )}
          {slug === 'search' && (
            <>
              <span className="text-ink/40">›</span>
              <span className="text-ink">Поиск</span>
            </>
          )}
        </nav>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold">{heading}</h1>
            <span className="text-sm text-muted">
              {totalItems} {formatItemsLabel(totalItems)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-ink/10 bg-white/85 px-4 py-2 text-sm"
            >
              <span className="text-ink/65">↕</span>
              <span>Сортировка: {sortLabelByKey[sortKey] || 'Лучшее совпадение'}</span>
            </button>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
              className="min-w-[210px] rounded-2xl border border-ink/10 bg-white/85 px-4 py-2 text-sm"
              aria-label="Сортировка товаров"
            >
              <option value="bestMatch">Лучшее совпадение (рекомендуется)</option>
              <option value="newest">Сначала новые</option>
              <option value="priceAsc">Цена: по возрастанию</option>
              <option value="priceDesc">Цена: по убыванию</option>
              <option value="rating">Рейтинг</option>
              <option value="discount">По скидке</option>
            </select>
          </div>
        </div>

        {headingNote && <p className="mt-2 text-sm text-muted">{headingNote}</p>}
        {searchCorrectionNote && <p className="mt-1 text-sm text-primary">{searchCorrectionNote}</p>}
        {searchScopeTitle && slug === 'search' && (
          <p className="mt-1 text-xs text-muted">Область поиска: {searchScopeTitle}</p>
        )}

        {slug === 'search' && (
          <SearchScopeChips
            options={topCategories}
            activeScope={searchScope}
            onScopeChange={updateScope}
          />
        )}

        {childCategories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {childCategories.map((category) => {
              const token = normalizeSearchText(resolveCategoryToken(category));
              const count = childCategoryCounts[token];
              return (
                <button
                  key={resolveCategoryToken(category)}
                  type="button"
                  className="rounded-2xl border border-ink/10 bg-white/85 px-4 py-2 text-sm hover:border-primary/45 hover:text-primary transition"
                  onClick={() => navigate(`/category/${resolveCategoryToken(category)}`)}
                >
                  {category.name}{count ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 grid gap-3 rounded-[24px] border border-ink/10 bg-white/80 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm">
              <span className="text-xs uppercase tracking-[0.18em] text-muted">Бренд</span>
              <select
                value={brandFilter}
                onChange={(event) => updateBrandFilter(event.target.value)}
                className="mt-1 w-full"
              >
                <option value="">Все бренды</option>
                {brands.map((brand) => (
                  <option key={brand.slug || brand.id} value={brand.slug || brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-xs uppercase tracking-[0.18em] text-muted">Цена от</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder={priceBounds.min ? formatPrice(priceBounds.min) : '0'}
                value={priceMin}
                onChange={(event) => setPriceMin(event.target.value)}
                className="mt-1 w-full"
              />
            </label>

            <label className="text-sm">
              <span className="text-xs uppercase tracking-[0.18em] text-muted">Цена до</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder={priceBounds.max ? formatPrice(priceBounds.max) : '0'}
                value={priceMax}
                onChange={(event) => setPriceMax(event.target.value)}
                className="mt-1 w-full"
              />
            </label>

            <label className="text-sm">
              <span className="text-xs uppercase tracking-[0.18em] text-muted">Рейтинг</span>
              <select
                value={minRating}
                onChange={(event) => setMinRating(event.target.value)}
                className="mt-1 w-full"
              >
                <option value="">Любой</option>
                <option value="4.5">От 4.5</option>
                <option value="4">От 4.0</option>
                <option value="3.5">От 3.5</option>
              </select>
            </label>

            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 text-xs text-ink/80">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                />
                <span>Только в наличии</span>
              </label>
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 text-xs text-ink/80">
                <input
                  type="checkbox"
                  checked={onSaleOnly}
                  onChange={(event) => setOnSaleOnly(event.target.checked)}
                />
                <span>Со скидкой</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="button-gray text-sm"
              onClick={() => setIsFilterOpen(true)}
            >
              Все фильтры
            </button>
            <div className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white/85 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-10 w-10 rounded-xl transition ${
                  viewMode === 'grid' ? 'bg-primary text-white' : 'text-ink/60 hover:text-primary'
                }`}
                aria-label="Крупная сетка"
              >
                ▦
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`h-10 w-10 rounded-xl transition ${
                  viewMode === 'compact' ? 'bg-primary text-white' : 'text-ink/60 hover:text-primary'
                }`}
                aria-label="Компактная сетка"
              >
                ▩
              </button>
            </div>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {activeFilters.map((filter, index) => (
              <button
                key={`${filter.label}-${index}`}
                type="button"
                onClick={filter.onClear}
                className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-ink/10 bg-white/95 px-3 py-1 text-xs text-ink/80 hover:border-primary/45 hover:text-primary"
              >
                {filter.label}
                <span>×</span>
              </button>
            ))}

            {activeFilters.length > 0 && (
              <button
                type="button"
                className="text-xs text-primary whitespace-nowrap"
                onClick={clearAllFilters}
              >
                Очистить всё
              </button>
            )}
          </div>
        )}

        <div ref={resultsRef} className="mt-6">
          {isLoading ? (
            <div className={gridClassName}>
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="rounded-[24px] border border-ink/10 bg-white/90 p-3 shadow-sm"
                >
                  <div className="skeleton shimmer-safe h-[180px] w-full rounded-2xl" />
                  <div className="mt-3 space-y-2">
                    <div className="skeleton shimmer-safe h-4 w-11/12 rounded-full" />
                    <div className="skeleton shimmer-safe h-4 w-2/3 rounded-full" />
                    <div className="skeleton shimmer-safe h-3 w-1/2 rounded-full" />
                    <div className="skeleton shimmer-safe mt-4 h-5 w-1/3 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : totalItems > 0 ? (
            <>
              <div className={gridClassName}>
                {pagedProducts.map((product) => (
                  <CategoryCard
                    key={product.id}
                    product={product}
                    fromPath={fromPath}
                    fromLabel={heading}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="button-gray px-3 py-2 text-sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={safePage === 1}
                    >
                      Назад
                    </button>
                    {visiblePages.map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted">...
                          </span>
                        );
                      }

                      const isActive = page === safePage;
                      return (
                        <button
                          key={page}
                          type="button"
                          className={`h-10 w-10 rounded-full text-sm transition ${
                            isActive
                              ? 'bg-primary text-white shadow-sm'
                              : 'border border-ink/10 bg-white/90 hover:border-primary/45 hover:text-primary'
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="button-gray px-3 py-2 text-sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={safePage === totalPages}
                    >
                      Вперёд
                    </button>
                  </div>
                  <p className="text-xs text-muted">
                    Страница {safePage} из {totalPages}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="soft-card p-8 text-center">
              <p className="text-lg font-semibold mb-2">Ничего не нашли</p>
              <p className="text-sm text-muted mb-4">
                Попробуйте изменить сортировку, снять фильтры или расширить область поиска.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {activeFilters.length > 0 && (
                  <button type="button" className="button-gray" onClick={clearAllFilters}>
                    Сбросить фильтры
                  </button>
                )}
                <button type="button" className="button" onClick={() => setSortKey('bestMatch')}>
                  Показать рекомендации
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFilterOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsFilterOpen(false)}
            aria-label="Закрыть фильтры"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white/97 p-5 shadow-2xl slide-up-panel">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Фильтры</p>
                <p className="text-base font-semibold">Уточните выбор</p>
              </div>
              <button
                type="button"
                className="button-ghost text-xs"
                onClick={() => setIsFilterOpen(false)}
              >
                Закрыть
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-[0.18em] text-muted">Бренд</span>
                <select
                  value={brandFilter}
                  onChange={(event) => updateBrandFilter(event.target.value)}
                  className="mt-1 w-full"
                >
                  <option value="">Все бренды</option>
                  {brands.map((brand) => (
                    <option key={brand.slug || brand.id} value={brand.slug || brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted">Цена от</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={priceMin}
                    onChange={(event) => setPriceMin(event.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted">Цена до</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={priceMax}
                    onChange={(event) => setPriceMax(event.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="text-xs uppercase tracking-[0.18em] text-muted">Рейтинг</span>
                <select
                  value={minRating}
                  onChange={(event) => setMinRating(event.target.value)}
                  className="mt-1 w-full"
                >
                  <option value="">Любой</option>
                  <option value="4.5">От 4.5</option>
                  <option value="4">От 4.0</option>
                  <option value="3.5">От 3.5</option>
                </select>
              </label>

              <label className="inline-flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 text-sm">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                />
                <span>Только в наличии</span>
              </label>

              <label className="inline-flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 text-sm">
                <input
                  type="checkbox"
                  checked={onSaleOnly}
                  onChange={(event) => setOnSaleOnly(event.target.checked)}
                />
                <span>Со скидкой</span>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="button-gray" onClick={clearAllFilters}>
                Сбросить
              </button>
              <button type="button" className="button" onClick={() => setIsFilterOpen(false)}>
                Показать товары
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryPage;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBrands, getCategories, getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import { formatPrice, getProductPrice, moneyToNumber } from '../utils/product';
import {
  normalizeSearchText,
  resolveSearchCorrection,
  searchProducts,
} from '../utils/search';

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function resolveCategoryToken(category) {
  if (!category) return '';
  return String(category.slug || category.id || category.name || '');
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
  return Number(product?.reviewCount || product?.reviewsCount || product?.reviews_count || 0);
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

const sortOptions = [
  { value: 'bestMatch', label: 'Лучшее совпадение' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'priceAsc', label: 'Цена: по возрастанию' },
  { value: 'priceDesc', label: 'Цена: по убыванию' },
  { value: 'rating', label: 'Рейтинг' },
  { value: 'discount', label: 'По скидке' },
];

function CataloguePage() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [scopeToken, setScopeToken] = useState('');
  const [sortKey, setSortKey] = useState('bestMatch');
  const [brandFilter, setBrandFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [minRating, setMinRating] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const resultsRef = useRef(null);
  const itemsPerPage = 12;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([getCategories(), getBrands(), getProducts()])
      .then(([categoriesResponse, brandsResponse, productsResponse]) => {
        if (!isMounted) return;
        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
        setBrands(Array.isArray(brandsResponse) ? brandsResponse : []);
        const list = Array.isArray(productsResponse) ? productsResponse : [];
        setProducts(list.filter((product) => product?.isActive !== false));
      })
      .catch((error) => {
        console.error('Failed to fetch catalogue data:', error);
        if (!isMounted) return;
        setCategories([]);
        setBrands([]);
        setProducts([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, scopeToken, sortKey, brandFilter, priceMin, priceMax, minRating, inStockOnly, onSaleOnly]);

  useEffect(() => {
    if (!isFilterOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFilterOpen]);

  useEffect(() => {
    if (currentPage <= 1 || !resultsRef.current) return;
    resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage]);

  const topCategories = useMemo(() => {
    return categories
      .filter((category) => !category.parentId)
      .slice()
      .sort(
        (a, b) =>
          (a.position ?? 0) - (b.position ?? 0) ||
          (a.name || '').localeCompare(b.name || '')
      );
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

  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
      return {
        list: products,
        correctionApplied: false,
        appliedQuery: '',
      };
    }

    const direct = searchProducts(products, normalizedQuery, {
      categoryNameByToken,
      scopeToken,
      allowFuzzy: true,
    });
    if (direct.length > 0) {
      return {
        list: direct,
        correctionApplied: false,
        appliedQuery: normalizedQuery,
      };
    }

    const dictionary = [
      ...categories.map((category) => category.name),
      ...products.map((product) => product.name),
    ];
    const correction = resolveSearchCorrection(normalizedQuery, dictionary);

    if (!correction.isCorrected || !correction.correctedQuery) {
      return {
        list: direct,
        correctionApplied: false,
        appliedQuery: normalizedQuery,
      };
    }

    const corrected = searchProducts(products, correction.correctedQuery, {
      categoryNameByToken,
      scopeToken,
      allowFuzzy: true,
    });

    return {
      list: corrected,
      correctionApplied: corrected.length > 0,
      appliedQuery: correction.correctedQuery,
    };
  }, [query, products, categories, categoryNameByToken, scopeToken]);

  const priceBounds = useMemo(() => {
    const prices = searchResults.list
      .map((product) => getProductPrice(product))
      .filter((price) => Number.isFinite(price) && price > 0);
    if (!prices.length) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [searchResults.list]);

  const minRatingValue = minRating ? Number(minRating) : 0;

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
    return searchResults.list.filter((product) => {
      if (brandFilter) {
        const token = String(resolveBrandToken(product));
        if (!token || token !== brandFilter) return false;
      }

      const price = getProductPrice(product);
      if (priceFilter.min !== null && price < priceFilter.min) return false;
      if (priceFilter.max !== null && price > priceFilter.max) return false;

      if (minRatingValue && Number(product?.rating || 0) < minRatingValue) return false;
      if (inStockOnly && getStockCount(product) <= 0) return false;

      if (onSaleOnly) {
        const oldPrice = product?.oldPrice ? moneyToNumber(product.oldPrice) : 0;
        if (!oldPrice || oldPrice <= price) return false;
      }

      return true;
    });
  }, [searchResults.list, brandFilter, priceFilter, minRatingValue, inStockOnly, onSaleOnly]);

  const diversityRank = useMemo(
    () => buildDiversityRanking(filteredProducts),
    [filteredProducts]
  );

  const queryRank = useMemo(() => {
    const rank = new Map();
    searchResults.list.forEach((product, index) => {
      rank.set(product.id, searchResults.list.length - index);
    });
    return rank;
  }, [searchResults.list]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    const hasQuery = Boolean(normalizeSearchText(query));

    const sorters = {
      bestMatch: (a, b) => {
        const rankA = hasQuery ? (queryRank.get(a.id) || 0) : (diversityRank.get(a.id) || 0);
        const rankB = hasQuery ? (queryRank.get(b.id) || 0) : (diversityRank.get(b.id) || 0);
        if (rankB !== rankA) return rankB - rankA;

        const ratingDelta = (b?.rating || 0) - (a?.rating || 0);
        if (ratingDelta !== 0) return ratingDelta;
        return getReviewCount(b) - getReviewCount(a);
      },
      newest: (a, b) => String(b.id).localeCompare(String(a.id)),
      priceAsc: (a, b) => getProductPrice(a) - getProductPrice(b),
      priceDesc: (a, b) => getProductPrice(b) - getProductPrice(a),
      rating: (a, b) => {
        const delta = (b?.rating || 0) - (a?.rating || 0);
        if (delta !== 0) return delta;
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
  }, [filteredProducts, sortKey, diversityRank, queryRank, query]);

  const totalItems = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProducts = sortedProducts.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

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
  const activeSortLabel = sortOptions.find((item) => item.value === sortKey)?.label || 'Лучшее совпадение';
  const scopeCategoryLabel = scopeToken
    ? categories.find((category) => normalizeSearchText(resolveCategoryToken(category)) === scopeToken)?.name || scopeToken
    : '';

  const activeFilters = [];

  if (brandFilter) {
    activeFilters.push({
      label: `Бренд: ${activeBrand?.name || brandFilter}`,
      onClear: () => setBrandFilter(''),
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
      label: `Рейтинг от ${minRatingValue}`,
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
    setBrandFilter('');
    setPriceMin('');
    setPriceMax('');
    setMinRating('');
    setInStockOnly(false);
    setOnSaleOnly(false);
  };

  const searchCorrectionNote = (() => {
    const normalized = normalizeSearchText(query);
    if (!normalized) return '';
    if (searchResults.correctionApplied && searchResults.appliedQuery) {
      return `Показываем результаты для “${searchResults.appliedQuery}”. Ваш запрос: “${normalized}”.`;
    }
    return '';
  })();

  const hasQuery = Boolean(normalizeSearchText(query));

  return (
    <div className="catalogue-page relative overflow-hidden py-8 md:py-10">
      <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link to="/" className="transition hover:text-primary">Главная</Link>
          <span className="text-ink/40">›</span>
          <span className="text-ink">Каталог</span>
        </nav>

        <div className="mt-4 grid gap-3 rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_20px_46px_rgba(43,39,34,0.1)] md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Каталог товаров</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl md:text-4xl">
              Подбор текстиля без лишних кликов
            </h1>
            <p className="mt-2 text-sm text-muted">
              Сначала оцените ассортимент, затем уточняйте фильтрами. По умолчанию показываем разные модели, а не дубли.
            </p>
          </div>
          <Link to="/category/popular" className="button-gray w-full justify-center md:w-auto">
            Бестселлеры
          </Link>
        </div>

        <section className="mt-5 rounded-[24px] border border-ink/10 bg-white/90 p-4 shadow-[0_16px_32px_rgba(43,39,34,0.08)] md:p-5">
          <label htmlFor="catalog-search" className="text-xs uppercase tracking-[0.2em] text-muted">
            Поиск по каталогу
          </label>
          <div className="relative mt-2">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
            <input
              id="catalog-search"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Например: сатин 200x220, плед, подушки"
              className="w-full rounded-2xl border border-ink/10 bg-white py-3 pl-11 pr-12 text-sm shadow-[0_8px_20px_rgba(43,39,34,0.07)] focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl text-ink/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                aria-label="Очистить поиск"
              >
                ×
              </button>
            )}
          </div>

          {searchCorrectionNote && (
            <p className="mt-2 text-xs text-primary">{searchCorrectionNote}</p>
          )}
          {scopeCategoryLabel && (
            <p className="mt-2 text-xs text-muted">Область поиска: {scopeCategoryLabel}</p>
          )}

          <div className="mt-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Область поиска</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => setScopeToken('')}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition ${
                  !scopeToken
                    ? 'border-primary/45 bg-primary/10 text-primary'
                    : 'border-ink/10 bg-white/85 text-ink/70 hover:border-primary/45 hover:text-primary'
                }`}
              >
                Весь каталог
              </button>
              {topCategories.slice(0, 10).map((category) => {
                const token = normalizeSearchText(resolveCategoryToken(category));
                const isActive = scopeToken === token;
                return (
                  <button
                    key={resolveCategoryToken(category)}
                    type="button"
                    onClick={() => setScopeToken(isActive ? '' : token)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition ${
                      isActive
                        ? 'border-primary/45 bg-primary/10 text-primary'
                        : 'border-ink/10 bg-white/85 text-ink/70 hover:border-primary/45 hover:text-primary'
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-ink/10 bg-white/88 p-4 shadow-[0_14px_30px_rgba(43,39,34,0.08)]">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="inline-grid min-h-[44px] grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-ink/10 bg-white/90 px-3 text-sm shadow-[0_8px_18px_rgba(43,39,34,0.06)]">
              <span className="text-ink/55">↕</span>
              <label htmlFor="catalog-sort" className="sr-only">Сортировка товаров</label>
              <select
                id="catalog-sort"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value)}
                className="control-inline w-full pr-6 text-sm font-medium text-ink"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="button-gray w-full justify-center text-sm lg:hidden"
              onClick={() => setIsFilterOpen(true)}
            >
              Все фильтры{activeFilters.length > 0 ? ` (${activeFilters.length})` : ''}
            </button>
          </div>

          <div className="mt-2 text-xs text-muted">
            Сортировка: <span className="font-semibold text-ink"> {activeSortLabel}</span>
            {sortKey === 'bestMatch' && (
              <span className="ml-2">Рекомендуем на основе релевантности, популярности и разнообразия товаров.</span>
            )}
          </div>

          <div className="mt-4 hidden gap-3 lg:grid xl:grid-cols-4">
            <label className="text-sm">
              <span className="text-xs uppercase tracking-[0.18em] text-muted">Бренд</span>
              <select
                value={brandFilter}
                onChange={(event) => setBrandFilter(event.target.value)}
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

            <div className="text-sm">
              <span className="text-xs uppercase tracking-[0.18em] text-muted">Цена, ₽</span>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={priceMin}
                  onChange={(event) => setPriceMin(event.target.value)}
                  placeholder={priceBounds.min ? `От ${formatPrice(priceBounds.min)}` : 'От 0'}
                  className="w-full"
                />
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={priceMax}
                  onChange={(event) => setPriceMax(event.target.value)}
                  placeholder={priceBounds.max ? `До ${formatPrice(priceBounds.max)}` : 'До 0'}
                  className="w-full"
                />
              </div>
            </div>

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

            <div className="text-sm">
              <span className="text-xs uppercase tracking-[0.18em] text-muted">Быстрые фильтры</span>
              <div className="mt-1 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setInStockOnly((prev) => !prev)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-left text-sm transition ${
                    inStockOnly
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-ink/10 bg-white text-ink/75 hover:border-primary/35 hover:text-primary'
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      inStockOnly ? 'border-primary/45 bg-primary/20' : 'border-ink/20 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {inStockOnly ? '✓' : ''}
                  </span>
                  <span>Только в наличии</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnSaleOnly((prev) => !prev)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-left text-sm transition ${
                    onSaleOnly
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-ink/10 bg-white text-ink/75 hover:border-primary/35 hover:text-primary'
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      onSaleOnly ? 'border-primary/45 bg-primary/20' : 'border-ink/20 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {onSaleOnly ? '✓' : ''}
                  </span>
                  <span>Со скидкой</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {activeFilters.length > 0 && (
          <section className="mt-4 grid gap-2 rounded-2xl border border-ink/10 bg-white/90 p-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Применено</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {activeFilters.map((filter, index) => (
                <button
                  key={`${filter.label}-${index}`}
                  type="button"
                  onClick={filter.onClear}
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/15"
                >
                  {filter.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="text-left text-xs text-primary hover:text-accent md:text-right"
              onClick={clearAllFilters}
            >
              Очистить всё
            </button>
          </section>
        )}

        <section ref={resultsRef} className="mt-6">
          <div className="mb-3 text-sm text-muted">
            {loading ? 'Загружаем каталог…' : `${totalItems} товаров в выдаче`}
            {hasQuery ? ` · Запрос: “${normalizeSearchText(query)}”` : ''}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <div
                  key={`catalog-skeleton-${index}`}
                  className="rounded-[24px] border border-ink/10 bg-white/90 p-3 shadow-sm"
                >
                  <div className="skeleton shimmer-safe h-[190px] w-full rounded-2xl" />
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pagedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
                  <p className="text-xs text-muted">Страница {safePage} из {totalPages}</p>
                </div>
              )}
            </>
          ) : (
            <div className="soft-card p-8 text-center">
              <p className="mb-2 text-lg font-semibold">Ничего не найдено</p>
              <p className="mb-4 text-sm text-muted">
                Попробуйте расширить область поиска или снять часть фильтров.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {activeFilters.length > 0 && (
                  <button type="button" className="button-gray" onClick={clearAllFilters}>
                    Сбросить фильтры
                  </button>
                )}
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setQuery('');
                    setScopeToken('');
                  }}
                >
                  Показать весь каталог
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsFilterOpen(false)}
            aria-label="Закрыть фильтры"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white/98 p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-2xl slide-up-panel">
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Фильтры каталога</p>
                <p className="text-base font-semibold">Уточните выбор</p>
              </div>
              <button
                type="button"
                className="button-ghost min-h-[44px] text-xs"
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
                  onChange={(event) => setBrandFilter(event.target.value)}
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

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setInStockOnly((prev) => !prev)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-left text-sm transition ${
                    inStockOnly
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-ink/10 bg-white text-ink/75'
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      inStockOnly ? 'border-primary/45 bg-primary/20' : 'border-ink/20 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {inStockOnly ? '✓' : ''}
                  </span>
                  <span>Только в наличии</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnSaleOnly((prev) => !prev)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-left text-sm transition ${
                    onSaleOnly
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-ink/10 bg-white text-ink/75'
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      onSaleOnly ? 'border-primary/45 bg-primary/20' : 'border-ink/20 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {onSaleOnly ? '✓' : ''}
                  </span>
                  <span>Со скидкой</span>
                </button>
              </div>
            </div>

            <div className={`mt-4 grid gap-2 ${activeFilters.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {activeFilters.length > 0 && (
                <button type="button" className="button-gray min-h-[44px]" onClick={clearAllFilters}>
                  Сбросить всё
                </button>
              )}
              <button type="button" className="button min-h-[44px]" onClick={() => setIsFilterOpen(false)}>
                Показать товары
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CataloguePage;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { getProducts, getCategories, getBrands } from '../api';
import {
  getProductPrice,
  moneyToNumber,
  formatPrice,
  getPrimaryImageUrl,
  normalizeProductImages
} from '../utils/product';

function CategoryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const searchTerm = query.get('query') || '';
  const brandFilter = query.get('brand') || '';
  const resultsRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [sortKey, setSortKey] = useState('popular');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [minRating, setMinRating] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeBrand = brands.find((b) => (b.slug || b.id) === brandFilter);
  const activeCategory = categories.find((c) => c.slug === slug || c.id === slug);
  const childCategories = activeCategory
    ? categories
        .filter((c) => c.parentId === activeCategory.id)
        .sort(
          (a, b) =>
            (a.position ?? 0) - (b.position ?? 0) || (a.name || '').localeCompare(b.name || '')
        )
    : [];

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
    getBrands()
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch brands:', err));
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        if (slug === 'search') {
          const all = await getProducts();
          const list = Array.isArray(all) ? all : [];
          const termLower = searchTerm.toLowerCase();
          setProducts(list.filter((p) => (p.name || '').toLowerCase().includes(termLower)));
        } else if (slug === 'popular') {
          const all = await getProducts();
          const list = Array.isArray(all) ? all : [];
          setProducts(list);
        } else if (slug === 'new') {
          const all = await getProducts();
          const list = Array.isArray(all) ? all : [];
          setProducts(list);
        } else if (slug === 'collections') {
          setProducts([]);
        } else {
          const params = brandFilter ? { category: slug, brand: brandFilter } : { category: slug };
          const list = await getProducts(params);
          setProducts(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      }
    }
    fetchData();
  }, [slug, searchTerm, brandFilter]);

  useEffect(() => {
    if (slug === 'new') {
      setSortKey('newest');
    } else {
      setSortKey('popular');
    }
  }, [slug]);

  useEffect(() => {
    setCurrentPage(1);
  }, [slug, searchTerm, brandFilter, priceMin, priceMax, minRating, inStockOnly, onSaleOnly, itemsPerPage]);

  useEffect(() => {
    if (currentPage > 1 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  useEffect(() => {
    if (!isFilterOpen) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isFilterOpen]);

  const resolveBrandToken = (product) => {
    if (!product) return '';
    if (typeof product.brand === 'string') return product.brand;
    if (product.brand && typeof product.brand === 'object') {
      return product.brand.slug || product.brand.id || product.brand.name || '';
    }
    return product.brandSlug || product.brandId || product.brand_id || '';
  };

  const resolveCategoryToken = (product) => {
    if (!product) return '';
    const categoryValue =
      product?.category ||
      product?.categoryId ||
      product?.category_id ||
      product?.categorySlug ||
      product?.category_slug ||
      product?.category?.id ||
      product?.category?.slug ||
      product?.category?.name;
    const categoryKey =
      typeof categoryValue === 'string'
        ? categoryValue
        : categoryValue?.id || categoryValue?.slug || categoryValue?.name || '';
    return categoryKey ? String(categoryKey) : '';
  };

  const getStockCount = (product) => {
    if (!product) return 0;
    if (product.stock !== undefined || product.stockQuantity !== undefined) {
      return Number(product.stock ?? product.stockQuantity ?? 0);
    }
    const variants = Array.isArray(product.variants) ? product.variants : Array.from(product.variants || []);
    return variants.reduce(
      (sum, variant) => sum + Number(variant?.stock ?? variant?.stockQuantity ?? 0),
      0
    );
  };

  const priceBounds = useMemo(() => {
    const prices = products
      .map((product) => getProductPrice(product))
      .filter((price) => Number.isFinite(price) && price > 0);
    if (!prices.length) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [products]);

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

  const priceRangeVisual = useMemo(() => {
    if (priceBounds.max <= priceBounds.min) return { left: 0, right: 0 };
    const range = priceBounds.max - priceBounds.min;
    const minValue = priceFilter.min ?? priceBounds.min;
    const maxValue = priceFilter.max ?? priceBounds.max;
    const left = Math.min(100, Math.max(0, ((minValue - priceBounds.min) / range) * 100));
    const right = Math.min(100, Math.max(0, ((priceBounds.max - maxValue) / range) * 100));
    return { left, right };
  }, [priceBounds, priceFilter]);

  const minRatingValue = minRating ? Number(minRating) : 0;

  const childCategoryCounts = useMemo(() => {
    if (!childCategories.length) return {};
    const childKeys = new Set(
      childCategories.map((cat) => String(cat.slug || cat.id || cat.name || ''))
    );
    return products.reduce((acc, product) => {
      const token = resolveCategoryToken(product);
      if (!token || !childKeys.has(token)) return acc;
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});
  }, [childCategories, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (brandFilter) {
        const brandToken = resolveBrandToken(product);
        if (!brandToken || String(brandToken) !== String(brandFilter)) return false;
      }
      if (priceFilter.min !== null && getProductPrice(product) < priceFilter.min) return false;
      if (priceFilter.max !== null && getProductPrice(product) > priceFilter.max) return false;
      if (minRatingValue && (product.rating || 0) < minRatingValue) return false;
      if (inStockOnly && getStockCount(product) <= 0) return false;
      if (onSaleOnly) {
        const currentPrice = getProductPrice(product);
        const oldPrice = product?.oldPrice ? moneyToNumber(product.oldPrice) : 0;
        if (!oldPrice || oldPrice <= currentPrice) return false;
      }
      return true;
    });
  }, [products, brandFilter, priceFilter, minRatingValue, inStockOnly, onSaleOnly]);

  const sortFunctions = {
    popular: (a, b) => (b.rating || 0) - (a.rating || 0),
    newest: (a, b) => String(b.id).localeCompare(String(a.id)),
    cheap: (a, b) => getProductPrice(a) - getProductPrice(b),
    expensive: (a, b) => getProductPrice(b) - getProductPrice(a),
    discount: (a, b) => {
      const priceA = getProductPrice(a);
      const priceB = getProductPrice(b);
      const oldA = a?.oldPrice ? moneyToNumber(a.oldPrice) : 0;
      const oldB = b?.oldPrice ? moneyToNumber(b.oldPrice) : 0;
      const discountA = oldA ? (oldA - priceA) / oldA : 0;
      const discountB = oldB ? (oldB - priceB) / oldB : 0;
      return discountB - discountA;
    }
  };

  const sortedProducts = useMemo(() => {
    const sorter = sortFunctions[sortKey] || sortFunctions.popular;
    return [...filteredProducts].sort(sorter);
  }, [filteredProducts, sortKey]);

  const totalItems = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProducts = sortedProducts.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    const pages = [1];
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  }, [safePage, totalPages]);

  const handleBrandFilterChange = (brandSlug) => {
    const params = new URLSearchParams(location.search);
    if (brandSlug) params.set('brand', brandSlug);
    else params.delete('brand');
    navigate(`/category/${slug}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setMinRating('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    if (brandFilter) handleBrandFilterChange('');
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
      : 'Введите поисковый запрос, чтобы увидеть товары.';
  } else if (slug === 'popular') {
    heading = 'Популярные товары';
  } else if (slug === 'new') {
    heading = 'Новинки';
  } else if (slug === 'collections') {
    heading = 'Коллекции';
  }

  const activeFilters = [];
  if (brandFilter) {
    activeFilters.push({
      label: `Бренд: ${activeBrand?.name || brandFilter}`,
      onClear: () => handleBrandFilterChange('')
    });
  }
  if (priceFilter.min !== null || priceFilter.max !== null) {
    const labelParts = [];
    if (priceFilter.min !== null) labelParts.push(`от ${formatPrice(priceFilter.min)} ₽`);
    if (priceFilter.max !== null) labelParts.push(`до ${formatPrice(priceFilter.max)} ₽`);
    activeFilters.push({
      label: `Цена ${labelParts.join(' ')}`.trim(),
      onClear: () => {
        setPriceMin('');
        setPriceMax('');
      }
    });
  }
  if (minRatingValue) {
    activeFilters.push({
      label: `Рейтинг от ${minRatingValue}+`,
      onClear: () => setMinRating('')
    });
  }
  if (inStockOnly) {
    activeFilters.push({
      label: 'В наличии',
      onClear: () => setInStockOnly(false)
    });
  }
  if (onSaleOnly) {
    activeFilters.push({
      label: 'Со скидкой',
      onClear: () => setOnSaleOnly(false)
    });
  }

  const ratingOptions = [4.5, 4, 3.5, 3];
  const perPageOptions = [8, 12, 16, 24];
  const isBaseEmpty = products.length === 0;
  const emptyTitle = isBaseEmpty ? 'Пока нет товаров' : 'Ничего не нашли';
  const emptyDescription = isBaseEmpty
    ? 'Мы уже готовим новые позиции. Попробуйте заглянуть позже.'
    : 'Попробуйте изменить фильтры или выбрать другую категорию.';

  const gridClassName =
    viewMode === 'compact'
      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

  const FilterContent = ({ showHeader, showFooter }) => (
    <div className="space-y-5">
      {showHeader && (
        <div className="flex items-start justify-between gap-3 pb-5 border-b border-ink/10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted">Фильтры</p>
            <p className="text-sm font-semibold">Настройте подборку под себя</p>
          </div>
          <button
            type="button"
            className="text-xs text-primary hover:text-accent transition"
            onClick={clearAllFilters}
          >
            Сбросить
          </button>
        </div>
      )}

      <div className="divide-y divide-ink/10">
        {childCategories.length > 0 && (
          <div className="space-y-3 py-5 first:pt-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Подкатегории</p>
            <div className="flex flex-wrap gap-2">
              {childCategories.map((cat) => (
                <button
                  key={cat.slug || cat.id}
                  type="button"
                  className="rounded-full border border-ink/10 bg-white/90 px-3 py-1.5 text-xs hover:border-primary/50 hover:text-primary transition"
                  onClick={() => navigate(`/category/${cat.slug || cat.id}`)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 py-5 first:pt-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Бренд</p>
          <select
            id="brandFilter"
            value={brandFilter}
            onChange={(e) => handleBrandFilterChange(e.target.value)}
            className="w-full text-sm"
          >
            <option value="">Все бренды</option>
            {brands.length === 0 && <option disabled>Бренды появятся позже</option>}
            {brands.map((brand) => (
              <option key={brand.slug || brand.id} value={brand.slug || brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 py-5 first:pt-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Цена</p>
            <span className="text-[11px] text-muted">
              {priceBounds.max > 0
                ? `${formatPrice(priceBounds.min)} — ${formatPrice(priceBounds.max)} ₽`
                : 'Нет данных'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="priceMin" className="text-[11px] text-muted">
                От
              </label>
              <input
                id="priceMin"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder={priceBounds.min ? formatPrice(priceBounds.min) : '0'}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="priceMax" className="text-[11px] text-muted">
                До
              </label>
              <input
                id="priceMax"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder={priceBounds.max ? formatPrice(priceBounds.max) : '0'}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
          </div>
          <div className="relative mt-2 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
            <div
              className="absolute inset-y-0 rounded-full bg-primary/60"
              style={{ left: `${priceRangeVisual.left}%`, right: `${priceRangeVisual.right}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted">
            <span>{priceBounds.min ? `${formatPrice(priceBounds.min)} ₽` : '0 ₽'}</span>
            <span>{priceBounds.max ? `${formatPrice(priceBounds.max)} ₽` : '0 ₽'}</span>
          </div>
        </div>

        <div className="space-y-3 py-5 first:pt-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Рейтинг</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className={`rounded-full border px-3 py-1.5 text-[11px] text-center whitespace-nowrap transition ${
                minRating === '' ? 'border-primary/60 bg-primary/10 text-primary' : 'border-ink/10 bg-white/90'
              }`}
              onClick={() => setMinRating('')}
            >
              Любой
            </button>
            {ratingOptions.map((rating) => {
              const isActive = Number(minRating) === rating;
              return (
                <button
                  key={rating}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-[11px] text-center whitespace-nowrap transition ${
                    isActive ? 'border-primary/60 bg-primary/10 text-primary' : 'border-ink/10 bg-white/90'
                  }`}
                  onClick={() => setMinRating(isActive ? '' : String(rating))}
                >
                  ★ {rating}+
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 py-5 first:pt-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Наличие</p>
          <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            Только в наличии
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={onSaleOnly}
              onChange={(e) => setOnSaleOnly(e.target.checked)}
            />
            Со скидкой
          </label>
        </div>
      </div>

      {showFooter && (
        <div className="pt-4 border-t border-ink/10 flex gap-2">
          <button type="button" className="button-gray w-full" onClick={clearAllFilters}>
            Сбросить
          </button>
          <button type="button" className="button w-full" onClick={() => setIsFilterOpen(false)}>
            Готово
          </button>
        </div>
      )}
    </div>
  );

  const FilterPill = ({ label, isActive, children }) => (
    <details className="relative">
      <summary
        className={`list-none inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition cursor-pointer [&::-webkit-details-marker]:hidden ${
          isActive
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-ink/10 bg-white/90 text-ink'
        }`}
      >
        <span>{label}</span>
        <span className="text-xs">▾</span>
      </summary>
      <div className="absolute left-0 mt-2 w-72 max-w-[90vw] rounded-2xl border border-ink/10 bg-white/95 p-4 shadow-xl z-20">
        {children}
      </div>
    </details>
  );

  const CatalogProductCard = ({ product }) => {
    const imageUrl = getPrimaryImageUrl(product);
    const images = normalizeProductImages(product?.images || []);
    const price = getProductPrice(product);
    const oldPrice = product?.oldPrice ? moneyToNumber(product.oldPrice) : null;
    const hasDiscount = oldPrice && oldPrice > price;
    const discount = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
    const badgeText =
      product?.badge || product?.season || product?.collection || (discount ? `-${discount}%` : 'Новинка');
    const cashback = price ? Math.max(50, Math.round(price * 0.05)) : 0;
    const dotCount = Math.min(images.length, 4);

    return (
      <Link to={`/product/${product.id}`} className="group block">
        <div className="relative rounded-[28px] border border-ink/10 bg-white overflow-hidden shadow-sm">
          <div className="relative pt-[72%] bg-secondary">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                Нет фото
              </div>
            )}
          </div>
          <span className="absolute bottom-3 left-3 rounded-md bg-primary text-white text-xs px-2.5 py-1 shadow">
            {badgeText}
          </span>
        </div>

        {dotCount > 1 && (
          <div className="mt-2 flex items-center justify-center gap-1">
            {Array.from({ length: dotCount }).map((_, idx) => (
              <span
                key={`${product.id}-dot-${idx}`}
                className={`h-1.5 w-1.5 rounded-full ${
                  idx === 0 ? 'bg-primary' : 'bg-ink/20'
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-ink leading-snug">{product.name}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-primary font-semibold text-base">
                {price.toLocaleString('ru-RU')} ₽
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted line-through">
                  {oldPrice.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
            {cashback > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/90 px-2.5 py-1 text-[11px] text-muted whitespace-nowrap">
                Кешбэк до {cashback.toLocaleString('ru-RU')}
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-ink/10 text-[10px]">
                  i
                </span>
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="category-page relative overflow-hidden py-10">
      <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="container mx-auto px-4">
        <nav className="text-xs text-muted flex flex-wrap items-center gap-2">
          <Link to="/" className="hover:text-primary transition">
            Главная
          </Link>
          <span className="text-ink/40">›</span>
          <Link to="/category/popular" className="hover:text-primary transition">
            Каталог
          </Link>
          <span className="text-ink/40">›</span>
          <span className="text-ink">{heading}</span>
        </nav>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold">{heading}</h1>
            <span className="text-sm text-muted">
              {totalItems} {formatItemsLabel(totalItems)}
            </span>
          </div>
          <Link
            to="/info/production"
            className="text-sm text-primary inline-flex items-center gap-2"
          >
            Подробнее о тканях постельного белья
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 text-[10px]">
              i
            </span>
          </Link>
        </div>

        {headingNote && (
          <p className="text-sm text-muted mt-2">{headingNote}</p>
        )}

        {childCategories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {childCategories.map((cat) => {
              const key = String(cat.slug || cat.id || cat.name || '');
              const count = childCategoryCounts[key];
              return (
                <button
                  key={key}
                  type="button"
                  className="rounded-full border border-ink/10 bg-white/90 px-4 py-2 text-sm hover:border-primary/50 hover:text-primary transition"
                  onClick={() => navigate(`/category/${cat.slug || cat.id}`)}
                >
                  {cat.name}
                  {count ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 border-y border-ink/10 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill label="Бренд" isActive={Boolean(brandFilter)}>
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Бренд</p>
                  <select
                    value={brandFilter}
                    onChange={(e) => handleBrandFilterChange(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Все бренды</option>
                    {brands.length === 0 && <option disabled>Бренды появятся позже</option>}
                    {brands.map((brand) => (
                      <option key={brand.slug || brand.id} value={brand.slug || brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </FilterPill>

              <FilterPill
                label="Цена"
                isActive={priceFilter.min !== null || priceFilter.max !== null}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Цена</p>
                    <span className="text-[11px] text-muted">
                      {priceBounds.max > 0
                        ? `${formatPrice(priceBounds.min)} — ${formatPrice(priceBounds.max)} ₽`
                        : 'Нет данных'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="priceMinInline" className="text-[11px] text-muted">
                        От
                      </label>
                      <input
                        id="priceMinInline"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder={priceBounds.min ? formatPrice(priceBounds.min) : '0'}
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="priceMaxInline" className="text-[11px] text-muted">
                        До
                      </label>
                      <input
                        id="priceMaxInline"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder={priceBounds.max ? formatPrice(priceBounds.max) : '0'}
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="relative mt-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                    <div
                      className="absolute inset-y-0 rounded-full bg-primary/60"
                      style={{ left: `${priceRangeVisual.left}%`, right: `${priceRangeVisual.right}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-muted">
                    <span>{priceBounds.min ? `${formatPrice(priceBounds.min)} ₽` : '0 ₽'}</span>
                    <span>{priceBounds.max ? `${formatPrice(priceBounds.max)} ₽` : '0 ₽'}</span>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-primary"
                    onClick={() => {
                      setPriceMin('');
                      setPriceMax('');
                    }}
                  >
                    Очистить
                  </button>
                </div>
              </FilterPill>

              <FilterPill label="Рейтинг" isActive={Boolean(minRatingValue)}>
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Рейтинг</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1.5 text-[11px] text-center whitespace-nowrap transition ${
                        minRating === ''
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-ink/10 bg-white/90'
                      }`}
                      onClick={() => setMinRating('')}
                    >
                      Любой
                    </button>
                    {ratingOptions.map((rating) => {
                      const isActive = Number(minRating) === rating;
                      return (
                        <button
                          key={rating}
                          type="button"
                          className={`rounded-full border px-3 py-1.5 text-[11px] text-center whitespace-nowrap transition ${
                            isActive
                              ? 'border-primary/60 bg-primary/10 text-primary'
                              : 'border-ink/10 bg-white/90'
                          }`}
                          onClick={() => setMinRating(isActive ? '' : String(rating))}
                        >
                          ★ {rating}+
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FilterPill>

              <FilterPill label="Наличие" isActive={inStockOnly || onSaleOnly}>
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Наличие</p>
                  <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    Только в наличии
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={onSaleOnly}
                      onChange={(e) => setOnSaleOnly(e.target.checked)}
                    />
                    Со скидкой
                  </label>
                </div>
              </FilterPill>

              <button
                type="button"
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  activeFilters.length > 0
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-ink/10 bg-white/90 text-ink'
                }`}
                onClick={() => setIsFilterOpen(true)}
              >
                Все фильтры
                <span className="text-xs">☰</span>
              </button>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="sort" className="text-[11px] text-muted uppercase tracking-[0.28em]">
                  Сортировка
                </label>
                <select
                  id="sort"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="min-w-[200px] rounded-full bg-white/90 border border-ink/10 px-4 py-2 text-sm"
                >
                  <option value="popular">Сначала популярные</option>
                  <option value="newest">Сначала новые</option>
                  <option value="cheap">Сначала дешёвые</option>
                  <option value="expensive">Сначала дорогие</option>
                  <option value="discount">По размеру скидки</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="perPage" className="text-[11px] text-muted uppercase tracking-[0.28em]">
                  На странице
                </label>
                <select
                  id="perPage"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="min-w-[120px] rounded-full bg-white/90 border border-ink/10 px-4 py-2 text-sm"
                >
                  {perPageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-white/80 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`h-9 w-9 rounded-full flex items-center justify-center transition ${
                    viewMode === 'grid' ? 'bg-primary text-white' : 'text-ink/60 hover:text-primary'
                  }`}
                  aria-label="Крупная сетка"
                >
                  <span className="grid grid-cols-2 gap-0.5">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <span key={`grid-${idx}`} className="h-1.5 w-1.5 rounded-[2px] bg-current" />
                    ))}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  className={`h-9 w-9 rounded-full flex items-center justify-center transition ${
                    viewMode === 'compact' ? 'bg-primary text-white' : 'text-ink/60 hover:text-primary'
                  }`}
                  aria-label="Компактная сетка"
                >
                  <span className="grid grid-cols-3 gap-0.5">
                    {Array.from({ length: 9 }).map((_, idx) => (
                      <span key={`compact-${idx}`} className="h-1.5 w-1.5 rounded-[2px] bg-current" />
                    ))}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter, idx) => (
                <button
                  key={`${filter.label}-${idx}`}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/90 px-3 py-1.5 text-xs text-muted hover:border-primary/50 hover:text-primary transition"
                  onClick={filter.onClear}
                >
                  {filter.label} ×
                </button>
              ))}
              <button
                type="button"
                className="text-xs text-primary hover:text-accent transition"
                onClick={clearAllFilters}
              >
                Сбросить все
              </button>
            </div>
          )}
        </div>

        <div ref={resultsRef} className="mt-6">
          {totalItems > 0 ? (
            <>
              <div className={gridClassName}>
                {pagedProducts.map((product, idx) => (
                  <div
                    key={product.id}
                    className="reveal-up"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <CatalogProductCard product={product} />
                  </div>
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
                    {visiblePages.map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted">
                            ...
                          </span>
                        );
                      }
                      const isActive = page === safePage;
                      return (
                        <button
                          key={page}
                          type="button"
                          className={`h-9 w-9 rounded-full text-sm transition ${
                            isActive
                              ? 'bg-primary text-white shadow-sm'
                              : 'border border-ink/10 bg-white/90 hover:border-primary/50 hover:text-primary'
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
              <p className="text-lg font-semibold mb-2">{emptyTitle}</p>
              <p className="text-sm text-muted mb-4">{emptyDescription}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {activeFilters.length > 0 && (
                  <button type="button" className="button-gray" onClick={clearAllFilters}>
                    Сбросить фильтры
                  </button>
                )}
                <button type="button" className="button" onClick={() => setSortKey('popular')}>
                  Показать популярные
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
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white/95 p-6 shadow-2xl slide-up-panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted">Фильтры</p>
                <h3 className="text-lg font-semibold">Настройте подборку</h3>
              </div>
              <button
                type="button"
                className="text-sm text-muted hover:text-primary transition"
                onClick={() => setIsFilterOpen(false)}
              >
                Закрыть
              </button>
            </div>
            <FilterContent showHeader={false} showFooter />
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryPage;

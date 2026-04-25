import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import {
  CataloguePresentationBlocks,
  CataloguePresentationHero,
} from '../components/cms/CataloguePresentationSections';
import CmsStorefrontCollectionRail from '../components/cms/CmsStorefrontCollectionRail';
import {
  Button,
  Card,
  FilterChip,
  Select
} from '../components/ui';
import {
  getPrimaryImageUrl,
  getPrimaryVariant,
  getProductPrice,
  moneyToNumber,
  normalizeProductImages
} from '../utils/product';
import { PRODUCT_LIST_SORT_OPTIONS } from '../features/product-list/constants';
import {
  ProductFiltersDesktop,
  ProductFiltersSheet,
  ProductFiltersTrigger
} from '../features/product-list/ProductFilters';
import ProductPagination from '../features/product-list/ProductPagination';
import { buildCategoryListingHref } from '../features/product-list/url';
import {
  getReviewCount,
  getStockCount,
  resolveCategoryToken
} from '../features/product-list/selectors';
import { useProductList } from '../features/product-list/useProductList';
import { useProductListRouteState } from '../features/product-list/useProductListRouteState';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { normalizeSearchText } from '../utils/search';
import { buildProductPath } from '../utils/url';

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
  }, [images.length, isHovered]);

  useEffect(() => {
    if (activeImageIndex > images.length - 1) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, images.length]);

  const currentImage = images[activeImageIndex]?.url || '';
  const primaryVariant = getPrimaryVariant(product);
  const price = primaryVariant?.price ? moneyToNumber(primaryVariant.price) : getProductPrice(product);
  const oldPrice = primaryVariant?.oldPrice
    ? moneyToNumber(primaryVariant.oldPrice)
    : product?.oldPrice
    ? moneyToNumber(product.oldPrice)
    : 0;
  const hasDiscount = oldPrice > price;
  const discount = hasDiscount
    ? primaryVariant?.discountPercent || product.discountPercent || Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;
  const rating = Number(product?.rating || 0);
  const reviewCount = getReviewCount(product);
  const stockCount = getStockCount(product);

  const badges = [
    stockCount > 0 && stockCount <= 3 ? `Мало на складе: ${stockCount}` : '',
    rating >= 4.8 ? 'Хит продаж' : '',
    !oldPrice && rating >= 4.5 ? 'Новинка' : ''
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
    <Card
      as={Link}
      to={buildProductPath(product)}
      state={{ fromPath, fromLabel }}
      variant="quiet"
      padding="sm"
      interactive
      className="group block rounded-[24px]"
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
          {hasDiscount ? (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              −{discount}%
            </span>
          ) : null}
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
            {hasDiscount ? (
              <span className="text-xs text-muted line-through">{oldPrice.toLocaleString('ru-RU')} ₽</span>
            ) : null}
          </div>
          <span className="text-xs text-primary">Открыть →</span>
        </div>
      </div>
    </Card>
  );
}

function CategoryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const resultsRef = useRef(null);

  const { params, updateParams, clearFilters } = useProductListRouteState({
    source: 'category',
    categorySlug: slug
  });
  const list = useProductList({
    source: 'category',
    categorySlug: slug,
    params
  });

  useBodyScrollLock(isFilterOpen);

  useEffect(() => {
    if (params.page <= 1 || !resultsRef.current) {
      return;
    }
    resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [params.page]);

  const activeSortLabel =
    PRODUCT_LIST_SORT_OPTIONS.find((option) => option.value === params.sort)?.label ||
    'Лучшее совпадение';

  const heading = useMemo(() => {
    if (list.activeCategory?.presentation?.marketingTitle) {
      return list.activeCategory.presentation.marketingTitle;
    }
    if (list.activeCategory?.name) {
      return list.activeCategory.name;
    }
    if (slug === 'popular') {
      return 'Лучшее для дома';
    }
    if (slug === 'new') {
      return 'Новинки';
    }
    return 'Каталог';
  }, [list.activeCategory?.name, list.activeCategory?.presentation?.marketingTitle, slug]);

  const headingNote = useMemo(() => {
    if (list.activeCategory?.presentation?.marketingSubtitle) {
      return list.activeCategory.presentation.marketingSubtitle;
    }
    if (slug === 'popular') {
      return 'Рекомендуем на основе популярности и разнообразия моделей.';
    }
    if (slug === 'new') {
      return 'Свежие поступления из последних коллекций.';
    }
    return list.headingNote;
  }, [list.activeCategory?.presentation?.marketingSubtitle, list.headingNote, slug]);
  const canonicalPath = useMemo(
    () => buildCategoryListingHref(slug, params),
    [params, slug]
  );
  const seoTitle = useMemo(() => {
    if (list.activeCategory?.presentation?.seoTitle) {
      return list.activeCategory.presentation.seoTitle;
    }
    if (list.activeCategory?.name) {
      return `${list.activeCategory.name} — каталог домашнего текстиля`;
    }
    if (slug === 'popular') {
      return 'Популярные товары для дома и спальни';
    }
    if (slug === 'new') {
      return 'Новинки домашнего текстиля';
    }
    return `${heading} — каталог домашнего текстиля`;
  }, [heading, list.activeCategory?.name, list.activeCategory?.presentation?.seoTitle, slug]);
  const seoDescription =
    list.activeCategory?.presentation?.seoDescription ||
    list.activeCategory?.description ||
    headingNote ||
    `${heading}. Подборка товаров для дома с удобной доставкой по России.`;
  const categoryPresentation = list.activeCategory?.presentation || null;
  const categoryPresentationPage = useMemo(
    () => ({
      title: heading,
      navLabel: list.activeCategory?.name || heading,
      path: canonicalPath,
    }),
    [canonicalPath, heading, list.activeCategory?.name]
  );

  const clearFilterByKey = (key) => {
    if (key === 'brand') {
      updateParams({ brand: '' });
      return;
    }
    if (key === 'price') {
      updateParams({ minPrice: '', maxPrice: '' });
      return;
    }
    if (key === 'rating') {
      updateParams({ rating: '' });
      return;
    }
    if (key === 'inStock') {
      updateParams({ inStock: false });
      return;
    }
    if (key === 'sale') {
      updateParams({ sale: false });
    }
  };

  const gridClassName =
    viewMode === 'compact'
      ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      : 'page-grid--catalog';

  const fromPath = `${location.pathname}${location.search}`;
  const filterProps = {
    brands: list.brands,
    priceBounds: list.priceBounds,
    params,
    activeFilterCount: list.activeFilters.length,
    onBrandChange: (brand) => updateParams({ brand }),
    onMinPriceChange: (minPrice) => updateParams({ minPrice }),
    onMaxPriceChange: (maxPrice) => updateParams({ maxPrice }),
    onRatingChange: (rating) => updateParams({ rating }),
    onToggleInStock: () => updateParams({ inStock: !params.inStock }),
    onToggleSale: () => updateParams({ sale: !params.sale }),
    onClearAll: clearFilters
  };

  return (
    <div className="category-page relative overflow-hidden page-section page-section--listing">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        image={categoryPresentation?.seoImage?.url || list.activeCategory?.imageUrl || ''}
      />
      <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="page-shell">
        <nav
          data-testid="category-breadcrumbs"
          className="text-xs text-muted flex flex-wrap items-center gap-2"
        >
          {location.state?.fromPath ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="!min-h-0 !px-0 !py-0 text-primary hover:text-accent"
            >
              ← Назад
            </Button>
          ) : null}
          <Link to="/" className="hover:text-primary transition">Главная</Link>
          <span className="text-ink/40">›</span>
          <Link to="/catalog" className="hover:text-primary transition">Каталог</Link>
          <span className="text-ink/40">›</span>
          <span className="text-ink">{heading}</span>
        </nav>

        <CataloguePresentationHero
          hero={categoryPresentation?.hero}
          page={categoryPresentationPage}
          className="mt-4"
        />

        <div data-testid="category-header" className="section-header mt-3 lg:mt-2.5">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold">{heading}</h1>
            <span className="text-sm text-muted">{list.itemsLabel}</span>
            {categoryPresentation?.badgeText ? (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {categoryPresentation.badgeText}
              </span>
            ) : null}
            {categoryPresentation?.ribbonText ? (
              <span className="rounded-full border border-ink/10 bg-white/90 px-2.5 py-1 text-xs text-ink/75">
                {categoryPresentation.ribbonText}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="inline-flex min-h-[44px] w-full items-center gap-2 rounded-2xl border border-ink/10 bg-white/90 px-3 text-sm shadow-[0_10px_24px_rgba(43,39,34,0.07)] sm:w-auto">
              <span className="text-ink/55">↕</span>
              <label htmlFor="category-sort" className="text-ink/65">
                Сорт:
              </label>
              <Select
                id="category-sort"
                value={params.sort}
                onChange={(event) => updateParams({ sort: event.target.value })}
                className="control-inline min-w-0 w-full bg-transparent pr-6 text-sm font-medium text-ink focus:outline-none sm:min-w-[200px]"
                aria-label="Сортировка товаров"
              >
                {PRODUCT_LIST_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <ProductFiltersTrigger
              activeFilterCount={list.activeFilters.length}
              isOpen={isFilterOpen}
              onOpenFilters={() => setIsFilterOpen(true)}
            />

            <div className="hidden sm:flex items-center gap-1 rounded-2xl border border-ink/10 bg-white/90 p-1">
              <Button
                type="button"
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-xl"
                aria-label="Крупная сетка"
              >
                ▦
              </Button>
              <Button
                type="button"
                variant={viewMode === 'compact' ? 'primary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('compact')}
                className="rounded-xl"
                aria-label="Компактная сетка"
              >
                ▩
              </Button>
            </div>
          </div>
        </div>

        {headingNote ? <p className="mt-1.5 text-sm text-muted lg:mt-1">{headingNote}</p> : null}

        {list.childCategories.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 lg:mt-3">
            {list.childCategories.map((category) => {
              const token = resolveCategoryToken(category);
              const count = list.childCategoryCounts[normalizeSearchText(token)] || 0;
              return (
                <FilterChip
                  key={token}
                  type="button"
                  className="rounded-2xl text-sm"
                  onClick={() => navigate(`/category/${token}`)}
                >
                  {category.name}{count ? ` (${count})` : ''}
                </FilterChip>
              );
            })}
          </div>
        ) : null}

        <Card
          as="section"
          variant="quiet"
          className="mt-4 lg:mt-3"
          padding="sm"
          data-testid="category-filters-card"
        >
          <ProductFiltersDesktop
            {...filterProps}
            className="hidden gap-3 lg:grid xl:grid-cols-4"
          />
          <div className="text-xs text-muted lg:mt-3">
            Сортировка: <span className="font-semibold text-ink">{activeSortLabel}</span>
            {params.sort === 'bestMatch' ? (
              <span className="ml-2">
                Рекомендуем на основе популярности, отзывов и разнообразия товаров.
              </span>
            ) : null}
          </div>
        </Card>

        <ProductFiltersSheet
          {...filterProps}
          isFilterOpen={isFilterOpen}
          onCloseFilters={() => setIsFilterOpen(false)}
        />

        {list.activeFilters.length > 0 ? (
          <Card className="mt-4 flex flex-wrap items-center gap-2 lg:mt-3" variant="quiet" padding="sm">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Применено</span>
            <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {list.activeFilters.map((filter) => (
                <FilterChip
                  key={filter.key}
                  type="button"
                  onClick={() => clearFilterByKey(filter.key)}
                  active
                >
                  {filter.label}
                  <span aria-hidden="true">×</span>
                </FilterChip>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="whitespace-nowrap text-primary"
              onClick={clearFilters}
            >
              Очистить всё
            </Button>
          </Card>
        ) : null}

        <CataloguePresentationBlocks
          blocks={categoryPresentation?.blocks}
          page={categoryPresentationPage}
          className="mt-6"
        />
        <CmsStorefrontCollectionRail
          collectionKeys={categoryPresentation?.linkedCollectionKeys}
          className="mt-6"
        />

        <div ref={resultsRef} data-testid="category-results" className="mt-5 lg:mt-4">
          {list.loading ? (
            <div className={gridClassName}>
              {Array.from({ length: list.pageSize }).map((_, index) => (
                <div key={`skeleton-${index}`} className="ui-card ui-card--quiet p-3">
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
          ) : list.error ? (
            <Card className="text-center" padding="lg">
              <p className="text-lg font-semibold mb-2">Не удалось загрузить товары</p>
              <p className="text-sm text-muted">Обновите страницу или попробуйте позже.</p>
            </Card>
          ) : list.totalItems > 0 ? (
            <>
              <div className={gridClassName}>
                {list.pagedProducts.map((product) => (
                  <CategoryCard
                    key={product.id}
                    product={product}
                    fromPath={fromPath}
                    fromLabel={heading}
                  />
                ))}
              </div>

              <ProductPagination
                safePage={list.safePage}
                totalPages={list.totalPages}
                visiblePages={list.visiblePages}
                onPageChange={(page) => updateParams({ page }, { resetPage: false })}
              />
            </>
          ) : (
            <Card className="text-center" padding="lg">
              <p className="text-lg font-semibold mb-2">Ничего не нашли</p>
              <p className="text-sm text-muted mb-4">
                Попробуйте изменить сортировку, снять фильтры или перейти в соседнюю категорию.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {list.activeFilters.length > 0 ? (
                  <Button type="button" variant="secondary" onClick={clearFilters}>
                    Сбросить фильтры
                  </Button>
                ) : null}
                <Button type="button" onClick={() => updateParams({ sort: 'bestMatch' })}>
                  Показать рекомендации
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;

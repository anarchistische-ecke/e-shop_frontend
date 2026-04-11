import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { Button, Card, FilterChip, Input, Select } from '../components/ui';
import ProductCard from '../components/ProductCard';
import { PRODUCT_LIST_SORT_OPTIONS } from '../features/product-list/constants';
import {
  ProductFiltersDesktop,
  ProductFiltersSheet,
  ProductFiltersTrigger
} from '../features/product-list/ProductFilters';
import ProductPagination from '../features/product-list/ProductPagination';
import { buildCatalogSearchHref } from '../features/product-list/url';
import { resolveCategoryToken } from '../features/product-list/selectors';
import { useProductList } from '../features/product-list/useProductList';
import { useProductListRouteState } from '../features/product-list/useProductListRouteState';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { normalizeSearchText } from '../utils/search';

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

function CataloguePage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const resultsRef = useRef(null);

  const { params, updateParams, clearFilters } = useProductListRouteState({
    source: 'catalog'
  });
  const list = useProductList({
    source: 'catalog',
    params
  });

  useBodyScrollLock(isFilterOpen);

  useEffect(() => {
    setSearchInput(params.query || '');
  }, [params.query]);

  useEffect(() => {
    if (params.page <= 1 || !resultsRef.current) {
      return;
    }
    resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [params.page]);

  const activeSortLabel =
    PRODUCT_LIST_SORT_OPTIONS.find((option) => option.value === params.sort)?.label ||
    'Лучшее совпадение';
  const hasQuery = Boolean(normalizeSearchText(params.query));
  const canonicalPath = useMemo(
    () => buildCatalogSearchHref({ ...params, original: '' }),
    [params]
  );
  const seoTitle = hasQuery
    ? `Поиск по каталогу: ${params.query || 'результаты'}`
    : 'Каталог домашнего текстиля';
  const seoDescription = hasQuery
    ? `Результаты поиска по запросу «${params.query}». ${list.headingNote}`
    : `${list.headingNote} Постельное белье, пледы, полотенца и другой текстиль с доставкой по России.`;

  const clearFilterByKey = (key) => {
    if (key === 'scope') {
      updateParams({ scope: '' });
      return;
    }
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

  const topCategories = useMemo(
    () => list.navCategories.slice(0, 10),
    [list.navCategories]
  );

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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateParams({
      query: searchInput.trim(),
      original: ''
    });
  };

  return (
    <div className="catalogue-page relative overflow-hidden page-section page-section--listing">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        robots={hasQuery ? 'noindex,follow' : undefined}
      />
      <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="page-shell">
        <nav
          data-testid="catalogue-breadcrumbs"
          className="flex flex-wrap items-center gap-2 text-xs text-muted"
        >
          <Link to="/" className="transition hover:text-primary">Главная</Link>
          <span className="text-ink/40">›</span>
          <span className="text-ink">{hasQuery ? 'Поиск' : 'Каталог'}</span>
        </nav>

        <h1 className="sr-only">
          {hasQuery ? 'Результаты поиска по всему каталогу' : 'Каталог товаров'}
        </h1>

        <Card
          as="section"
          variant="quiet"
          className="mt-3 md:p-5 lg:mt-2.5"
          padding="sm"
          data-testid="catalogue-search-card"
        >
          <form onSubmit={handleSearchSubmit}>
            <label htmlFor="catalog-search" className="text-xs uppercase tracking-[0.2em] text-muted">
              Поиск по каталогу
            </label>
            <div className="relative mt-2">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
              <Input
                id="catalog-search"
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Например: сатин 200x220, плед, подушки"
                className="bg-white pl-11 pr-24 shadow-[0_8px_20px_rgba(43,39,34,0.07)]"
              />
              {searchInput ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchInput('');
                    updateParams({ query: '', original: '' });
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2"
                  aria-label="Очистить поиск"
                >
                  ×
                </Button>
              ) : null}
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                Найти
              </Button>
            </div>
          </form>

          {list.searchCorrectionNote ? (
            <p className="mt-2 text-xs text-primary">{list.searchCorrectionNote}</p>
          ) : null}
          {list.scopeCategoryLabel ? (
            <p className="mt-2 text-xs text-muted">Область поиска: {list.scopeCategoryLabel}</p>
          ) : null}

          <div className="mt-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Область поиска</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:flex-wrap lg:overflow-visible">
              <FilterChip
                type="button"
                onClick={() => updateParams({ scope: '' })}
                active={!params.scope}
                className="whitespace-nowrap"
              >
                Весь каталог
              </FilterChip>
              {topCategories.map((category) => {
                const token = normalizeSearchText(resolveCategoryToken(category));
                const isActive = params.scope === token;
                return (
                  <FilterChip
                    key={resolveCategoryToken(category)}
                    type="button"
                    onClick={() => updateParams({ scope: isActive ? '' : token })}
                    active={isActive}
                    className="whitespace-nowrap"
                  >
                    {category.name}
                  </FilterChip>
                );
              })}
            </div>
          </div>
        </Card>

        <Card
          as="section"
          variant="quiet"
          className="mt-4 lg:mt-3"
          padding="sm"
          data-testid="catalogue-filters-card"
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="inline-grid min-h-[44px] grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-ink/10 bg-white/90 px-3 text-sm shadow-[0_8px_18px_rgba(43,39,34,0.06)]">
              <span className="text-ink/55">↕</span>
              <label htmlFor="catalog-sort" className="sr-only">Сортировка товаров</label>
              <Select
                id="catalog-sort"
                value={params.sort}
                onChange={(event) => updateParams({ sort: event.target.value })}
                className="control-inline w-full pr-6 text-sm font-medium text-ink"
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
          </div>

          <ProductFiltersDesktop
            {...filterProps}
            className="mt-4 hidden gap-3 lg:mt-3 lg:grid xl:grid-cols-4"
          />

          <div className="mt-2 text-xs text-muted">
            Сортировка: <span className="font-semibold text-ink">{activeSortLabel}</span>
            {params.sort === 'bestMatch' ? (
              <span className="ml-2">
                Рекомендуем на основе релевантности, популярности и разнообразия товаров.
              </span>
            ) : null}
          </div>
        </Card>

        <ProductFiltersSheet
          {...filterProps}
          isFilterOpen={isFilterOpen}
          onCloseFilters={() => setIsFilterOpen(false)}
          description="Фильтры каталога"
        />

        {list.activeFilters.length > 0 ? (
          <Card
            as="section"
            variant="quiet"
            className="mt-4 grid gap-2 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center lg:mt-3"
            padding="sm"
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Применено</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
              className="justify-start text-primary md:justify-end"
              onClick={clearFilters}
            >
              Очистить всё
            </Button>
          </Card>
        ) : null}

        <section ref={resultsRef} data-testid="catalogue-results" className="mt-5 lg:mt-4">
          <div className="mb-3 text-sm text-muted">
            {list.loading ? 'Загружаем каталог…' : `${list.totalItems} товаров в выдаче`}
            {hasQuery ? ` · Запрос: “${params.query}”` : ''}
            {!hasQuery && list.scopeCategoryLabel ? ` · Категория: ${list.scopeCategoryLabel}` : ''}
          </div>

          {list.loading ? (
            <div className="page-grid--catalog">
              {Array.from({ length: list.pageSize }).map((_, index) => (
                <div key={`catalog-skeleton-${index}`} className="ui-card ui-card--quiet p-3">
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
          ) : list.error ? (
            <Card className="text-center" padding="lg">
              <p className="text-lg font-semibold mb-2">Не удалось загрузить каталог</p>
              <p className="text-sm text-muted">
                Обновите страницу или попробуйте позже.
              </p>
            </Card>
          ) : list.totalItems > 0 ? (
            <>
              <div className="page-grid--catalog">
                {list.pagedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
                Попробуйте изменить запрос, снять фильтры или расширить область поиска.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {list.activeFilters.length > 0 ? (
                  <Button type="button" variant="secondary" onClick={clearFilters}>
                    Сбросить фильтры
                  </Button>
                ) : null}
                {hasQuery ? (
                  <Button type="button" onClick={() => updateParams({ query: '', original: '' })}>
                    Показать весь каталог
                  </Button>
                ) : null}
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

export default CataloguePage;

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { resolveCategoryToken } from '../features/product-list/selectors';
import { useProductList } from '../features/product-list/useProductList';
import { useProductListRouteState } from '../features/product-list/useProductListRouteState';
import { normalizeSearchText } from '../utils/search';
import { getPrimaryImageUrl } from '../utils/product';
import { METRIKA_GOALS, trackGoal, trackProductList } from '../utils/metrika';
import {
  buildBreadcrumbJsonLd,
  buildJsonLdGraph,
  buildOfferCatalogJsonLd,
  buildWebPageJsonLd
} from '../seo/schema';
import {
  getListingCanonicalPath,
  getListingRobots,
  hasListingSeoVariant
} from '../seo/listing';

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
  const closeFilters = useCallback(() => setIsFilterOpen(false), []);
  const [searchInput, setSearchInput] = useState('');
  const resultsRef = useRef(null);

  const { params, updateParams, clearFilters } = useProductListRouteState({
    source: 'catalog'
  });
  const list = useProductList({
    source: 'catalog',
    params
  });

  useEffect(() => {
    setSearchInput(params.query || '');
  }, [params.query]);

  useEffect(() => {
    if (params.page <= 1 || !resultsRef.current) {
      return;
    }
    resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [params.page]);

  const hasQuery = Boolean(normalizeSearchText(params.query));
  const isListingVariant = useMemo(
    () => hasListingSeoVariant(params, { source: 'catalog' }),
    [params]
  );
  const canonicalPath = useMemo(
    () => getListingCanonicalPath({ source: 'catalog' }),
    []
  );
  const seoTitle = hasQuery
    ? `Поиск по каталогу: ${params.query || 'результаты'}`
    : 'Каталог домашнего текстиля';
  const seoDescription = hasQuery
    ? `Результаты поиска по запросу «${params.query}». ${list.headingNote}`
    : `${list.headingNote} Постельное белье, пледы, полотенца и другой текстиль с доставкой по России.`;
  const catalogBreadcrumbs = useMemo(
    () =>
      buildBreadcrumbJsonLd([
        { name: 'Главная', path: '/' },
        { name: 'Каталог', path: canonicalPath }
      ]),
    [canonicalPath]
  );
  const catalogJsonLd = useMemo(() => {
    const webPage = buildWebPageJsonLd({
      title: seoTitle,
      description: seoDescription,
      path: canonicalPath,
      breadcrumbs: catalogBreadcrumbs
    });
    const catalog = !isListingVariant
      ? buildOfferCatalogJsonLd({
          name: 'Каталог товаров',
          description: seoDescription,
          image: getPrimaryImageUrl(list.pagedProducts[0]) || '',
          products: list.pagedProducts
        })
      : null;

    return buildJsonLdGraph([webPage, catalogBreadcrumbs, catalog]);
  }, [canonicalPath, catalogBreadcrumbs, isListingVariant, list.pagedProducts, seoDescription, seoTitle]);
  const catalogMicrodataImage = getPrimaryImageUrl(list.pagedProducts[0]) || '';

  useEffect(() => {
    if (list.loading || !list.pagedProducts.length) return;
    trackProductList(list.pagedProducts, {
      listName: hasQuery ? 'catalog_search_results' : 'catalog_results',
      pageType: 'catalog',
      startPosition: 1
    });
  }, [hasQuery, list.loading, list.pageSize, list.pagedProducts, list.safePage]);

  useEffect(() => {
    if (list.loading || !hasQuery || list.totalItems !== 0) return;
    trackGoal(METRIKA_GOALS.SEARCH_ZERO_RESULTS, {
      search_query: params.query,
      scope: params.scope || 'all'
    });
  }, [hasQuery, list.loading, list.totalItems, params.query, params.scope]);

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
    if (key === 'inStock') {
      updateParams({ inStock: false });
      return;
    }
    if (key === 'sale') {
      updateParams({ sale: false });
    }
  };

  const filterProps = {
    brands: list.brands,
    priceBounds: list.priceBounds,
    params,
    activeFilterCount: list.activeFilters.length,
    onBrandChange: (brand) => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'brand', has_value: Boolean(brand) });
      updateParams({ brand });
    },
    onMinPriceChange: (minPrice) => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'min_price', has_value: Boolean(minPrice) });
      updateParams({ minPrice });
    },
    onMaxPriceChange: (maxPrice) => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'max_price', has_value: Boolean(maxPrice) });
      updateParams({ maxPrice });
    },
    onToggleInStock: () => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'in_stock', enabled: !params.inStock });
      updateParams({ inStock: !params.inStock });
    },
    onToggleSale: () => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'sale', enabled: !params.sale });
      updateParams({ sale: !params.sale });
    },
    onApplyFilters: (draft) => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'mobile_sheet_apply' });
      updateParams({
        brand: draft.brand || '',
        minPrice: draft.minPrice || '',
        maxPrice: draft.maxPrice || '',
        inStock: Boolean(draft.inStock),
        sale: Boolean(draft.sale)
      });
    },
    onClearAll: clearFilters
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    trackGoal(METRIKA_GOALS.SEARCH_SUBMIT, {
      search_query: searchInput.trim(),
      scope: params.scope || 'all'
    });
    updateParams({
      query: searchInput.trim(),
      original: ''
    });
  };

  return (
    <div className="catalogue-page relative pb-10 pt-3 md:pt-5">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        robots={getListingRobots(params, { source: 'catalog' })}
        jsonLd={catalogJsonLd}
      />
      <div className="page-shell">
        <nav
          data-testid="catalogue-breadcrumbs"
          className="hidden flex-wrap items-center gap-2 text-xs text-muted md:flex"
        >
          <Link to="/" className="transition hover:text-primary">Главная</Link>
          <span className="text-ink/40">›</span>
          <span className="text-ink">{hasQuery ? 'Поиск' : 'Каталог'}</span>
        </nav>

        <section data-testid="catalogue-search-card" className="space-y-3 md:mt-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(17rem,25rem)] md:items-center">
            <h1 className="font-display text-[1.875rem] font-medium leading-tight tracking-tight sm:text-[2.5rem]">
              {hasQuery ? `Поиск: «${params.query}»` : 'Каталог товаров'}
            </h1>
            <form onSubmit={handleSearchSubmit} className="relative" role="search" aria-label="Поиск по каталогу">
              <label htmlFor="catalog-search" className="sr-only">Поиск по каталогу</label>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="catalog-search"
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Например, сатин или плед"
                className="w-full bg-white !pl-9 !pr-[7.25rem]"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateParams({ query: '', original: '' });
                  }}
                  className="focus-ring-soft absolute right-[4.25rem] top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md text-xl text-muted"
                  aria-label="Очистить поиск"
                >
                  ×
                </button>
              ) : null}
              <Button type="submit" size="sm" variant="ghost" className="absolute right-0 top-1/2 -translate-y-1/2 !px-3 text-primary">
                Найти
              </Button>
            </form>
          </div>

          {list.searchCorrectionNote ? <p className="text-sm text-primary">{list.searchCorrectionNote}</p> : null}

          <div
            role="group"
            aria-label="Область поиска"
            className="flex gap-x-5 overflow-x-auto border-y border-ink/10 px-0.5 scrollbar-hide lg:flex-wrap lg:overflow-visible"
          >
            <button
              type="button"
              onClick={() => {
                trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'scope', scope: 'all' });
                updateParams({ scope: '' });
              }}
              aria-pressed={!params.scope}
              className="focus-ring-soft min-h-11 shrink-0 whitespace-nowrap border-b-2 border-transparent text-sm text-muted hover:text-primary aria-pressed:border-primary aria-pressed:font-semibold aria-pressed:text-primary"
            >
              Весь каталог
            </button>
            {list.navCategories.map((category) => {
              const token = normalizeSearchText(resolveCategoryToken(category));
              const isActive = params.scope === token;
              return (
                <button
                  key={resolveCategoryToken(category)}
                  type="button"
                  onClick={() => {
                    trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'scope', scope: isActive ? 'all' : token });
                    updateParams({ scope: isActive ? '' : token });
                  }}
                  aria-pressed={isActive}
                  className="focus-ring-soft min-h-11 shrink-0 whitespace-nowrap border-b-2 border-transparent text-sm text-muted hover:text-primary aria-pressed:border-primary aria-pressed:font-semibold aria-pressed:text-primary"
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </section>

        <section
          className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 lg:grid-cols-[minmax(0,1fr)_13rem] xl:grid-cols-[minmax(0,1fr)_16rem]"
          data-testid="catalogue-filters-card"
          aria-label="Фильтры и сортировка"
        >
          <ProductFiltersTrigger
            activeFilterCount={list.activeFilters.length}
            isOpen={isFilterOpen}
            onOpenFilters={() => setIsFilterOpen(true)}
          />
          <ProductFiltersDesktop
            {...filterProps}
            className="hidden grid-cols-[minmax(9rem,1fr)_minmax(12rem,1.25fr)_auto] items-end gap-2 lg:grid"
          />
          <label htmlFor="catalog-sort" className="sr-only">Сортировка товаров</label>
          <Select
            id="catalog-sort"
            value={params.sort}
            onChange={(event) => {
              trackGoal(METRIKA_GOALS.SEARCH_SORT_CHANGE, { sort: event.target.value, page_type: 'catalog' });
              updateParams({ sort: event.target.value });
            }}
            className="min-w-0 text-sm"
          >
            {PRODUCT_LIST_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </section>

        <ProductFiltersSheet
          {...filterProps}
          isFilterOpen={isFilterOpen}
          onCloseFilters={closeFilters}
          description="Фильтры каталога"
        />

        {list.activeFilters.length > 0 ? (
          <section aria-label="Применённые фильтры" className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {list.activeFilters.map((filter) => (
                <FilterChip
                  key={filter.key}
                  type="button"
                  onClick={() => clearFilterByKey(filter.key)}
                  className="shrink-0 whitespace-nowrap"
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
          </section>
        ) : null}

        <section
          ref={resultsRef}
          data-testid="catalogue-results"
          className="mt-3 md:mt-4"
          itemScope={!isListingVariant || undefined}
          itemType={!isListingVariant ? 'https://schema.org/OfferCatalog' : undefined}
        >
          {!isListingVariant ? (
            <>
              <meta itemProp="name" content="Каталог товаров" />
              <meta itemProp="description" content={seoDescription} />
              {catalogMicrodataImage ? <link itemProp="image" href={catalogMicrodataImage} /> : null}
            </>
          ) : null}
          <p className="mb-2 text-sm text-muted" aria-live="polite">
            {list.loading ? 'Загружаем каталог…' : list.itemsLabel}
          </p>

          {list.loading ? (
            <div className="page-grid--catalog">
              {Array.from({ length: list.pageSize }).map((_, index) => (
                <div key={`catalog-skeleton-${index}`} className="space-y-3">
                  <div className="skeleton shimmer-safe aspect-[4/3] w-full rounded-lg" />
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
              <div className="page-grid--catalog" data-testid="catalogue-grid">
                {list.pagedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    listName={hasQuery ? 'catalog_search_results' : 'catalog_results'}
                    position={index + 1}
                    withOfferCatalogMicrodata={!isListingVariant}
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

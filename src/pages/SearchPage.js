import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import ProductCard from '../components/ProductCard';
import { Button, FilterChip, Input, Select } from '../components/ui';
import ProductPagination from '../features/product-list/ProductPagination';
import { PRODUCT_LIST_SORT_OPTIONS } from '../features/product-list/constants';
import { useProductDirectoryData } from '../features/product-list/data';
import { buildSearchHref } from '../features/product-list/url';
import { useProductList } from '../features/product-list/useProductList';
import { useProductListRouteState } from '../features/product-list/useProductListRouteState';
import { buildAutocompleteData, normalizeSearchText } from '../utils/search';
import { resolveCategoryToken } from '../features/product-list/selectors';
import { METRIKA_GOALS, trackGoal, trackProductList } from '../utils/metrika';

function SearchPage() {
  const resultsRef = useRef(null);
  const [searchInput, setSearchInput] = useState('');

  const { params, updateParams } = useProductListRouteState({ source: 'catalog' });
  const list = useProductList({
    source: 'catalog',
    params
  });
  const { categories, products } = useProductDirectoryData();

  useEffect(() => {
    setSearchInput(params.query || '');
  }, [params.query]);

  useEffect(() => {
    if (!normalizeSearchText(params.query) || params.page <= 1 || !resultsRef.current) {
      return;
    }

    resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [params.page, params.query]);

  const hasQuery = Boolean(normalizeSearchText(params.query));
  const autocompleteData = useMemo(
    () =>
      buildAutocompleteData({
        query: searchInput || params.query,
        products,
        categories,
        scopeToken: params.scope
      }),
    [categories, params.query, params.scope, products, searchInput]
  );
  const topCategories = useMemo(() => list.navCategories.slice(0, 8), [list.navCategories]);
  const visibleProducts = hasQuery ? list.pagedProducts : [];
  useEffect(() => {
    if (list.loading || !visibleProducts.length) return;
    trackProductList(visibleProducts, {
      listName: 'search_results',
      pageType: 'search',
      startPosition: 1
    });
  }, [list.loading, list.pageSize, list.safePage, visibleProducts]);

  useEffect(() => {
    if (list.loading || !hasQuery || list.totalItems !== 0) return;
    trackGoal(METRIKA_GOALS.SEARCH_ZERO_RESULTS, {
      search_query: params.query,
      scope: params.scope || 'all'
    });
  }, [hasQuery, list.loading, list.totalItems, params.query, params.scope]);

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

  const seoTitle = hasQuery
    ? `Поиск: ${params.query}`
    : 'Поиск товаров по каталогу';
  const seoDescription = hasQuery
    ? `Поиск по запросу «${params.query}». ${list.headingNote}`
    : 'Найдите товар по названию, категории или коллекции без скрытых свайпов и лишних шагов.';

  const hasActiveFilters = Boolean(params.scope || params.inStock || params.sort !== 'bestMatch');

  function updateScope(scope) {
    trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'scope', scope: scope || 'all' });
    updateParams({ scope });
  }

  return (
    <div className="pb-10 pt-3 md:pt-5">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={buildSearchHref({ ...params, original: '' })}
        robots="noindex,follow"
      />

      <div className="page-shell">
        <nav aria-label="Хлебные крошки" className="hidden items-center gap-2 text-xs text-muted md:flex">
          <Link to="/" className="hover:text-primary">Главная</Link>
          <span aria-hidden="true">›</span>
          <span>Поиск</span>
        </nav>

        <section data-testid="search-page-card" className="space-y-3 md:mt-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(19rem,29rem)] md:items-center">
            <h1 className="font-display text-[1.875rem] font-medium leading-tight tracking-tight sm:text-[2.5rem]">
              {hasQuery ? `Поиск: «${params.query}»` : 'Поиск по каталогу'}
            </h1>
            <form role="search" onSubmit={handleSearchSubmit} className="flex min-w-0 gap-2">
              <label htmlFor="search-page-input" className="sr-only">Что ищем</label>
              <Input
                id="search-page-input"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Название товара или ткани"
                className="min-w-0 bg-white"
              />
              <Button type="submit" size="sm" className="shrink-0 !px-3">Найти</Button>
            </form>
          </div>

          {hasQuery ? (
            <div
              data-testid="search-page-controls"
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-y border-line py-2 sm:flex sm:flex-wrap"
            >
              <label htmlFor="search-page-scope" className="sr-only">Область поиска</label>
              <Select id="search-page-scope" data-testid="search-page-scope-select" value={params.scope} onChange={(event) => updateScope(event.target.value)} className="col-span-2 min-w-0 sm:w-auto">
                <option value="">Весь каталог</option>
                {topCategories.map((category) => {
                  const token = normalizeSearchText(resolveCategoryToken(category));
                  return <option key={token} value={token}>{category.name}</option>;
                })}
              </Select>
              <FilterChip
                type="button"
                onClick={() => {
                  trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'in_stock', enabled: !params.inStock });
                  updateParams({ inStock: !params.inStock });
                }}
                active={params.inStock}
                aria-pressed={params.inStock}
                aria-label="Только в наличии"
                className="justify-start whitespace-nowrap"
              >
                В наличии
              </FilterChip>
              <Select
                value={params.sort}
                onChange={(event) => {
                  trackGoal(METRIKA_GOALS.SEARCH_SORT_CHANGE, { sort: event.target.value, page_type: 'search' });
                  updateParams({ sort: event.target.value });
                }}
                className="min-w-0 sm:w-auto"
                aria-label="Сортировка результатов поиска"
              >
                {PRODUCT_LIST_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
              {hasActiveFilters ? (
                <Button type="button" variant="ghost" size="sm" className="justify-start !px-2 text-primary" onClick={() => updateParams({ scope: '', inStock: false, sort: 'bestMatch' })}>
                  Сбросить
                </Button>
              ) : null}
            </div>
          ) : null}
        </section>

        {hasQuery ? (
          <section ref={resultsRef} className="mt-3 md:mt-4">
            <div className="mb-2 text-sm text-muted" aria-live="polite">
              <h2 className="font-body text-sm font-medium text-muted">
                {list.loading ? 'Ищем товары…' : visibleProducts.length > 0 ? `Найдено ${list.itemsLabel}` : 'Подходящих товаров пока нет'}
              </h2>
              {list.searchCorrectionNote ? <p className="mt-1 text-primary">{list.searchCorrectionNote}</p> : null}
            </div>

            {list.loading && !visibleProducts.length ? (
              <div className="page-grid--catalog" aria-hidden="true">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="aspect-[4/3] rounded-lg bg-[#eee9df]" />)}
              </div>
            ) : visibleProducts.length > 0 ? (
              <>
                <div className="page-grid--catalog">
                  {visibleProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} listName="search_results" position={index + 1} priority={index < 2} />
                  ))}
                </div>
                {list.totalPages > 1 ? (
                  <ProductPagination safePage={list.safePage} totalPages={list.totalPages} visiblePages={list.visiblePages} onPageChange={(page) => updateParams({ page }, { resetPage: false })} />
                ) : null}
              </>
            ) : (
              <div className="space-y-4 border-t border-ink/10 py-4">
                <p className="text-sm text-muted">
                  {list.error ? 'Не удалось загрузить товары. Попробуйте ещё раз.' : 'Проверьте написание или попробуйте другой запрос.'}
                </p>
                {autocompleteData.suggestedQueries.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {autocompleteData.suggestedQueries.slice(0, 6).map((suggestion) => (
                      <FilterChip
                        key={`${suggestion.label}-${suggestion.scopeToken}`}
                        type="button"
                        onClick={() => {
                          trackGoal(METRIKA_GOALS.SEARCH_SUGGESTION_CLICK, { search_query: suggestion.label, scope: suggestion.scopeToken || params.scope || 'all' });
                          updateParams({ query: suggestion.label, scope: suggestion.scopeToken || params.scope, original: '' });
                        }}
                      >
                        {suggestion.label}
                      </FilterChip>
                    ))}
                  </div>
                ) : null}
                <Link to="/catalog" className="focus-ring-soft inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">Открыть весь каталог →</Link>
              </div>
            )}
          </section>
        ) : (
          <section className="mt-6 border-t border-ink/10 pt-4">
            <h2 className="font-display text-2xl font-medium">Разделы каталога</h2>
            <div className="mt-3 grid gap-x-5 sm:grid-cols-2 lg:grid-cols-3">
              {topCategories.slice(0, 6).map((category) => (
                <Link key={category.id} to={`/category/${resolveCategoryToken(category)}`} className="focus-ring-soft flex min-h-11 items-center justify-between border-b border-ink/10 text-sm font-semibold text-primary">
                  {category.name}<span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default SearchPage;

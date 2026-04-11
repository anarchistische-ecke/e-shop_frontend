import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import ProductCard from '../components/ProductCard';
import { Button, Card, FilterChip, Input, Select } from '../components/ui';
import ProductPagination from '../features/product-list/ProductPagination';
import { PRODUCT_LIST_SORT_OPTIONS } from '../features/product-list/constants';
import { useProductDirectoryData } from '../features/product-list/data';
import { buildSearchHref } from '../features/product-list/url';
import { useProductList } from '../features/product-list/useProductList';
import { useProductListRouteState } from '../features/product-list/useProductListRouteState';
import { buildAutocompleteData, normalizeSearchText } from '../utils/search';
import { resolveCategoryToken } from '../features/product-list/selectors';

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
  const currentSortLabel =
    PRODUCT_LIST_SORT_OPTIONS.find((option) => option.value === params.sort)?.label ||
    'Лучшее совпадение';

  const handleSearchSubmit = (event) => {
    event.preventDefault();
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

  return (
    <div className="page-section">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={buildSearchHref({ ...params, original: '' })}
        robots="noindex,follow"
      />

      <div className="page-shell space-y-5">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link to="/" className="transition hover:text-primary">Главная</Link>
          <span className="text-ink/40">›</span>
          <span className="text-ink">Поиск</span>
        </nav>

        <Card className="overflow-hidden rounded-[28px] p-4 sm:p-5">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-accent">Поиск</p>
              <h1 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">
                Найти товар по названию, категории или подборке
              </h1>
              <p className="mt-2 text-sm text-muted">
                Отдельная страница поиска с крупным полем ввода, понятными фильтрами и
                видимыми результатами без плавающих оверлеев.
              </p>
            </div>

            <form role="search" onSubmit={handleSearchSubmit} className="space-y-3">
              <label htmlFor="search-page-input" className="text-xs uppercase tracking-[0.2em] text-muted">
                Что ищем
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="search-page-input"
                  type="search"
                  autoFocus
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Например: сатин, подушки, плед"
                  className="bg-white"
                  enterKeyHint="search"
                />
                <div className="flex gap-2">
                  {searchInput ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSearchInput('');
                        updateParams({ query: '', original: '' });
                      }}
                    >
                      Очистить
                    </Button>
                  ) : null}
                  <Button type="submit" className="flex-1 sm:flex-none">
                    Найти
                  </Button>
                </div>
              </div>
            </form>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
                  Область поиска
                </p>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

              <div className="grid gap-2 sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:items-center">
                <FilterChip
                  type="button"
                  onClick={() => updateParams({ inStock: !params.inStock })}
                  active={params.inStock}
                  className="justify-center"
                >
                  Только в наличии
                </FilterChip>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="justify-center"
                  onClick={() =>
                    updateParams({
                      scope: '',
                      inStock: false,
                      sort: 'bestMatch',
                      page: 1
                    })
                  }
                >
                  Сбросить
                </Button>
                <label className="inline-grid min-h-[44px] grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-ink/10 bg-white/90 px-3 text-sm shadow-[0_8px_18px_rgba(43,39,34,0.06)]">
                  <span className="text-ink/55">↕</span>
                  <Select
                    value={params.sort}
                    onChange={(event) => updateParams({ sort: event.target.value })}
                    className="control-inline w-full pr-6 text-sm font-medium text-ink"
                    aria-label="Сортировка результатов поиска"
                  >
                    {PRODUCT_LIST_SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {!hasQuery ? (
          <Card variant="quiet" className="rounded-[28px]">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">С чего начать</h2>
                <p className="mt-1 text-sm text-muted">
                  Введите запрос или перейдите сразу в основные разделы каталога.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {topCategories.slice(0, 6).map((category) => (
                  <Button
                    key={category.id}
                    as={Link}
                    to={`/category/${resolveCategoryToken(category)}`}
                    variant="secondary"
                    className="justify-between"
                  >
                    <span className="truncate">{category.name}</span>
                    <span aria-hidden="true">→</span>
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {hasQuery ? (
          <div ref={resultsRef}>
            <Card variant="quiet" className="rounded-[28px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Результаты</p>
                <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
                  {visibleProducts.length > 0
                    ? `Найдено ${list.itemsLabel}`
                    : 'Подходящих товаров пока нет'}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Запрос: <span className="font-medium text-ink">«{params.query}»</span>.
                  {' '}
                  Сортировка: {currentSortLabel.toLowerCase()}.
                </p>
                {list.searchCorrectionNote ? (
                  <p className="mt-2 text-sm text-primary">{list.searchCorrectionNote}</p>
                ) : null}
              </div>
              <Button as={Link} to="/catalog" variant="secondary">
                Открыть весь каталог
              </Button>
            </div>

            {autocompleteData.suggestedQueries.length > 0 ? (
              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Подсказки</p>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {autocompleteData.suggestedQueries.slice(0, 6).map((suggestion) => (
                    <FilterChip
                      key={`${suggestion.label}-${suggestion.scopeToken}`}
                      type="button"
                      onClick={() =>
                        updateParams({
                          query: suggestion.label,
                          scope: suggestion.scopeToken || params.scope,
                          original: ''
                        })
                      }
                      className="whitespace-nowrap"
                    >
                      {suggestion.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
            ) : null}

            {visibleProducts.length > 0 ? (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {list.totalPages > 1 ? (
                  <div className="mt-6">
                    <ProductPagination
                      safePage={list.safePage}
                      totalPages={list.totalPages}
                      visiblePages={list.visiblePages}
                      onPageChange={(page) => updateParams({ page }, { resetPage: false })}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-5 rounded-[24px] border border-dashed border-ink/20 bg-white px-4 py-5 text-sm text-muted">
                Попробуйте уточнить запрос, выбрать другую область поиска или перейти в каталог.
              </div>
            )}
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SearchPage;

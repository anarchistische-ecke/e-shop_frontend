import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import {
  CataloguePresentationBlocks,
  CataloguePresentationHero,
} from '../components/cms/CataloguePresentationSections';
import CmsStorefrontCollectionRail from '../components/cms/CmsStorefrontCollectionRail';
import ProductCard from '../components/ProductCard';
import {
  Button,
  Card,
  FilterChip,
  Select
} from '../components/ui';
import { getPrimaryImageUrl } from '../utils/product';
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
import {
  METRIKA_GOALS,
  trackGoal,
  trackProductList
} from '../utils/metrika';
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
import QuickViewSheet from '../components/commerce/QuickViewSheet';
import { GridIcon, ListIcon } from '../components/header/icons';

function CategoryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const closeFilters = useCallback(() => setIsFilterOpen(false), []);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
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

  useEffect(() => {
    if (params.page <= 1 || !resultsRef.current) {
      return;
    }
    resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [params.page]);

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
  const isListingVariant = useMemo(
    () => hasListingSeoVariant(params, { source: 'category', categorySlug: slug }),
    [params, slug]
  );
  const canonicalPath = useMemo(
    () => getListingCanonicalPath({ source: 'category', categorySlug: slug }),
    [slug]
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
  const categoryCatalogImage =
    categoryPresentation?.seoImage?.url ||
    list.activeCategory?.imageUrl ||
    getPrimaryImageUrl(list.pagedProducts[0]) ||
    '';
  const categoryPresentationPage = useMemo(
    () => ({
      title: heading,
      navLabel: list.activeCategory?.name || heading,
      path: canonicalPath,
    }),
    [canonicalPath, heading, list.activeCategory?.name]
  );
  const categoryBreadcrumbs = useMemo(
    () =>
      buildBreadcrumbJsonLd([
        { name: 'Главная', path: '/' },
        { name: 'Каталог', path: '/catalog' },
        { name: heading, path: canonicalPath }
      ]),
    [canonicalPath, heading]
  );
  const categoryJsonLd = useMemo(() => {
    const webPage = buildWebPageJsonLd({
      title: seoTitle,
      description: seoDescription,
      path: canonicalPath,
      image: categoryPresentation?.seoImage?.url || list.activeCategory?.imageUrl || '',
      breadcrumbs: categoryBreadcrumbs
    });
    const catalog = !isListingVariant
      ? buildOfferCatalogJsonLd({
          name: heading,
          description: seoDescription,
          image: categoryPresentation?.seoImage?.url || list.activeCategory?.imageUrl || '',
          products: list.pagedProducts
        })
      : null;

    return buildJsonLdGraph([webPage, categoryBreadcrumbs, catalog]);
  }, [
    canonicalPath,
    categoryBreadcrumbs,
    categoryPresentation?.seoImage?.url,
    heading,
    isListingVariant,
    list.activeCategory?.imageUrl,
    list.pagedProducts,
    seoDescription,
    seoTitle
  ]);

  useEffect(() => {
    if (list.loading || !list.pagedProducts.length) return;
    trackProductList(list.pagedProducts, {
      listName: `category_${slug || 'unknown'}`,
      pageType: 'category',
      startPosition: 1
    });
  }, [list.loading, list.pageSize, list.pagedProducts, list.safePage, slug]);

  const clearFilterByKey = (key) => {
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

  const gridClassName =
    viewMode === 'compact'
      ? 'grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5'
      : 'page-grid--catalog';

  const filterProps = {
    brands: list.brands,
    priceBounds: list.priceBounds,
    params,
    activeFilterCount: list.activeFilters.length,
    onBrandChange: (brand) => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'brand', page_type: 'category', has_value: Boolean(brand) });
      updateParams({ brand });
    },
    onMinPriceChange: (minPrice) => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'min_price', page_type: 'category', has_value: Boolean(minPrice) });
      updateParams({ minPrice });
    },
    onMaxPriceChange: (maxPrice) => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'max_price', page_type: 'category', has_value: Boolean(maxPrice) });
      updateParams({ maxPrice });
    },
    onToggleInStock: () => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'in_stock', page_type: 'category', enabled: !params.inStock });
      updateParams({ inStock: !params.inStock });
    },
    onToggleSale: () => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'sale', page_type: 'category', enabled: !params.sale });
      updateParams({ sale: !params.sale });
    },
    onApplyFilters: (draft) => {
      trackGoal(METRIKA_GOALS.SEARCH_FILTER_CHANGE, { filter: 'mobile_sheet_apply', page_type: 'category' });
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

  return (
    <div className="category-page relative pb-10 pt-3 md:pt-5">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        image={categoryPresentation?.seoImage?.url || list.activeCategory?.imageUrl || ''}
        imageAlt={heading}
        robots={getListingRobots(params, { source: 'category', categorySlug: slug })}
        jsonLd={categoryJsonLd}
      />
      <div className="page-shell">
        <nav
          data-testid="category-breadcrumbs"
          className="hidden flex-wrap items-center gap-2 text-xs text-muted md:flex"
        >
          {location.state?.fromPath ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-primary hover:text-accent"
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

        <div data-testid="category-header" className="md:mt-3">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h1 className="font-display text-[1.875rem] font-medium leading-tight tracking-tight sm:text-[2.5rem]">{heading}</h1>
            <span className="text-sm text-muted" aria-live="polite">{list.itemsLabel}</span>
          </div>
          {headingNote ? <p className="mt-2 max-w-2xl text-sm text-muted">{headingNote}</p> : null}
          {categoryPresentation?.badgeText || categoryPresentation?.ribbonText ? (
            <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-primary">
              {categoryPresentation.badgeText ? <span>{categoryPresentation.badgeText}</span> : null}
              {categoryPresentation.ribbonText ? <span>{categoryPresentation.ribbonText}</span> : null}
            </p>
          ) : null}
        </div>

        {list.childCategories.length > 0 ? (
          <nav aria-label="Подкатегории" className="mt-3 flex gap-x-5 overflow-x-auto border-y border-ink/10 scrollbar-hide lg:flex-wrap">
            {list.childCategories.map((category) => {
              const token = resolveCategoryToken(category);
              const count = list.childCategoryCounts[normalizeSearchText(token)] || 0;
              return (
                <Link key={token} to={`/category/${token}`} className="focus-ring-soft flex min-h-11 shrink-0 items-center whitespace-nowrap text-sm font-semibold text-primary hover:underline">
                  {category.name}{count ? ` (${count})` : ''}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <section
          className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_12rem_auto] xl:grid-cols-[minmax(0,1fr)_15rem_auto]"
          data-testid="category-filters-card"
          aria-label="Фильтры и сортировка"
        >
          <ProductFiltersTrigger
            activeFilterCount={list.activeFilters.length}
            isOpen={isFilterOpen}
            onOpenFilters={() => setIsFilterOpen(true)}
          />
          <ProductFiltersDesktop
            {...filterProps}
            className="hidden grid-cols-[minmax(8rem,1fr)_minmax(11rem,1.2fr)_auto] items-end gap-2 lg:grid"
          />
          <label htmlFor="category-sort" className="sr-only">Сортировка товаров</label>
          <Select
            id="category-sort"
            value={params.sort}
            onChange={(event) => {
              trackGoal(METRIKA_GOALS.SEARCH_SORT_CHANGE, { sort: event.target.value, page_type: 'category' });
              updateParams({ sort: event.target.value });
            }}
            className="min-w-0 text-sm"
          >
            {PRODUCT_LIST_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <div className="hidden gap-1 sm:flex">
            <Button type="button" variant={viewMode === 'grid' ? 'subtle' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} aria-label="Крупная сетка" aria-pressed={viewMode === 'grid'}>
              <GridIcon className="h-5 w-5" />
            </Button>
            <Button type="button" variant={viewMode === 'compact' ? 'subtle' : 'ghost'} size="icon" onClick={() => setViewMode('compact')} aria-label="Компактная сетка" aria-pressed={viewMode === 'compact'}>
              <ListIcon className="h-5 w-5" />
            </Button>
          </div>
        </section>

        <ProductFiltersSheet
          {...filterProps}
          isFilterOpen={isFilterOpen}
          onCloseFilters={closeFilters}
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
              className="whitespace-nowrap text-primary"
              onClick={clearFilters}
            >
              Очистить всё
            </Button>
          </section>
        ) : null}

        <div
          ref={resultsRef}
          data-testid="category-results"
          className="mt-3 md:mt-4"
          itemScope={!isListingVariant || undefined}
          itemType={!isListingVariant ? 'https://schema.org/OfferCatalog' : undefined}
        >
          {!isListingVariant ? (
            <>
              <meta itemProp="name" content={heading} />
              <meta itemProp="description" content={seoDescription} />
              {categoryCatalogImage ? <link itemProp="image" href={categoryCatalogImage} /> : null}
            </>
          ) : null}
          {list.loading ? (
            <div className={gridClassName}>
              {Array.from({ length: list.pageSize }).map((_, index) => (
                <div key={`skeleton-${index}`} className="space-y-3">
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
              <p className="text-lg font-semibold mb-2">Не удалось загрузить товары</p>
              <p className="text-sm text-muted">Обновите страницу или попробуйте позже.</p>
            </Card>
          ) : list.totalItems > 0 ? (
            <>
              <div className={gridClassName}>
                {list.pagedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    fromLabel={heading}
                    listName={`category_${slug || 'unknown'}`}
                    position={index + 1}
                    withOfferCatalogMicrodata={!isListingVariant}
                    onQuickView={setQuickViewProduct}
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
        <CataloguePresentationHero
          hero={categoryPresentation?.hero}
          page={{ ...categoryPresentationPage, secondaryHeading: true }}
          className="mt-8"
        />
        <CataloguePresentationBlocks blocks={categoryPresentation?.blocks} page={categoryPresentationPage} className="mt-6" />
        <CmsStorefrontCollectionRail collectionKeys={categoryPresentation?.linkedCollectionKeys} className="mt-6" />
      </div>
      <QuickViewSheet
        open={Boolean(quickViewProduct)}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

export default CategoryPage;

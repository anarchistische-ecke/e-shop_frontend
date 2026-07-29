import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { getCatalogueListing } from '../../api';
import { normalizeSearchText } from '../../utils/search';
import { PRODUCT_LIST_PAGE_SIZE } from './constants';
import { useProductDirectoryData } from './data';
import {
  buildCategoryCollections,
  resolveBrandToken,
  resolveCategoryToken,
  sortCategories
} from './selectors';

function formatItemsLabel(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара';
  return 'товаров';
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function toMinor(value) {
  const parsed = numberOrNull(value);
  return parsed === null ? undefined : Math.round(parsed * 100);
}

function buildListingRequest({ source, categorySlug, params }) {
  const specialCategory = categorySlug === 'new' || categorySlug === 'popular';
  return {
    category: source === 'category' && !specialCategory ? categorySlug : '',
    scope: source === 'catalog' ? params.scope : '',
    q: params.query,
    brand: params.brand,
    minPriceMinor: toMinor(params.minPrice),
    maxPriceMinor: toMinor(params.maxPrice),
    inStock: params.inStock,
    sale: params.sale,
    sort: categorySlug === 'new' ? 'newest' : params.sort,
    page: Math.max(0, (params.page || 1) - 1),
    size: PRODUCT_LIST_PAGE_SIZE
  };
}

function visiblePagesFor(totalPages, safePage) {
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
}

export function useProductList({ source = 'catalog', categorySlug = '', params = {} } = {}) {
  const directory = useProductDirectoryData();
  const deferredParams = useDeferredValue(params);
  const initialListing = directory.listing || null;
  const [listing, setListing] = useState(initialListing);
  const [listingLoading, setListingLoading] = useState(!initialListing);
  const [listingError, setListingError] = useState(null);
  const requestSequence = useRef(0);

  const requestParams = useMemo(
    () => buildListingRequest({ source, categorySlug, params: deferredParams }),
    [categorySlug, deferredParams, source]
  );
  const requestKey = useMemo(() => JSON.stringify(requestParams), [requestParams]);

  useEffect(() => {
    let active = true;
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    setListingLoading(true);
    setListingError(null);

    getCatalogueListing(requestParams)
      .then((payload) => {
        if (!active || requestSequence.current !== sequence) return;
        setListing(payload || null);
        setListingLoading(false);
      })
      .catch((error) => {
        if (!active || requestSequence.current !== sequence) return;
        setListingError(error);
        setListingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestKey]);

  const categories = directory.categories || [];
  const brands = directory.brands || [];
  const products = Array.isArray(listing?.items) ? listing.items : [];
  const normalizedQuery = normalizeSearchText(deferredParams.query || '');
  const normalizedScope = normalizeSearchText(deferredParams.scope || '');
  const normalizedOriginal = normalizeSearchText(deferredParams.original || '');

  const {
    navCategories,
    categoryByToken,
    categoryByNormalizedToken
  } = useMemo(() => buildCategoryCollections(categories), [categories]);

  const activeCategory = useMemo(() => {
    if (source !== 'category') return null;
    return categories.find(
      (category) =>
        resolveCategoryToken(category) === categorySlug ||
        String(category.id) === categorySlug
    ) || null;
  }, [categories, categorySlug, source]);

  const activeBrand = useMemo(
    () => brands.find((brand) => String(brand.slug || brand.id) === deferredParams.brand) || null,
    [brands, deferredParams.brand]
  );

  const childCategories = useMemo(() => {
    if (!activeCategory) return [];
    return sortCategories(
      categories.filter(
        (category) => String(category.parentId || category.parent?.id || '') === String(activeCategory.id || '')
      )
    );
  }, [activeCategory, categories]);

  const childCategoryCounts = useMemo(
    () => Object.fromEntries(
      (listing?.facets?.childCategories || []).flatMap((facet) => {
        const keys = [facet.slug, facet.id]
          .map((value) => normalizeSearchText(String(value || '')))
          .filter(Boolean);
        return keys.map((key) => [key, facet.count || 0]);
      })
    ),
    [listing?.facets?.childCategories]
  );

  const minPrice = numberOrNull(deferredParams.minPrice);
  const maxPrice = numberOrNull(deferredParams.maxPrice);
  const priceFilter = minPrice !== null && maxPrice !== null && minPrice > maxPrice
    ? { min: maxPrice, max: minPrice }
    : { min: minPrice, max: maxPrice };
  const priceBounds = {
    min: Math.round(Number(listing?.facets?.price?.minMinor || 0) / 100),
    max: Math.round(Number(listing?.facets?.price?.maxMinor || 0) / 100)
  };

  const totalItems = Number(listing?.totalItems || 0);
  const totalPages = Math.max(1, Number(listing?.totalPages || 0));
  const safePage = Math.min(Math.max(1, Number(listing?.page || 0) + 1), totalPages);
  const visiblePages = useMemo(
    () => visiblePagesFor(totalPages, safePage),
    [safePage, totalPages]
  );

  const scopeCategoryLabel = normalizedScope
    ? categoryByNormalizedToken[normalizedScope]?.name || normalizedScope
    : '';
  const searchResults = {
    list: products,
    appliedQuery: listing?.appliedQuery || normalizedQuery,
    correctionApplied: Boolean(listing?.correction)
  };
  const searchCorrectionNote = (() => {
    if (!normalizedQuery) return '';
    if (normalizedOriginal && normalizedOriginal !== normalizedQuery) {
      return `Показываем результаты для “${deferredParams.query}”. Ваш запрос: “${deferredParams.original}”.`;
    }
    if (listing?.correction) {
      return `Показываем результаты для “${listing.correction}”. Ваш запрос: “${deferredParams.query}”.`;
    }
    return '';
  })();

  const activeFilters = [];
  if (deferredParams.brand) {
    activeFilters.push({ key: 'brand', label: `Бренд: ${activeBrand?.name || deferredParams.brand}` });
  }
  if (normalizedScope) {
    activeFilters.push({ key: 'scope', label: `Категория: ${scopeCategoryLabel}` });
  }
  if (priceFilter.min !== null || priceFilter.max !== null) {
    const parts = [];
    if (priceFilter.min !== null) parts.push(`от ${priceFilter.min.toLocaleString('ru-RU')} ₽`);
    if (priceFilter.max !== null) parts.push(`до ${priceFilter.max.toLocaleString('ru-RU')} ₽`);
    activeFilters.push({ key: 'price', label: `Цена ${parts.join(' ')}` });
  }
  if (deferredParams.inStock) activeFilters.push({ key: 'inStock', label: 'Только в наличии' });
  if (deferredParams.sale) activeFilters.push({ key: 'sale', label: 'Со скидкой' });

  const heading = source === 'category'
    ? activeCategory?.name || 'Каталог'
    : 'Каталог';
  const headingNote = source === 'category'
    ? activeCategory?.description || ''
    : normalizedQuery
    ? 'Подбираем товары по запросу и фильтрам. Сохраняйте ссылку: параметры уже в URL.'
    : 'Сначала оцените ассортимент, затем уточняйте фильтрами.';

  return {
    loading: directory.loading || listingLoading,
    error: listingError || directory.error,
    categories,
    brands,
    products,
    navCategories,
    activeCategory,
    activeBrand,
    childCategories,
    childCategoryCounts,
    categoryByToken,
    categoryByNormalizedToken,
    params: deferredParams,
    scopeCategoryLabel,
    searchResults,
    baseProducts: products,
    filteredProducts: products,
    sortedProducts: products,
    pagedProducts: products,
    totalItems,
    totalPages,
    safePage,
    visiblePages,
    priceBounds,
    activeFilters,
    heading,
    headingNote,
    searchCorrectionNote,
    formatItemsLabel,
    pageSize: PRODUCT_LIST_PAGE_SIZE,
    itemsLabel: `${totalItems} ${formatItemsLabel(totalItems)}`
  };
}

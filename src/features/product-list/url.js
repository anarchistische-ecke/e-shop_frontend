import {
  PRODUCT_LIST_DEFAULT_SORT,
  PRODUCT_LIST_NEW_DEFAULT_SORT
} from './constants';

const TRUTHY_VALUES = new Set(['1', 'true', 'yes']);

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePositiveInteger(value, fallback = 1) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback;
}

function normalizeNullableNumber(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return '';
  }
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric >= 0 ? String(numeric) : '';
}

export function getDefaultProductListSort({ source = 'catalog', categorySlug = '' } = {}) {
  if (source === 'category' && categorySlug === 'new') {
    return PRODUCT_LIST_NEW_DEFAULT_SORT;
  }
  return PRODUCT_LIST_DEFAULT_SORT;
}

export function parseProductListSearchParams(
  searchParams,
  { source = 'catalog', categorySlug = '' } = {}
) {
  const params =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams(searchParams || '');
  const defaultSort = getDefaultProductListSort({ source, categorySlug });

  return {
    query: normalizeString(params.get('query')),
    scope: normalizeString(params.get('scope')),
    brand: normalizeString(params.get('brand')),
    sort: normalizeString(params.get('sort')) || defaultSort,
    minPrice: normalizeNullableNumber(params.get('minPrice')),
    maxPrice: normalizeNullableNumber(params.get('maxPrice')),
    rating: normalizeString(params.get('rating')),
    inStock: TRUTHY_VALUES.has(normalizeString(params.get('inStock')).toLowerCase()),
    sale: TRUTHY_VALUES.has(normalizeString(params.get('sale')).toLowerCase()),
    page: normalizePositiveInteger(params.get('page'), 1),
    original: normalizeString(params.get('original'))
  };
}

export function buildProductListSearchParams(
  values = {},
  { source = 'catalog', categorySlug = '' } = {}
) {
  const params = new URLSearchParams();
  const defaultSort = getDefaultProductListSort({ source, categorySlug });

  if (normalizeString(values.query)) {
    params.set('query', normalizeString(values.query));
  }
  if (normalizeString(values.scope)) {
    params.set('scope', normalizeString(values.scope));
  }
  if (normalizeString(values.brand)) {
    params.set('brand', normalizeString(values.brand));
  }
  if (normalizeString(values.sort) && normalizeString(values.sort) !== defaultSort) {
    params.set('sort', normalizeString(values.sort));
  }
  if (normalizeNullableNumber(values.minPrice)) {
    params.set('minPrice', normalizeNullableNumber(values.minPrice));
  }
  if (normalizeNullableNumber(values.maxPrice)) {
    params.set('maxPrice', normalizeNullableNumber(values.maxPrice));
  }
  if (normalizeString(values.rating)) {
    params.set('rating', normalizeString(values.rating));
  }
  if (values.inStock) {
    params.set('inStock', '1');
  }
  if (values.sale) {
    params.set('sale', '1');
  }
  if (normalizePositiveInteger(values.page, 1) > 1) {
    params.set('page', String(normalizePositiveInteger(values.page, 1)));
  }
  if (normalizeString(values.original) && normalizeString(values.original) !== normalizeString(values.query)) {
    params.set('original', normalizeString(values.original));
  }

  return params;
}

export function buildCatalogSearchHref(values = {}) {
  const params = buildProductListSearchParams(values, { source: 'catalog' });
  const query = params.toString();
  return query ? `/catalog?${query}` : '/catalog';
}

export function buildSearchHref(values = {}) {
  const params = buildProductListSearchParams(values, { source: 'catalog' });
  const query = params.toString();
  return query ? `/search?${query}` : '/search';
}

export function buildCategoryListingHref(categorySlug = '', values = {}) {
  const safeSlug = typeof categorySlug === 'string' ? categorySlug.trim() : '';
  const basePath = safeSlug ? `/category/${safeSlug}` : '/catalog';
  const params = buildProductListSearchParams(
    { ...values, original: '' },
    { source: 'category', categorySlug: safeSlug }
  );
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

import { getDefaultProductListSort } from '../features/product-list/url';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePositiveInteger(value, fallback = 1) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback;
}

export function hasListingSeoVariant(params = {}, { source = 'catalog', categorySlug = '' } = {}) {
  const defaultSort = getDefaultProductListSort({ source, categorySlug });
  return Boolean(
    normalizeText(params.query) ||
      normalizeText(params.scope) ||
      normalizeText(params.brand) ||
      normalizeText(params.minPrice) ||
      normalizeText(params.maxPrice) ||
      normalizeText(params.original) ||
      params.inStock ||
      params.sale ||
      normalizePositiveInteger(params.page, 1) > 1 ||
      (normalizeText(params.sort) && normalizeText(params.sort) !== defaultSort)
  );
}

export function getListingCanonicalPath({ source = 'catalog', categorySlug = '' } = {}) {
  if (source === 'category' && normalizeText(categorySlug)) {
    return `/category/${normalizeText(categorySlug)}`;
  }
  return '/catalog';
}

export function getListingRobots(params = {}, options = {}) {
  return hasListingSeoVariant(params, options) ? 'noindex,follow' : undefined;
}

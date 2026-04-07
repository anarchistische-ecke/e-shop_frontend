import { normalizeSearchText } from '../../utils/search';
import { getProductPrice, moneyToNumber } from '../../utils/product';

export function resolveCategoryToken(category) {
  return String(category?.slug || category?.id || category?.name || '');
}

export function resolveProductCategoryToken(product) {
  const categoryValue =
    product?.category ||
    product?.categoryId ||
    product?.category_id ||
    product?.categorySlug ||
    product?.category_slug ||
    product?.category?.id ||
    product?.category?.slug ||
    product?.category?.name;

  return String(
    typeof categoryValue === 'string'
      ? categoryValue
      : categoryValue?.id || categoryValue?.slug || categoryValue?.name || ''
  );
}

export function resolveBrandToken(product) {
  if (!product) return '';
  if (typeof product.brand === 'string') return product.brand;
  if (product.brand && typeof product.brand === 'object') {
    return product.brand.slug || product.brand.id || product.brand.name || '';
  }
  return product.brandSlug || product.brandId || product.brand_id || '';
}

export function getStockCount(product) {
  if (!product) return 0;
  if (product.stock !== undefined || product.stockQuantity !== undefined) {
    return Number(product.stock ?? product.stockQuantity ?? 0);
  }
  const variants = Array.isArray(product.variants)
    ? product.variants
    : Array.from(product.variants || []);
  return variants.reduce(
    (sum, variant) => sum + Number(variant?.stock ?? variant?.stockQuantity ?? 0),
    0
  );
}

export function getReviewCount(product) {
  return Number(product?.reviewCount || product?.reviewsCount || product?.reviews_count || 0);
}

export function sortCategories(categories = []) {
  return categories
    .slice()
    .sort(
      (a, b) =>
        (a.position ?? 0) - (b.position ?? 0) ||
        (a.name || '').localeCompare(b.name || '')
    );
}

export function buildCategoryCollections(categories = []) {
  const list = Array.isArray(categories) ? categories : [];
  const categoryByToken = {};
  const categoryByNormalizedToken = {};
  const childrenByParent = {};

  list.forEach((category) => {
    const token = resolveCategoryToken(category);
    if (token) {
      categoryByToken[token] = category;
    }

    const normalizedToken = normalizeSearchText(token);
    if (normalizedToken) {
      categoryByNormalizedToken[normalizedToken] = category;
    }

    const normalizedId = normalizeSearchText(String(category?.id || ''));
    if (normalizedId) {
      categoryByNormalizedToken[normalizedId] = category;
    }

    const normalizedSlug = normalizeSearchText(String(category?.slug || ''));
    if (normalizedSlug) {
      categoryByNormalizedToken[normalizedSlug] = category;
    }

    const parentToken = String(category?.parentId || '');
    if (!parentToken) {
      return;
    }

    if (!childrenByParent[parentToken]) {
      childrenByParent[parentToken] = [];
    }
    childrenByParent[parentToken].push(category);
  });

  Object.keys(childrenByParent).forEach((parentToken) => {
    childrenByParent[parentToken] = sortCategories(childrenByParent[parentToken]);
  });

  return {
    navCategories: sortCategories(list.filter((category) => !category?.parentId)),
    categoryByToken,
    categoryByNormalizedToken,
    childrenByParent
  };
}

export function buildDiversityRanking(list = []) {
  if (!list.length) return new Map();

  const byPrice = [...list].sort((a, b) => getProductPrice(a) - getProductPrice(b));
  const bucketCount = 3;
  const buckets = Array.from({ length: bucketCount }, () => []);

  byPrice.forEach((item, index) => {
    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.floor((index / Math.max(1, byPrice.length - 1)) * bucketCount)
    );
    buckets[bucketIndex].push(item);
  });

  buckets.forEach((bucket) => {
    bucket.sort((a, b) => {
      const ratingDelta = (b?.rating || 0) - (a?.rating || 0);
      if (ratingDelta !== 0) return ratingDelta;
      return getReviewCount(b) - getReviewCount(a);
    });
  });

  const ordered = [];
  let hasItems = true;
  while (hasItems) {
    hasItems = false;
    buckets.forEach((bucket) => {
      if (bucket.length > 0) {
        hasItems = true;
        ordered.push(bucket.shift());
      }
    });
  }

  const ranking = new Map();
  ordered.forEach((item, index) => {
    ranking.set(item.id, ordered.length - index);
  });

  return ranking;
}

export function buildPriceBounds(products = []) {
  const prices = products
    .map((product) => getProductPrice(product))
    .filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getDiscountRate(product) {
  const oldPrice = product?.oldPrice ? moneyToNumber(product.oldPrice) : 0;
  const currentPrice = getProductPrice(product);
  return oldPrice > currentPrice ? (oldPrice - currentPrice) / oldPrice : 0;
}

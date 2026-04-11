import { useDeferredValue, useMemo } from 'react';
import { getProductPrice } from '../../utils/product';
import {
  normalizeSearchText,
  resolveSearchCorrection,
  searchProducts
} from '../../utils/search';
import { PRODUCT_LIST_PAGE_SIZE } from './constants';
import { useProductDirectoryData } from './data';
import {
  buildCategoryCollections,
  buildDiversityRanking,
  buildPriceBounds,
  getDiscountRate,
  getReviewCount,
  getStockCount,
  resolveBrandToken,
  resolveCategoryToken,
  resolveProductCategoryToken,
  sortCategories
} from './selectors';

function buildCategoryTokenSet(activeCategory, childrenByParent) {
  if (!activeCategory) {
    return new Set();
  }

  const tokens = new Set();
  const queue = [activeCategory];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    tokens.add(normalizeSearchText(resolveCategoryToken(current)));
    tokens.add(normalizeSearchText(String(current.id || '')));
    const children = childrenByParent[String(current.id)] || [];
    queue.push(...children);
  }

  return tokens;
}

function buildSearchRank(products = []) {
  const rank = new Map();
  products.forEach((product, index) => {
    rank.set(product.id, products.length - index);
  });
  return rank;
}

function formatItemsLabel(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара';
  return 'товаров';
}

export function useProductList({ source = 'catalog', categorySlug = '', params = {} } = {}) {
  const { categories, brands, products, loading, error } = useProductDirectoryData();

  const deferredParams = useDeferredValue(params);
  const normalizedQuery = normalizeSearchText(deferredParams.query || '');
  const normalizedScope = normalizeSearchText(deferredParams.scope || '');
  const normalizedOriginal = normalizeSearchText(deferredParams.original || '');
  const minRatingValue = deferredParams.rating ? Number(deferredParams.rating) : 0;

  const {
    navCategories,
    categoryByToken,
    categoryByNormalizedToken,
    childrenByParent
  } = useMemo(() => buildCategoryCollections(categories), [categories]);

  const activeCategory = useMemo(() => {
    if (source !== 'category') {
      return null;
    }
    return (
      categories.find(
        (category) =>
          resolveCategoryToken(category) === categorySlug ||
          String(category.id) === categorySlug
      ) || null
    );
  }, [categories, categorySlug, source]);

  const categoryTokensForListing = useMemo(
    () => buildCategoryTokenSet(activeCategory, childrenByParent),
    [activeCategory, childrenByParent]
  );

  const scopeCategory = useMemo(() => {
    if (!normalizedScope) {
      return null;
    }
    return categoryByNormalizedToken[normalizedScope] || null;
  }, [categoryByNormalizedToken, normalizedScope]);

  const categoryTokensForScope = useMemo(() => {
    if (source !== 'catalog' || !normalizedScope) {
      return new Set();
    }

    if (scopeCategory) {
      return buildCategoryTokenSet(scopeCategory, childrenByParent);
    }

    return new Set([normalizedScope]);
  }, [childrenByParent, normalizedScope, scopeCategory, source]);

  const categoryNameByToken = useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      const token = normalizeSearchText(resolveCategoryToken(category));
      if (!token) return;
      map[token] = category.name;
      map[normalizeSearchText(String(category.id || ''))] = category.name;
      map[normalizeSearchText(String(category.slug || ''))] = category.name;
    });
    return map;
  }, [categories]);

  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return {
        list: products,
        appliedQuery: '',
        correctionApplied: false
      };
    }

    const initial = searchProducts(products, normalizedQuery, {
      categoryNameByToken,
      scopeToken: normalizedScope,
      allowFuzzy: true
    });

    if (initial.length > 0) {
      return {
        list: initial,
        appliedQuery: normalizedQuery,
        correctionApplied: false
      };
    }

    const dictionary = [
      ...categories.map((category) => category.name),
      ...products.map((product) => product.name)
    ];
    const correction = resolveSearchCorrection(normalizedQuery, dictionary);
    if (!correction.isCorrected || !correction.correctedQuery) {
      return {
        list: initial,
        appliedQuery: normalizedQuery,
        correctionApplied: false
      };
    }

    const correctedResults = searchProducts(products, correction.correctedQuery, {
      categoryNameByToken,
      scopeToken: normalizedScope,
      allowFuzzy: true
    });

    return {
      list: correctedResults,
      appliedQuery: correction.correctedQuery,
      correctionApplied: correctedResults.length > 0
    };
  }, [categories, categoryNameByToken, normalizedQuery, normalizedScope, products]);

  const baseProducts = useMemo(() => {
    let scopedProducts = products;

    if (source === 'category' && activeCategory && categoryTokensForListing.size > 0) {
      scopedProducts = products.filter((product) => {
        const token = normalizeSearchText(resolveProductCategoryToken(product));
        return categoryTokensForListing.has(token);
      });
    }

    if (source === 'catalog' && normalizedScope && categoryTokensForScope.size > 0) {
      scopedProducts = scopedProducts.filter((product) => {
        const token = normalizeSearchText(resolveProductCategoryToken(product));
        return categoryTokensForScope.has(token);
      });
    }

    if (!normalizedQuery) {
      return scopedProducts;
    }

    if (source === 'category') {
      return searchResults.list.filter((product) => {
        const token = normalizeSearchText(resolveProductCategoryToken(product));
        return !categoryTokensForListing.size || categoryTokensForListing.has(token);
      });
    }

    return searchResults.list;
  }, [
    activeCategory,
    categoryTokensForScope,
    categoryTokensForListing,
    normalizedScope,
    normalizedQuery,
    products,
    searchResults.list,
    source
  ]);

  const priceBounds = useMemo(
    () => buildPriceBounds(baseProducts),
    [baseProducts]
  );

  const priceFilter = useMemo(() => {
    const minValue = deferredParams.minPrice !== '' ? Number(deferredParams.minPrice) : null;
    const maxValue = deferredParams.maxPrice !== '' ? Number(deferredParams.maxPrice) : null;
    let safeMin = Number.isFinite(minValue) ? minValue : null;
    let safeMax = Number.isFinite(maxValue) ? maxValue : null;

    if (safeMin !== null && safeMax !== null && safeMin > safeMax) {
      [safeMin, safeMax] = [safeMax, safeMin];
    }

    return { min: safeMin, max: safeMax };
  }, [deferredParams.maxPrice, deferredParams.minPrice]);

  const filteredProducts = useMemo(() => {
    return baseProducts.filter((product) => {
      if (deferredParams.brand) {
        const brandToken = String(resolveBrandToken(product));
        if (!brandToken || brandToken !== deferredParams.brand) {
          return false;
        }
      }

      const productPrice = getProductPrice(product);
      if (priceFilter.min !== null && productPrice < priceFilter.min) return false;
      if (priceFilter.max !== null && productPrice > priceFilter.max) return false;
      if (minRatingValue && Number(product?.rating || 0) < minRatingValue) return false;
      if (deferredParams.inStock && getStockCount(product) <= 0) return false;
      if (deferredParams.sale && getDiscountRate(product) <= 0) return false;
      return true;
    });
  }, [
    baseProducts,
    deferredParams.brand,
    deferredParams.inStock,
    deferredParams.sale,
    minRatingValue,
    priceFilter
  ]);

  const diversityRank = useMemo(
    () => buildDiversityRanking(filteredProducts),
    [filteredProducts]
  );

  const searchRank = useMemo(
    () => buildSearchRank(searchResults.list),
    [searchResults.list]
  );

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    const hasQuery = Boolean(normalizedQuery);

    const sorters = {
      bestMatch: (a, b) => {
        const rankA = hasQuery ? (searchRank.get(a.id) || 0) : (diversityRank.get(a.id) || 0);
        const rankB = hasQuery ? (searchRank.get(b.id) || 0) : (diversityRank.get(b.id) || 0);
        if (rankB !== rankA) return rankB - rankA;

        const ratingDelta = (b?.rating || 0) - (a?.rating || 0);
        if (ratingDelta !== 0) return ratingDelta;
        return getReviewCount(b) - getReviewCount(a);
      },
      newest: (a, b) => String(b.id).localeCompare(String(a.id)),
      priceAsc: (a, b) => getProductPrice(a) - getProductPrice(b),
      priceDesc: (a, b) => getProductPrice(b) - getProductPrice(a),
      rating: (a, b) => {
        const ratingDelta = (b?.rating || 0) - (a?.rating || 0);
        if (ratingDelta !== 0) return ratingDelta;
        return getReviewCount(b) - getReviewCount(a);
      },
      discount: (a, b) => getDiscountRate(b) - getDiscountRate(a)
    };

    const sorter = sorters[deferredParams.sort] || sorters.bestMatch;
    list.sort(sorter);
    return list;
  }, [deferredParams.sort, diversityRank, filteredProducts, normalizedQuery, searchRank]);

  const totalItems = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PRODUCT_LIST_PAGE_SIZE));
  const safePage = Math.min(deferredParams.page || 1, totalPages);
  const pagedProducts = useMemo(
    () =>
      sortedProducts.slice(
        (safePage - 1) * PRODUCT_LIST_PAGE_SIZE,
        safePage * PRODUCT_LIST_PAGE_SIZE
      ),
    [safePage, sortedProducts]
  );

  const visiblePages = useMemo(() => {
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
  }, [safePage, totalPages]);

  const activeBrand = useMemo(
    () => brands.find((brand) => String(brand.slug || brand.id) === deferredParams.brand) || null,
    [brands, deferredParams.brand]
  );

  const childCategories = useMemo(() => {
    if (!activeCategory) return [];
    return sortCategories(
      categories.filter(
        (category) => String(category.parentId || '') === String(activeCategory.id || '')
      )
    );
  }, [activeCategory, categories]);

  const childCategoryCounts = useMemo(() => {
    if (!childCategories.length) return {};

    const tokens = new Set(
      childCategories.map((category) => normalizeSearchText(resolveCategoryToken(category)))
    );

    return baseProducts.reduce((accumulator, product) => {
      const token = normalizeSearchText(resolveProductCategoryToken(product));
      if (!tokens.has(token)) {
        return accumulator;
      }
      accumulator[token] = (accumulator[token] || 0) + 1;
      return accumulator;
    }, {});
  }, [baseProducts, childCategories]);

  const scopeCategoryLabel = useMemo(() => {
    if (!normalizedScope) {
      return '';
    }
    return categoryByNormalizedToken[normalizedScope]?.name || normalizedScope;
  }, [categoryByNormalizedToken, normalizedScope]);

  const heading = source === 'category'
    ? activeCategory?.name || 'Каталог'
    : 'Каталог';

  const headingNote = source === 'category'
    ? activeCategory?.description || ''
    : normalizedQuery
    ? 'Подбираем товары по запросу и фильтрам. Сохраняйте ссылку: параметры уже в URL.'
    : 'Сначала оцените ассортимент, затем уточняйте фильтрами. По умолчанию показываем разные модели, а не дубли.';

  const searchCorrectionNote = (() => {
    if (!normalizedQuery) return '';
    if (normalizedOriginal && normalizedOriginal !== normalizedQuery) {
      return `Показываем результаты для “${deferredParams.query}”. Ваш запрос: “${deferredParams.original}”.`;
    }
    if (searchResults.correctionApplied && searchResults.appliedQuery) {
      return `Показываем результаты для “${searchResults.appliedQuery}”. Ваш запрос: “${deferredParams.query}”.`;
    }
    return '';
  })();

  const activeFilters = [];

  if (deferredParams.brand) {
    activeFilters.push({ key: 'brand', label: `Бренд: ${activeBrand?.name || deferredParams.brand}` });
  }
  if (normalizedScope) {
    activeFilters.push({ key: 'scope', label: `Категория: ${scopeCategoryLabel || normalizedScope}` });
  }
  if (priceFilter.min !== null || priceFilter.max !== null) {
    const parts = [];
    if (priceFilter.min !== null) parts.push(`от ${priceFilter.min.toLocaleString('ru-RU')} ₽`);
    if (priceFilter.max !== null) parts.push(`до ${priceFilter.max.toLocaleString('ru-RU')} ₽`);
    activeFilters.push({ key: 'price', label: `Цена ${parts.join(' ')}` });
  }
  if (minRatingValue) {
    activeFilters.push({ key: 'rating', label: `Рейтинг от ${minRatingValue}` });
  }
  if (deferredParams.inStock) {
    activeFilters.push({ key: 'inStock', label: 'Только в наличии' });
  }
  if (deferredParams.sale) {
    activeFilters.push({ key: 'sale', label: 'Со скидкой' });
  }

  return {
    loading,
    error,
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
    baseProducts,
    filteredProducts,
    sortedProducts,
    pagedProducts,
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

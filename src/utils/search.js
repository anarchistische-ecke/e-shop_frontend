const NON_WORD_REGEXP = /[^\p{L}\p{N}\s-]+/gu;

export function normalizeSearchText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(NON_WORD_REGEXP, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeSearchText(value = '') {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

function levenshteinWithLimit(a = '', b = '', maxDistance = 2) {
  if (a === b) return 0;
  if (!a.length || !b.length) {
    const distance = Math.max(a.length, b.length);
    return distance > maxDistance ? maxDistance + 1 : distance;
  }
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  const previous = new Array(b.length + 1);
  const current = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) {
    previous[j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
      rowMin = Math.min(rowMin, current[j]);
    }

    if (rowMin > maxDistance) return maxDistance + 1;
    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function computeTokenMatchScore(tokens, haystack) {
  if (!tokens.length || !haystack) return 0;

  let score = 0;
  const haystackTokens = tokenizeSearchText(haystack);
  const haystackJoined = haystackTokens.join(' ');

  tokens.forEach((token) => {
    if (haystackJoined.includes(token)) {
      score += 30;
      if (haystackJoined.startsWith(token)) score += 10;
      return;
    }

    if (token.length < 3) return;

    const closeToken = haystackTokens.find((candidate) => {
      const distanceLimit = token.length > 5 ? 2 : 1;
      return levenshteinWithLimit(token, candidate, distanceLimit) <= distanceLimit;
    });

    if (closeToken) {
      score += 12;
    }
  });

  return score;
}

function buildSearchHaystack(product, categoryNameByToken = {}) {
  const parts = [
    product?.name,
    product?.description,
    product?.material,
    product?.size,
    product?.color,
    product?.category,
    product?.categoryName,
    product?.categorySlug,
    product?.category_id,
    product?.categoryId,
    product?.brand?.name,
    product?.brand,
  ];

  const categoryToken = String(
    product?.category ||
      product?.categorySlug ||
      product?.categoryId ||
      product?.category_id ||
      product?.category?.slug ||
      product?.category?.id ||
      ''
  );
  if (categoryToken && categoryNameByToken[categoryToken]) {
    parts.push(categoryNameByToken[categoryToken]);
  }

  const variants = Array.isArray(product?.variants) ? product.variants : Array.from(product?.variants || []);
  variants.forEach((variant) => {
    parts.push(variant?.name, variant?.sku);
  });

  return normalizeSearchText(parts.filter(Boolean).join(' '));
}

function uniqueByLabel(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const token = normalizeSearchText(item?.label || item?.value || item?.name || '');
    if (!token || seen.has(token)) return false;
    seen.add(token);
    return true;
  });
}

export function resolveSearchCorrection(query = '', dictionary = []) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery || normalizedQuery.length < 3) return { correctedQuery: '', isCorrected: false };

  const exactMatch = dictionary.find((entry) => normalizeSearchText(entry) === normalizedQuery);
  if (exactMatch) return { correctedQuery: '', isCorrected: false };

  const candidates = dictionary
    .map((entry) => normalizeSearchText(entry))
    .filter((entry) => entry && entry.length >= 3)
    .slice(0, 1200);

  let best = '';
  let bestDistance = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate) => {
    const limit = normalizedQuery.length > 6 ? 2 : 1;
    const distance = levenshteinWithLimit(normalizedQuery, candidate, limit);
    if (distance > limit) return;

    if (
      distance < bestDistance ||
      (distance === bestDistance && candidate.length < best.length)
    ) {
      best = candidate;
      bestDistance = distance;
    }
  });

  if (!best) return { correctedQuery: '', isCorrected: false };
  return { correctedQuery: best, isCorrected: true };
}

export function searchProducts(products = [], query = '', options = {}) {
  const categoryNameByToken = options.categoryNameByToken || {};
  const scopeToken = normalizeSearchText(options.scopeToken || '');
  const allowFuzzy = options.allowFuzzy !== false;
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeSearchText(normalizedQuery);

  if (!normalizedQuery) {
    return products;
  }

  const results = products
    .map((product) => {
      const haystack = buildSearchHaystack(product, categoryNameByToken);
      if (!haystack) return null;

      const categoryToken = normalizeSearchText(
        product?.category ||
          product?.categorySlug ||
          product?.categoryId ||
          product?.category_id ||
          product?.category?.slug ||
          product?.category?.id ||
          ''
      );

      if (scopeToken && categoryToken && scopeToken !== categoryToken) {
        return null;
      }

      const directHit = haystack.includes(normalizedQuery);
      let score = directHit ? 120 : 0;
      score += computeTokenMatchScore(tokens, haystack);

      if (!score && allowFuzzy) {
        const fuzzyHit = tokens.some((token) => {
          if (token.length < 4) return false;
          return haystack
            .split(' ')
            .some((candidate) => levenshteinWithLimit(token, candidate, 2) <= 2);
        });
        if (fuzzyHit) score += 24;
      }

      if (!score) return null;

      const ratingBoost = Number(product?.rating || 0) * 2;
      const reviewBoost = Number(product?.reviewCount || product?.reviewsCount || 0) > 10 ? 3 : 0;

      return {
        product,
        score: score + ratingBoost + reviewBoost,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);

  return results;
}

export function buildAutocompleteData({
  query = '',
  products = [],
  categories = [],
  scopeToken = '',
  queryLimit = 6,
  productLimit = 5,
} = {}) {
  const normalizedQuery = normalizeSearchText(query);
  const activeScope = normalizeSearchText(scopeToken || '');
  const categoryNameByToken = {};

  categories.forEach((category) => {
    const token = normalizeSearchText(category?.slug || category?.id || category?.name || '');
    if (!token) return;
    categoryNameByToken[token] = category?.name || token;
  });

  if (!normalizedQuery) {
    return {
      suggestedQueries: [],
      productSuggestions: [],
      correctedQuery: '',
      hasCorrection: false,
    };
  }

  const searchPool = products.filter((product) => product?.isActive !== false);
  let matchedProducts = searchProducts(searchPool, normalizedQuery, {
    categoryNameByToken,
    scopeToken: activeScope,
    allowFuzzy: true,
  });

  const dictionary = [
    ...categories.map((category) => category?.name || ''),
    ...searchPool.map((product) => product?.name || ''),
  ]
    .map((value) => normalizeSearchText(value))
    .filter(Boolean);

  let correction = { correctedQuery: '', isCorrected: false };
  if (!matchedProducts.length) {
    correction = resolveSearchCorrection(normalizedQuery, dictionary);
    if (correction.isCorrected && correction.correctedQuery) {
      matchedProducts = searchProducts(searchPool, correction.correctedQuery, {
        categoryNameByToken,
        scopeToken: activeScope,
        allowFuzzy: true,
      });
    }
  }

  const suggestedQueries = uniqueByLabel([
    ...categories
      .filter((category) =>
        normalizeSearchText(category?.name || '').includes(normalizedQuery)
      )
      .map((category) => ({
        label: category?.name || '',
        scopeToken: normalizeSearchText(category?.slug || category?.id || category?.name || ''),
      })),
    ...matchedProducts.slice(0, queryLimit).map((product) => ({
      label: product?.name || '',
      scopeToken: normalizeSearchText(
        product?.category ||
          product?.categorySlug ||
          product?.categoryId ||
          product?.category_id ||
          product?.category?.slug ||
          product?.category?.id ||
          ''
      ),
    })),
  ]).slice(0, queryLimit);

  return {
    suggestedQueries,
    productSuggestions: matchedProducts.slice(0, productLimit),
    correctedQuery: correction.correctedQuery,
    hasCorrection: correction.isCorrected,
  };
}

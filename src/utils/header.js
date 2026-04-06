import { normalizeSearchText } from './search';

export function resolveCategoryToken(category) {
  return String(category?.slug || category?.id || category?.name || '');
}

export function resolveWayfindingLabel(pathname = '') {
  if (pathname === '/') return 'Главная';
  if (pathname.startsWith('/catalog')) return 'Каталог';
  if (pathname.startsWith('/category/search')) return 'Поиск';
  if (pathname.startsWith('/category/')) return 'Категория';
  if (pathname.startsWith('/product/')) return 'Карточка товара';
  if (pathname.startsWith('/cart')) return 'Корзина';
  if (pathname.startsWith('/checkout')) return 'Оформление';
  if (pathname.startsWith('/account')) return 'Личный кабинет';
  return 'Раздел магазина';
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

export function buildHeaderSearchParams({
  queryValue,
  scopeValue = '',
  originalQuery = '',
  categoryByNormalizedToken = {}
}) {
  const params = new URLSearchParams();
  params.set('query', String(queryValue || ''));

  if (scopeValue) {
    const scopeCategory = categoryByNormalizedToken[scopeValue];
    params.set('scope', scopeValue);
    if (scopeCategory?.name) {
      params.set('scopeLabel', scopeCategory.name);
    }
  }

  if (
    originalQuery &&
    normalizeSearchText(originalQuery) !== normalizeSearchText(queryValue)
  ) {
    params.set('original', originalQuery);
    params.set('corrected', queryValue);
  }

  return params;
}

export function buildAccountLinks(isManager) {
  if (isManager) {
    return [
      { to: '/account#overview', label: 'Сводка' },
      { to: '/account#orders', label: 'Заказы' },
      { to: '/cart', label: 'Ссылка на оплату' }
    ];
  }

  return [
    { to: '/account#profile', label: 'Профиль' },
    { to: '/account#bonuses', label: 'Уютные бонусы' },
    { to: '/account#promocodes', label: 'Мои промокоды' },
    { to: '/account#referral', label: 'Приведи друга' },
    { to: '/account#orders', label: 'Мои заказы' },
    { to: '/account#purchases', label: 'Купленные товары' }
  ];
}

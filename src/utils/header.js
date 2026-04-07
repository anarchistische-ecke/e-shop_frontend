import { buildCatalogSearchHref } from '../features/product-list/url';
import {
  buildCategoryCollections,
  resolveCategoryToken,
  sortCategories
} from '../features/product-list/selectors';
import { normalizeSearchText } from './search';

export { buildCategoryCollections, resolveCategoryToken, sortCategories };

export function resolveWayfindingLabel(pathname = '', search = '') {
  if (pathname === '/') return 'Главная';
  if (pathname.startsWith('/catalog')) {
    const params = new URLSearchParams(search || '');
    return params.get('query') ? 'Поиск' : 'Каталог';
  }
  if (pathname.startsWith('/category/search')) return 'Поиск';
  if (pathname.startsWith('/category/')) return 'Категория';
  if (pathname.startsWith('/product/')) return 'Карточка товара';
  if (pathname.startsWith('/cart')) return 'Корзина';
  if (pathname.startsWith('/checkout')) return 'Оформление';
  if (pathname.startsWith('/account')) return 'Личный кабинет';
  return 'Раздел магазина';
}

export function buildHeaderSearchParams({
  queryValue,
  scopeValue = '',
  originalQuery = ''
}) {
  const href = buildCatalogSearchHref({
    query: String(queryValue || ''),
    scope: scopeValue,
    original:
      originalQuery &&
      normalizeSearchText(originalQuery) !== normalizeSearchText(queryValue)
        ? originalQuery
        : ''
  });
  const [_, search = ''] = href.split('?');
  return new URLSearchParams(search);
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

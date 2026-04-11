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
  if (pathname.startsWith('/search')) return 'Поиск';
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

export function shouldShowMobileBottomNav(pathname = '') {
  if (!pathname) return false;
  if (pathname.startsWith('/admin')) return false;
  if (pathname === '/manager/login') return false;
  if (pathname.startsWith('/product/')) return false;
  if (pathname.startsWith('/checkout')) return false;
  if (pathname.startsWith('/order/')) return false;
  if (pathname === '/login') return false;
  return true;
}

export function resolveMobileBottomNavKey({
  pathname = '',
  search = '',
  isMenuOpen = false,
  isSearchPanelVisible = false
} = {}) {
  if (isMenuOpen) return 'catalog';
  if (pathname.startsWith('/search')) return 'search';
  if (isSearchPanelVisible) return 'search';
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/catalog')) {
    const params = new URLSearchParams(search || '');
    return params.get('query') ? 'search' : 'catalog';
  }
  if (pathname.startsWith('/category/')) return 'catalog';
  if (pathname.startsWith('/account') || pathname === '/login') return 'account';
  if (pathname.startsWith('/cart')) return 'cart';
  return '';
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

import { matchPath } from 'react-router-dom';

export const routeSeoConfig = {
  home: {
    title: 'Домашний текстиль для уютного дома',
    description:
      'Постельное белье, пледы, полотенца и домашний текстиль с доставкой по России. Натуральные ткани, безопасная оплата и понятные условия покупки.',
    canonicalPath: '/'
  },
  'category-search': {
    title: 'Поиск',
    description: 'Поиск по каталогу домашнего текстиля.',
    canonicalPath: '/search',
    robots: 'noindex,follow'
  },
  search: {
    title: 'Поиск',
    description: 'Поиск по каталогу домашнего текстиля.',
    canonicalPath: '/search',
    robots: 'noindex,follow'
  },
  cart: {
    title: 'Корзина',
    description: 'Корзина покупателя интернет-магазина домашнего текстиля.',
    canonicalPath: '/cart',
    robots: 'noindex,nofollow'
  },
  checkout: {
    title: 'Оформление заказа',
    description: 'Оформление заказа в интернет-магазине домашнего текстиля.',
    canonicalPath: '/checkout',
    robots: 'noindex,nofollow'
  },
  login: {
    title: 'Вход',
    description: 'Вход в личный кабинет покупателя.',
    canonicalPath: '/login',
    robots: 'noindex,nofollow'
  },
  account: {
    title: 'Личный кабинет',
    description: 'Личный кабинет покупателя.',
    canonicalPath: '/account',
    robots: 'noindex,nofollow'
  },
  order: {
    title: 'Статус заказа',
    description: 'Страница заказа покупателя.',
    canonicalPath: '/order',
    robots: 'noindex,nofollow'
  },
  'manager-login': {
    title: 'Вход для менеджера',
    description: 'Вход в кабинет менеджера.',
    canonicalPath: '/manager/login',
    robots: 'noindex,nofollow'
  },
  'manager-payment-link': {
    title: 'Ссылка на оплату',
    description: 'Создание ссылки на оплату заказа менеджером.',
    canonicalPath: '/manager/payment-link',
    robots: 'noindex,nofollow'
  },
  'legacy-admin-redirect': {
    title: 'Администрирование',
    description: 'Служебный раздел сайта.',
    canonicalPath: '/manager/login',
    robots: 'noindex,nofollow'
  },
  'not-found': {
    title: '404',
    description: 'Страница не найдена.',
    canonicalPath: '/404',
    robots: 'noindex,nofollow'
  }
};

export const storefrontRouteConfig = [
  { id: 'home', path: '/', renderMode: 'ssr', seo: routeSeoConfig.home },
  { id: 'category-search', path: '/category/search', renderMode: 'csr', seo: routeSeoConfig['category-search'] },
  { id: 'search', path: '/search', renderMode: 'csr', seo: routeSeoConfig.search },
  { id: 'category', path: '/category/:slug', renderMode: 'ssr' },
  { id: 'product', path: '/product/:id/:slug', renderMode: 'ssr' },
  { id: 'product', path: '/product/:id', renderMode: 'ssr' },
  { id: 'cart', path: '/cart', renderMode: 'csr', seo: routeSeoConfig.cart },
  { id: 'checkout', path: '/checkout', renderMode: 'csr', seo: routeSeoConfig.checkout },
  { id: 'login', path: '/login', renderMode: 'csr', seo: routeSeoConfig.login },
  { id: 'account', path: '/account', renderMode: 'csr', seo: routeSeoConfig.account },
  { id: 'about', path: '/about', renderMode: 'ssr' },
  { id: 'order', path: '/order/:token', renderMode: 'csr', seo: routeSeoConfig.order },
  { id: 'payment-info', path: '/info/payment', renderMode: 'ssr' },
  { id: 'delivery-info', path: '/info/delivery', renderMode: 'ssr' },
  { id: 'production-info', path: '/info/production', renderMode: 'ssr' },
  { id: 'catalog', path: '/catalog', renderMode: 'ssr' },
  { id: 'legal-info', path: '/info/legal', renderMode: 'ssr' },
  { id: 'privacy-policy', path: '/konfidentsialnost-i-zashchita-informatsii', renderMode: 'ssr' },
  { id: 'user-agreement', path: '/polzovatelskoe-soglashenie', renderMode: 'ssr' },
  { id: 'ads-consent', path: '/soglasie-na-poluchenie-reklamy', renderMode: 'ssr' },
  { id: 'sales-terms', path: '/usloviya-prodazhi', renderMode: 'ssr' },
  { id: 'cookies-policy', path: '/kuki', renderMode: 'ssr' },
  { id: 'personal-data-consent', path: '/soglasie-na-obrabotku-pd', renderMode: 'ssr' },
  { id: 'manager-login', path: '/manager/login', renderMode: 'csr', seo: routeSeoConfig['manager-login'] },
  { id: 'manager-payment-link', path: '/manager/payment-link', renderMode: 'csr', seo: routeSeoConfig['manager-payment-link'] },
  { id: 'legacy-admin-redirect', path: '/admin/*', renderMode: 'csr', seo: routeSeoConfig['legacy-admin-redirect'] }
];

export const notFoundRouteConfig = {
  id: 'not-found',
  path: '*',
  renderMode: 'ssr',
  seo: routeSeoConfig['not-found']
};

export function getAllStorefrontRouteConfigs() {
  return [...storefrontRouteConfig, notFoundRouteConfig];
}

export function matchStorefrontRoute(pathname = '/') {
  for (const route of storefrontRouteConfig) {
    const match = matchPath(route.path, pathname);
    if (match) {
      return {
        route,
        params: match.params || {}
      };
    }
  }

  return {
    route: notFoundRouteConfig,
    params: {}
  };
}

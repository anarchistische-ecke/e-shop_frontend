import { matchPath } from 'react-router-dom';

export const storefrontRouteConfig = [
  { id: 'home', path: '/', renderMode: 'ssr' },
  { id: 'category-search', path: '/category/search', renderMode: 'csr' },
  { id: 'search', path: '/search', renderMode: 'csr' },
  { id: 'category', path: '/category/:slug', renderMode: 'ssr' },
  { id: 'product', path: '/product/:id/:slug', renderMode: 'ssr' },
  { id: 'product', path: '/product/:id', renderMode: 'ssr' },
  { id: 'cart', path: '/cart', renderMode: 'csr' },
  { id: 'checkout', path: '/checkout', renderMode: 'csr' },
  { id: 'login', path: '/login', renderMode: 'csr' },
  { id: 'account', path: '/account', renderMode: 'csr' },
  { id: 'about', path: '/about', renderMode: 'ssr' },
  { id: 'order', path: '/order/:token', renderMode: 'csr' },
  { id: 'payment-info', path: '/info/payment', renderMode: 'ssr' },
  { id: 'delivery-info', path: '/info/delivery', renderMode: 'ssr' },
  { id: 'bonuses-info', path: '/info/bonuses', renderMode: 'ssr' },
  { id: 'production-info', path: '/info/production', renderMode: 'ssr' },
  { id: 'catalog', path: '/catalog', renderMode: 'ssr' },
  { id: 'legal-info', path: '/info/legal', renderMode: 'ssr' },
  { id: 'privacy-policy', path: '/konfidentsialnost-i-zashchita-informatsii', renderMode: 'ssr' },
  { id: 'user-agreement', path: '/polzovatelskoe-soglashenie', renderMode: 'ssr' },
  { id: 'ads-consent', path: '/soglasie-na-poluchenie-reklamy', renderMode: 'ssr' },
  { id: 'sales-terms', path: '/usloviya-prodazhi', renderMode: 'ssr' },
  { id: 'cookies-policy', path: '/cookies', renderMode: 'ssr' },
  { id: 'personal-data-consent', path: '/soglasie-na-obrabotku-pd', renderMode: 'ssr' },
  { id: 'admin-login', path: '/admin/login', renderMode: 'csr' },
  { id: 'manager-login', path: '/manager/login', renderMode: 'csr' },
  { id: 'admin-app', path: '/admin/*', renderMode: 'csr' }
];

export const notFoundRouteConfig = {
  id: 'not-found',
  path: '*',
  renderMode: 'ssr'
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

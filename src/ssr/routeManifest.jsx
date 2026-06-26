import React, { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import {
  getAllStorefrontRouteConfigs,
  notFoundRouteConfig,
  storefrontRouteConfig
} from './routeConfig';

const AboutPage = lazy(() => import('../pages/AboutPage'));
const CataloguePage = lazy(() => import('../pages/CataloguePage'));
const CategoryPage = lazy(() => import('../pages/CategoryPage'));
const DeliveryInfoPage = lazy(() => import('../pages/DeliveryInfoPage'));
const LegalInfoPage = lazy(() => import('../pages/LegalInfoPage'));
const PaymentInfoPage = lazy(() => import('../pages/PaymentInfoPage'));
const ProductPage = lazy(() => import('../pages/ProductPage'));
const ProductionInfoPage = lazy(() => import('../pages/ProductionInfoPage'));
const AdsConsentPage = lazy(() => import('../pages/legal/AdsConsentPage'));
const CookiesPolicyPage = lazy(() => import('../pages/legal/CookiesPolicyPage'));
const PersonalDataConsentPage = lazy(() => import('../pages/legal/PersonalDataConsentPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/legal/PrivacyPolicyPage'));
const SalesTermsPage = lazy(() => import('../pages/legal/SalesTermsPage'));
const UserAgreementPage = lazy(() => import('../pages/legal/UserAgreementPage'));
const AccountPage = lazy(() => import('../pages/AccountPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const ManagerLoginPage = lazy(() => import('../pages/ManagerLoginPage'));
const ManagerPaymentLinkPage = lazy(() => import('../pages/ManagerPaymentLinkPage'));
const OrderPage = lazy(() => import('../pages/OrderPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const SearchRedirectPage = lazy(() => import('../pages/SearchRedirectPage'));

function RouteFallback({ isStandaloneRoute = false }) {
  return (
    <div
      className={
        isStandaloneRoute
          ? 'flex min-h-screen items-center justify-center px-4 py-10 text-sm text-muted'
          : 'page-shell page-section text-center text-sm text-muted'
      }
    >
      Загружаем страницу…
    </div>
  );
}

function CsrRoute(routeElement, options = {}) {
  return (
    <Suspense fallback={<RouteFallback isStandaloneRoute={options.isStandaloneRoute} />}>
      {routeElement}
    </Suspense>
  );
}

const routeRenderers = {
  home: () => <Home />,
  'category-search': () => CsrRoute(<SearchRedirectPage />),
  search: () => CsrRoute(<SearchPage />),
  category: () => CsrRoute(<CategoryPage />),
  product: () => CsrRoute(<ProductPage />),
  cart: () => CsrRoute(<CartPage />),
  checkout: () => CsrRoute(<CheckoutPage />),
  login: () => CsrRoute(<LoginPage />),
  account: () => CsrRoute(<AccountPage />),
  about: () => CsrRoute(<AboutPage />),
  order: () => CsrRoute(<OrderPage />),
  'payment-info': () => CsrRoute(<PaymentInfoPage />),
  'delivery-info': () => CsrRoute(<DeliveryInfoPage />),
  'production-info': () => CsrRoute(<ProductionInfoPage />),
  catalog: () => CsrRoute(<CataloguePage />),
  'legal-info': () => CsrRoute(<LegalInfoPage />),
  'privacy-policy': () => CsrRoute(<PrivacyPolicyPage />),
  'user-agreement': () => CsrRoute(<UserAgreementPage />),
  'ads-consent': () => CsrRoute(<AdsConsentPage />),
  'sales-terms': () => CsrRoute(<SalesTermsPage />),
  'cookies-policy': () => CsrRoute(<CookiesPolicyPage />),
  'personal-data-consent': () => CsrRoute(<PersonalDataConsentPage />),
  'manager-login': () => CsrRoute(<ManagerLoginPage />, { isStandaloneRoute: true }),
  'manager-payment-link': () => CsrRoute(<ManagerPaymentLinkPage />),
  'legacy-admin-redirect': () => <Navigate to="/manager/login" replace />,
  'not-found': () => <NotFound />
};

export const storefrontRoutes = storefrontRouteConfig.map((route) => ({
  ...route,
  renderElement: routeRenderers[route.id]
}));

export const notFoundRoute = {
  ...notFoundRouteConfig,
  renderElement: routeRenderers['not-found']
};

export function getAllStorefrontRoutes() {
  return getAllStorefrontRouteConfigs().map((route) => ({
    ...route,
    renderElement: routeRenderers[route.id]
  }));
}

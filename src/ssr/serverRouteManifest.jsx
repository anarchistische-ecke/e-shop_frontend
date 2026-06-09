import React, { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import AboutPage from '../pages/AboutPage';
import CataloguePage from '../pages/CataloguePage';
import CategoryPage from '../pages/CategoryPage';
import DeliveryInfoPage from '../pages/DeliveryInfoPage';
import Home from '../pages/Home';
import LegalInfoPage from '../pages/LegalInfoPage';
import NotFound from '../pages/NotFound';
import PaymentInfoPage from '../pages/PaymentInfoPage';
import ProductPage from '../pages/ProductPage';
import ProductionInfoPage from '../pages/ProductionInfoPage';
import AdsConsentPage from '../pages/legal/AdsConsentPage';
import CookiesPolicyPage from '../pages/legal/CookiesPolicyPage';
import PersonalDataConsentPage from '../pages/legal/PersonalDataConsentPage';
import PrivacyPolicyPage from '../pages/legal/PrivacyPolicyPage';
import SalesTermsPage from '../pages/legal/SalesTermsPage';
import UserAgreementPage from '../pages/legal/UserAgreementPage';
import {
  getAllStorefrontRouteConfigs,
  notFoundRouteConfig,
  storefrontRouteConfig
} from './routeConfig';

const ManagerLoginPage = lazy(() => import('../pages/ManagerLoginPage'));

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

function RouteBoundary(routeElement, options = {}) {
  return (
    <Suspense fallback={<RouteFallback isStandaloneRoute={options.isStandaloneRoute} />}>
      {routeElement}
    </Suspense>
  );
}

const routeRenderers = {
  home: () => <Home />,
  'category-search': () => <RouteFallback />,
  search: () => <RouteFallback />,
  category: () => RouteBoundary(<CategoryPage />),
  product: () => RouteBoundary(<ProductPage />),
  cart: () => <RouteFallback />,
  checkout: () => <RouteFallback />,
  login: () => <RouteFallback />,
  account: () => <RouteFallback />,
  about: () => RouteBoundary(<AboutPage />),
  order: () => <RouteFallback />,
  'payment-info': () => RouteBoundary(<PaymentInfoPage />),
  'delivery-info': () => RouteBoundary(<DeliveryInfoPage />),
  'production-info': () => RouteBoundary(<ProductionInfoPage />),
  catalog: () => RouteBoundary(<CataloguePage />),
  'legal-info': () => RouteBoundary(<LegalInfoPage />),
  'privacy-policy': () => RouteBoundary(<PrivacyPolicyPage />),
  'user-agreement': () => RouteBoundary(<UserAgreementPage />),
  'ads-consent': () => RouteBoundary(<AdsConsentPage />),
  'sales-terms': () => RouteBoundary(<SalesTermsPage />),
  'cookies-policy': () => RouteBoundary(<CookiesPolicyPage />),
  'personal-data-consent': () => RouteBoundary(<PersonalDataConsentPage />),
  'manager-login': () => RouteBoundary(<ManagerLoginPage />, { isStandaloneRoute: true }),
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

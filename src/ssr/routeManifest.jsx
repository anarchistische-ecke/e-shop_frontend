import React, { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import RequireAdmin from '../components/RequireAdmin';
import AboutPage from '../pages/AboutPage';
import AccountPage from '../pages/AccountPage';
import BonusesInfoPage from '../pages/BonusesInfoPage';
import CartPage from '../pages/CartPage';
import CataloguePage from '../pages/CataloguePage';
import CategoryPage from '../pages/CategoryPage';
import CheckoutPage from '../pages/CheckoutPage';
import DeliveryInfoPage from '../pages/DeliveryInfoPage';
import Home from '../pages/Home';
import LegalInfoPage from '../pages/LegalInfoPage';
import LoginPage from '../pages/LoginPage';
import NotFound from '../pages/NotFound';
import OrderPage from '../pages/OrderPage';
import PaymentInfoPage from '../pages/PaymentInfoPage';
import ProductPage from '../pages/ProductPage';
import ProductionInfoPage from '../pages/ProductionInfoPage';
import SearchPage from '../pages/SearchPage';
import SearchRedirectPage from '../pages/SearchRedirectPage';
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

const AdminLoginPage = lazy(() => import('../pages/AdminLoginPage'));
const AdminApp = lazy(() => import('../pages/AdminApp'));

function AdminRouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 text-sm text-muted">
      Загружаем панель управления…
    </div>
  );
}

const routeRenderers = {
  home: () => <Home />,
  'category-search': () => <SearchRedirectPage />,
  search: () => <SearchPage />,
  category: () => <CategoryPage />,
  product: () => <ProductPage />,
  cart: () => <CartPage />,
  checkout: () => <CheckoutPage />,
  login: () => <LoginPage />,
  account: () => <AccountPage />,
  about: () => <AboutPage />,
  order: () => <OrderPage />,
  'payment-info': () => <PaymentInfoPage />,
  'delivery-info': () => <DeliveryInfoPage />,
  'bonuses-info': () => <BonusesInfoPage />,
  'production-info': () => <ProductionInfoPage />,
  catalog: () => <CataloguePage />,
  'legal-info': () => <LegalInfoPage />,
  'privacy-policy': () => <PrivacyPolicyPage />,
  'user-agreement': () => <UserAgreementPage />,
  'ads-consent': () => <AdsConsentPage />,
  'sales-terms': () => <SalesTermsPage />,
  'cookies-policy': () => <CookiesPolicyPage />,
  'personal-data-consent': () => <PersonalDataConsentPage />,
  'admin-login': () => (
    <Suspense fallback={<AdminRouteFallback />}>
      <AdminLoginPage />
    </Suspense>
  ),
  'manager-login': () => <Navigate to="/admin/login" replace />,
  'admin-app': () => (
    <Suspense fallback={<AdminRouteFallback />}>
      <RequireAdmin>
        <AdminApp />
      </RequireAdmin>
    </Suspense>
  ),
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

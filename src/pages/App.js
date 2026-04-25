import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import AboutPage from './AboutPage';
import Home from './Home';
import CategoryPage from './CategoryPage';
import ProductPage from './ProductPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import LoginPage from './LoginPage';
import AccountPage from './AccountPage';
import RequireAdmin from '../components/RequireAdmin';
import PaymentInfoPage from './PaymentInfoPage';
import DeliveryInfoPage from './DeliveryInfoPage';
import ProductionInfoPage from './ProductionInfoPage';
import CataloguePage from './CataloguePage';
import SearchPage from './SearchPage';
import SearchRedirectPage from './SearchRedirectPage';
import LegalInfoPage from './LegalInfoPage';
import PrivacyPolicyPage from './legal/PrivacyPolicyPage';
import UserAgreementPage from './legal/UserAgreementPage';
import AdsConsentPage from './legal/AdsConsentPage';
import CookiesPolicyPage from './legal/CookiesPolicyPage';
import PersonalDataConsentPage from './legal/PersonalDataConsentPage';
import SalesTermsPage from './legal/SalesTermsPage';
import OrderPage from './OrderPage';
import NotFound from './NotFound';
import { trackMetrikaHit } from '../utils/metrika';
import DeliveryConfigNotice from '../components/DeliveryConfigNotice';

const AdminLoginPage = lazy(() => import('./AdminLoginPage'));
const AdminApp = lazy(() => import('./AdminApp'));

function AdminRouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 text-sm text-muted">
      Загружаем панель управления…
    </div>
  );
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const mainRef = useRef(null);

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }
    const path = `${location.pathname}${location.search}${location.hash}`;
    trackMetrikaHit(path, typeof document !== 'undefined' ? document.title : undefined);
  }, [isAdminRoute, location.pathname, location.search, location.hash]);

  return (
    <>
      <ScrollToTop />
      <div
        className={
          isAdminRoute
            ? 'site-content-layer site-content-layer--admin'
            : 'site-content-layer site-content-layer--public'
        }
      >
        {!isAdminRoute ? (
          <a
            href="#main-content"
            className="sr-only fixed left-3 top-3 z-[210] rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink shadow-[0_14px_28px_rgba(43,39,34,0.16)] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-primary/40"
            onClick={() => {
              window.requestAnimationFrame(() => {
                mainRef.current?.focus();
              });
            }}
          >
            Перейти к содержимому
          </a>
        ) : null}
        <DeliveryConfigNotice />
        {!isAdminRoute && <Header />}
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className={isAdminRoute ? 'min-h-screen' : 'min-h-[80vh]'}
          style={
            isAdminRoute
              ? undefined
              : {
                  paddingTop: 'var(--site-header-height, 7rem)',
                  paddingBottom: 'var(--mobile-bottom-nav-offset, 0px)'
                }
          }
        >
          <Routes>
            {/* Public user-facing routes */}
            <Route path="/" element={<Home />} />
            <Route path="/category/search" element={<SearchRedirectPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/product/:id/:slug" element={<ProductPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/order/:token" element={<OrderPage />} />
            <Route path="/info/payment" element={<PaymentInfoPage />} />
            <Route path="/info/delivery" element={<DeliveryInfoPage />} />
            <Route path="/info/production" element={<ProductionInfoPage />} />
            <Route path="/catalog" element={<CataloguePage />} />
            <Route path="/info/legal" element={<LegalInfoPage />} />
            <Route
              path="/konfidentsialnost-i-zashchita-informatsii"
              element={<PrivacyPolicyPage />}
            />
            <Route
              path="/polzovatelskoe-soglashenie"
              element={<UserAgreementPage />}
            />
            <Route
              path="/soglasie-na-poluchenie-reklamy"
              element={<AdsConsentPage />}
            />
            <Route path="/usloviya-prodazhi" element={<SalesTermsPage />} />
            <Route path="/cookies" element={<CookiesPolicyPage />} />
            <Route
              path="/soglasie-na-obrabotku-pd"
              element={<PersonalDataConsentPage />}
            />
            {/* Admin login (public) */}
            <Route
              path="/admin/login"
              element={
                <Suspense fallback={<AdminRouteFallback />}>
                  <AdminLoginPage />
                </Suspense>
              }
            />
            {/* Manager login (public) */}
            <Route path="/manager/login" element={<Navigate to="/admin/login" replace />} />
            {/* Protected admin routes (RequireAdmin enforces authentication) */}
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<AdminRouteFallback />}>
                  <RequireAdmin>
                    <AdminApp />
                  </RequireAdmin>
                </Suspense>
              }
            />
            {/* Fallback for unknown URLs */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isAdminRoute && <Footer />}
      </div>
    </>
  );
}

export default App;

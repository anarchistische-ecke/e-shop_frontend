import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import Home from './Home';
import CategoryPage from './CategoryPage';
import ProductPage from './ProductPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import LoginPage from './LoginPage';
import AccountPage from './AccountPage';
import AdminLoginPage from './AdminLoginPage';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminBrands from './AdminBrands';
import AdminOrders from './AdminOrders';
import AdminCustomers from './AdminCustomers';
import AdminContent from './AdminContent';
import AdminPromotions from './AdminPromotions';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';
import AdminSecurity from './AdminSecurity';
import AdminMainPage from './AdminMainPage';
import RequireAdmin from '../components/RequireAdmin';
import PaymentInfoPage from './PaymentInfoPage';
import DeliveryInfoPage from './DeliveryInfoPage';
import BonusesInfoPage from './BonusesInfoPage';
import ProductionInfoPage from './ProductionInfoPage';
import CataloguePage from './CataloguePage';
import LegalInfoPage from './LegalInfoPage';
import PrivacyPolicyPage from './legal/PrivacyPolicyPage';
import UserAgreementPage from './legal/UserAgreementPage';
import AdsConsentPage from './legal/AdsConsentPage';
import CookiesPolicyPage from './legal/CookiesPolicyPage';
import PersonalDataConsentPage from './legal/PersonalDataConsentPage';
import SalesTermsPage from './legal/SalesTermsPage';
import OrderPage from './OrderPage';
import NotFound from './NotFound';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && <Header />}
      <main
        className={isAdminRoute ? 'min-h-screen' : 'min-h-[80vh]'}
        style={
          isAdminRoute
            ? undefined
            : { paddingTop: 'var(--site-header-height, 7rem)' }
        }
      >
        <Routes>
          {/* Public user-facing routes */}
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/order/:token" element={<OrderPage />} />
          <Route path="/info/payment" element={<PaymentInfoPage />} />
          <Route path="/info/delivery" element={<DeliveryInfoPage />} />
          <Route path="/info/bonuses" element={<BonusesInfoPage />} />
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
          <Route path="/admin/login" element={<AdminLoginPage />} />
          {/* Manager login (public) */}
          <Route path="/manager/login" element={<Navigate to="/admin/login" replace />} />
          {/* Protected admin routes (RequireAdmin enforces authentication) */}
          <Route 
            path="/admin/*" 
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="main" element={<AdminMainPage />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="security" element={<AdminSecurity />} />
          </Route>
          {/* Fallback for unknown URLs */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </>
  );
}

export default App;

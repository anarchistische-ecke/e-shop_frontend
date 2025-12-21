import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import Home from './Home';
import CategoryPage from './CategoryPage';
import ProductPage from './ProductPage';
import CartPage from './CartPage';
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
import AboutPage from './AboutPage';
import PaymentInfoPage from './PaymentInfoPage';
import DeliveryInfoPage from './DeliveryInfoPage';
import BonusesInfoPage from './BonusesInfoPage';
import ProductionInfoPage from './ProductionInfoPage';
import NotFound from './NotFound';

function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="min-h-[80vh] mt-32 md:mt-28 lg:mt-24">
        <Routes>
          {/* Public user-facing routes */}
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/info/payment" element={<PaymentInfoPage />} />
          <Route path="/info/delivery" element={<DeliveryInfoPage />} />
          <Route path="/info/bonuses" element={<BonusesInfoPage />} />
          <Route path="/info/production" element={<ProductionInfoPage />} />
          {/* Admin login (public) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
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
      <Footer />
    </>
  );
}

export default App;

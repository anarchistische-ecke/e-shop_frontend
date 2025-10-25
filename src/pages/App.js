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
import AdminLoginPage from './AdminLoginPage';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminCustomers from './AdminCustomers';
import AdminContent from './AdminContent';
import AdminPromotions from './AdminPromotions';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';
import AdminSecurity from './AdminSecurity';
import RequireAdmin from '../components/RequireAdmin';
import AboutPage from './AboutPage';
import NotFound from './NotFound';

/**
 * The App component defines the top level structure of the application.
 * It renders a consistent header and footer across all pages and sets up
 * routes for the various sections of the store.  To keep the layout
 * uniform we wrap the routes in a <main> tag.
 */
function App() {
  return (
    <>
      {/* Scroll to top on route changes */}
      <ScrollToTop />
      {/* Fixed header: spacing is added via margin on the main element */}
      <Header />
      {/* Increase top margin to accommodate both the fixed header and the supermenu */}
      <main className="min-h-[80vh] mt-24">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Category listing page.  The :slug param can be used to
              differentiate product groups (e.g. bedroom, clothing, etc.). */}
          <Route path="/category/:slug" element={<CategoryPage />} />
          {/* Product details page identified by a unique identifier. */}
          <Route path="/product/:id" element={<ProductPage />} />
          {/* Shopping cart */}
          <Route path="/cart" element={<CartPage />} />
          {/* Authentication page */}
          <Route path="/login" element={<LoginPage />} />
          {/* Admin login page (public) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          {/* Admin protected routes */}
          <Route
            path="/admin/*"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            {/* Dashboard (index route) */}
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="security" element={<AdminSecurity />} />
          </Route>
          {/* Static informational page */}
          <Route path="/about" element={<AboutPage />} />
          {/* Fallback route for unknown URLs */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
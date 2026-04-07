import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
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

function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
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
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default AdminApp;

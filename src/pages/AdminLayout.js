// File: src/pages/AdminLayout.js
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

function AdminLayout() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminAuth');  // (cleanup legacy flag if present)
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-gray-100 border-r border-gray-200 p-4">
        <h2 className="font-bold text-lg mb-4">Администрирование</h2>
        <nav className="flex flex-col space-y-2">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/products">Товары</NavLink>
          <NavLink to="/admin/orders">Заказы</NavLink>
          <NavLink to="/admin/customers">Клиенты</NavLink>
          <NavLink to="/admin/content">Контент</NavLink>
          <NavLink to="/admin/promotions">Акции</NavLink>
          <NavLink to="/admin/reports">Отчёты</NavLink>
          <NavLink to="/admin/settings">Настройки</NavLink>
          <NavLink to="/admin/security">Безопасность</NavLink>
        </nav>
        <button onClick={handleLogout} className="mt-6 text-sm text-gray-500 hover:text-primary">
          Выйти
        </button>
      </aside>
      <main className="flex-1 p-4 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
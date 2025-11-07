import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

function AdminLayout() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar navigation for admin sections */}
      <aside className="w-60 bg-gray-100 border-r border-gray-200 p-4">
        <h2 className="font-bold text-lg mb-6">Администрирование</h2>
        <nav className="flex flex-col space-y-2 text-sm">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/products">Товары</NavLink>
          <NavLink to="/admin/categories">Категории</NavLink>
          <NavLink to="/admin/brands">Бренды</NavLink>
          <NavLink to="/admin/orders">Заказы</NavLink>
          <NavLink to="/admin/customers">Клиенты</NavLink>
          <NavLink to="/admin/content">Контент</NavLink>
          <NavLink to="/admin/promotions">Акции</NavLink>
          <NavLink to="/admin/reports">Отчёты</NavLink>
          <NavLink to="/admin/settings">Настройки</NavLink>
          <NavLink to="/admin/security">Безопасность</NavLink>
        </nav>
        <button 
          onClick={handleLogout} 
          className="mt-8 text-sm text-gray-500 hover:text-primary"
        >
          Выйти
        </button>
      </aside>
      {/* Admin content area */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;

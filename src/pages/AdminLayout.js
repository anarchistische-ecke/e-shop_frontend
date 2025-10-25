import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

/**
 * AdminLayout renders the side navigation and main content area for
 * all admin pages.  Each section of the admin panel (dashboard,
 * products, orders, etc.) is accessible from the sidebar.  The
 * NavLink component automatically applies active styles for the
 * current route.  A logout button clears the admin auth flag and
 * returns the user to the public home page.
 */
function AdminLayout() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/');
  };
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-gray-100 border-r border-gray-200 p-4">
        <h2 className="font-bold text-lg mb-4">Администрирование</h2>
        <nav className="flex flex-col space-y-2">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'font-semibold text-primary' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => isActive ? 'font-semibold text-primary' : ''}>
            Товары
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => isActive ? 'font-semibold text-primary' : ''}>
            Заказы
          </NavLink>
          <NavLink to="/admin/customers" className={({ isActive }) => isActive ? 'font-semibold text-primary' : ''}>
            Клиенты
          </NavLink>
          <NavLink to="/admin/content" className={({ isActive }) => isActive ? 'font-semibold text-primary' : ''}>
            Контент
          </NavLink>
          <NavLink to="/admin/promotions" className={({ isActive }) => isActive ? 'font-semibold text-primary' : ''}>
            Акции
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'font-semibold text-primary' : ''}>
            Отчёты
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'font-semibold text-primary' : ''}>
            Настройки
          </NavLink>
          <NavLink to="/admin/security" className={({ isActive }) => isActive ? 'font-semibold text-primary' : ''}>
            Безопасность
          </NavLink>
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
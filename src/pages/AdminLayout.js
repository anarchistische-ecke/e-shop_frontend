import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminLayout() {
  const { logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const handleLogout = () => {
    if (typeof window === 'undefined') {
      logout();
      return;
    }
    logout();
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/main', label: 'Главная' },
    { to: '/admin/products', label: 'Товары' },
    { to: '/admin/categories', label: 'Категории' },
    { to: '/admin/brands', label: 'Бренды' },
    { to: '/admin/orders', label: 'Заказы' },
    { to: '/admin/customers', label: 'Клиенты' },
    { to: '/admin/content', label: 'Контент' },
    { to: '/admin/promotions', label: 'Акции' },
    { to: '/admin/reports', label: 'Отчёты' },
    { to: '/admin/settings', label: 'Настройки' },
    { to: '/admin/security', label: 'Безопасность' },
  ];

  const linkClass = ({ isActive }) =>
    `rounded px-2 py-1.5 transition-colors ${
      isActive ? 'bg-secondary text-primary font-semibold' : 'text-gray-700 hover:bg-secondary hover:text-primary'
    }`;

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="min-h-screen bg-secondary">
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            aria-label="Открыть меню"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            <span className="sr-only">Открыть меню</span>
            <span className="flex items-center gap-1.5">
              <span className="block h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="block h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="block h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
          </button>
          <div className="text-sm font-semibold">Администрирование</div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-primary"
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="md:flex">
        <aside className="hidden md:flex md:w-60 md:flex-col bg-gray-100 border-r border-gray-200 p-4">
          <h2 className="font-bold text-lg mb-6">Администрирование</h2>
          <nav className="flex flex-col space-y-1 text-sm">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="mt-8 text-sm text-gray-500 hover:text-primary"
          >
            Выйти
          </button>
        </aside>
        <main className="flex-1 p-4 md:p-6 md:overflow-y-auto md:h-screen">
          <Outlet />
        </main>
      </div>

      <div className={`md:hidden fixed inset-0 z-50 ${mobileNavOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${mobileNavOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeMobileNav}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 bg-white shadow-xl transition-transform ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold">Меню</h2>
            <button
              type="button"
              onClick={closeMobileNav}
              className="text-xs text-gray-500 hover:text-primary"
            >
              Закрыть
            </button>
          </div>
          <div className="p-4 space-y-4">
            <nav className="flex flex-col space-y-1 text-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={linkClass}
                  onClick={closeMobileNav}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={() => {
                closeMobileNav();
                handleLogout();
              }}
              className="text-sm text-gray-500 hover:text-primary"
            >
              Выйти
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AdminLayout;

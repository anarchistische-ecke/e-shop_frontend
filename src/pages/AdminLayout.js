import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_GROUPS = [
  {
    title: 'Обзор',
    items: [
      { to: '/admin', label: 'Дашборд', end: true },
      { to: '/admin/main', label: 'Главная витрина' },
      { to: '/admin/reports', label: 'Отчёты' },
    ],
  },
  {
    title: 'Каталог',
    items: [
      { to: '/admin/products', label: 'Товары' },
      { to: '/admin/categories', label: 'Категории' },
      { to: '/admin/brands', label: 'Бренды' },
    ],
  },
  {
    title: 'Продажи',
    items: [
      { to: '/admin/orders', label: 'Заказы' },
      { to: '/admin/customers', label: 'Клиенты' },
      { to: '/admin/promotions', label: 'Акции и купоны' },
    ],
  },
  {
    title: 'Система',
    items: [
      { to: '/admin/content', label: 'Контент' },
      { to: '/admin/settings', label: 'Настройки' },
      { to: '/admin/security', label: 'Безопасность' },
    ],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function AdminLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  }, [logout]);

  const currentSection = useMemo(() => {
    const match = NAV_ITEMS.find((item) => {
      if (item.end) return location.pathname === item.to;
      return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
    });
    return match?.label || 'Панель администратора';
  }, [location.pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const originalOverflow = document.body.style.overflow;
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const linkClass = ({ isActive }) =>
    `admin-shell__nav-link ${
      isActive
        ? 'admin-shell__nav-link--active'
        : 'admin-shell__nav-link--idle'
    }`;

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <div className="admin-shell">
      <div
        className={`admin-shell__backdrop md:hidden ${
          mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      <aside
        className={`admin-shell__sidebar ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Навигация панели администратора"
      >
        <div className="admin-shell__brand">
          <p className="admin-shell__eyebrow">Постельное Белье-Юг</p>
          <h2 className="admin-shell__brand-title">Admin Console</h2>
          <p className="admin-shell__brand-subtitle">Управление каталогом, заказами и контентом</p>
        </div>

        <button
          type="button"
          onClick={closeMobileNav}
          className="admin-shell__close md:hidden"
          aria-label="Закрыть меню"
        >
          Закрыть
        </button>

        <nav className="admin-shell__nav" aria-label="Разделы админ-панели">
          {NAV_GROUPS.map((group) => (
            <section key={group.title} className="admin-shell__nav-group">
              <h3 className="admin-shell__nav-title">{group.title}</h3>
              <ul className="admin-shell__nav-list">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={linkClass}
                      onClick={closeMobileNav}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <button type="button" onClick={handleLogout} className="admin-shell__logout">
          Выйти
        </button>
      </aside>

      <div className="admin-shell__content">
        <header className="admin-shell__topbar">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="admin-shell__menu md:hidden"
            aria-label="Открыть меню навигации"
          >
            ☰
          </button>

          <div className="min-w-0">
            <p className="admin-shell__eyebrow">Панель управления</p>
            <h1 className="admin-shell__section-title">{currentSection}</h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="button-gray hidden sm:inline-flex"
          >
            Выйти
          </button>
        </header>

        <main className="admin-shell__main" id="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { focusFirstElement, trapFocusEvent } from '../utils/a11y';

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
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const sidebarRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const mobileNavId = 'admin-mobile-navigation';
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
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncDesktopState = () => {
      setIsDesktop(mediaQuery.matches);
    };

    syncDesktopState();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncDesktopState);
    } else {
      mediaQuery.addListener(syncDesktopState);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', syncDesktopState);
      } else {
        mediaQuery.removeListener(syncDesktopState);
      }
    };
  }, []);

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
    if (!mobileNavOpen || typeof window === 'undefined') {
      return undefined;
    }

    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.requestAnimationFrame(() => {
      focusFirstElement(sidebarRef.current, sidebarRef.current);
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileNavOpen(false);
        return;
      }

      trapFocusEvent(event, sidebarRef.current);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      window.removeEventListener('keydown', onKeyDown);

      const focusTarget =
        lastFocusedRef.current instanceof HTMLElement && lastFocusedRef.current.isConnected
          ? lastFocusedRef.current
          : menuButtonRef.current;

      if (focusTarget instanceof HTMLElement && focusTarget.isConnected) {
        window.requestAnimationFrame(() => {
          focusTarget.focus();
        });
      }
    };
  }, [mobileNavOpen]);

  const linkClass = ({ isActive }) =>
    `admin-shell__nav-link ${
      isActive
        ? 'admin-shell__nav-link--active'
        : 'admin-shell__nav-link--idle'
    }`;

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const mobileNavHidden = !isDesktop && !mobileNavOpen;

  return (
    <>
      <a
        href="#admin-main"
        className="sr-only fixed left-3 top-3 z-[210] rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink shadow-[0_14px_28px_rgba(43,39,34,0.16)] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-primary/40"
        onClick={() => {
          window.requestAnimationFrame(() => {
            document.getElementById('admin-main')?.focus();
          });
        }}
      >
        Перейти к содержимому админки
      </a>

      <div className="admin-shell">
        <div
          className={`admin-shell__backdrop md:hidden ${
            mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeMobileNav}
          aria-hidden="true"
        />

        <aside
          ref={sidebarRef}
          id={mobileNavId}
          className={`admin-shell__sidebar ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
          aria-label="Навигация панели администратора"
          role={!isDesktop && mobileNavOpen ? 'dialog' : undefined}
          aria-modal={!isDesktop && mobileNavOpen ? 'true' : undefined}
          aria-labelledby="admin-mobile-navigation-title"
          aria-hidden={mobileNavHidden ? 'true' : undefined}
          data-testid="admin-mobile-nav-panel"
          tabIndex={!isDesktop && mobileNavOpen ? -1 : undefined}
          inert={mobileNavHidden ? '' : undefined}
        >
          <div className="admin-shell__brand">
            <p className="admin-shell__eyebrow">Постельное Белье-ЮГ</p>
            <h2 id="admin-mobile-navigation-title" className="admin-shell__brand-title">
              Admin Console
            </h2>
            <p className="admin-shell__brand-subtitle">
              Управление каталогом, заказами и контентом
            </p>
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
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="admin-shell__menu md:hidden"
              aria-label="Открыть меню навигации"
              aria-expanded={mobileNavOpen}
              aria-controls={mobileNavId}
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

          <main className="admin-shell__main" id="admin-main" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

export default AdminLayout;

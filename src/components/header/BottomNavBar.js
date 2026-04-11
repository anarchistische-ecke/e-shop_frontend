import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../ui';
import { buildLoginRedirectPath } from '../../utils/account';
import { CartIcon, CatalogIcon, HomeIcon, SearchIcon, UserIcon } from './icons';

function BottomNavItem({
  active = false,
  badge = 0,
  children,
  className = '',
  label,
  as: Component = 'button',
  ...props
}) {
  const resolvedType = Component === 'button' ? props.type || 'button' : undefined;

  return (
    <Component
      type={resolvedType}
      className={cn(
        'focus-ring-soft relative flex min-h-[52px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-[20px] px-1.5 pb-1.5 pt-2 text-[11px] font-semibold leading-none transition duration-200',
        active
          ? 'bg-white text-primary shadow-[0_12px_24px_rgba(43,39,34,0.12)]'
          : 'text-ink/72 hover:bg-white/80 hover:text-ink',
        className
      )}
      {...props}
    >
      <span className="relative inline-flex items-center justify-center">
        {children}
        {badge > 0 ? (
          <span className="absolute -right-3 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
      <span>{label}</span>
    </Component>
  );
}

function BottomNavBar({
  activeKey,
  isAuthenticated,
  isEnabled,
  isMenuOpen,
  isSearchPanelVisible,
  onOpenMenu,
  onOpenSearch,
  totalItems
}) {
  const location = useLocation();
  const redirectTo = buildLoginRedirectPath(location, '/account');

  if (!isEnabled) {
    return null;
  }

  const isVisible = !isMenuOpen && !isSearchPanelVisible;

  return (
    <nav
      aria-label="Быстрая навигация"
      className={cn(
        'viewport-fixed-edge fixed inset-x-0 bottom-0 z-[95] border-t border-ink/10 bg-[#fbf7f1]/95 shadow-[0_-18px_36px_rgba(43,39,34,0.14)] backdrop-blur-xl transition-transform duration-200 md:hidden',
        isVisible
          ? 'translate-y-0'
          : 'pointer-events-none translate-y-full'
      )}
    >
      <ul className="page-shell grid grid-cols-5 gap-1 px-0 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2">
        <li>
          <BottomNavItem as={Link} to="/" label="Главная" active={activeKey === 'home'}>
            <HomeIcon className="h-5 w-5" />
          </BottomNavItem>
        </li>
        <li>
          <BottomNavItem
            type="button"
            label="Каталог"
            active={activeKey === 'catalog' || isMenuOpen}
            onClick={onOpenMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-panel"
          >
            <CatalogIcon className="h-5 w-5" />
          </BottomNavItem>
        </li>
        <li>
          <BottomNavItem
            type="button"
            label="Поиск"
            active={activeKey === 'search' || isSearchPanelVisible}
            onClick={onOpenSearch}
            aria-expanded={isSearchPanelVisible}
            aria-controls="header-search-suggestions-mobile"
          >
            <SearchIcon className="h-5 w-5" />
          </BottomNavItem>
        </li>
        <li>
          <BottomNavItem
            as={Link}
            to={isAuthenticated ? '/account' : '/login'}
            state={isAuthenticated ? undefined : { from: redirectTo }}
            label={isAuthenticated ? 'Кабинет' : 'Войти'}
            active={activeKey === 'account'}
          >
            <UserIcon className="h-5 w-5" />
          </BottomNavItem>
        </li>
        <li>
          <BottomNavItem
            as={Link}
            to="/cart"
            label="Корзина"
            active={activeKey === 'cart'}
            badge={totalItems}
          >
            <CartIcon className="h-5 w-5" />
          </BottomNavItem>
        </li>
      </ul>
    </nav>
  );
}

export default BottomNavBar;

import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCmsNavigation, useCmsSiteSettings } from '../contexts/CmsContentContext';
import { WishlistContext } from '../contexts/WishlistContext';
import { DEFAULT_HEADER_NAVIGATION } from '../data/cms/defaults';
import { resolveCategoryToken } from '../utils/header';
import AccountMenu from './header/AccountMenu';
import CartButton from './header/CartButton';
import DesktopMegaMenu from './header/DesktopMegaMenu';
import FavoritesButton from './header/FavoritesButton';
import HeaderBrand from './header/HeaderBrand';
import LastAddedCartNotice from './header/LastAddedCartNotice';
import MobileMenu from './header/MobileMenu';
import SearchBar from './header/SearchBar';
import { useHeaderState } from './header/useHeaderState';
import MiniCartDrawer from './commerce/MiniCartDrawer';
import { CartIcon, CatalogIcon, HeartIcon, HomeIcon, MenuIcon, SearchIcon, UserIcon } from './header/icons';

const dockItem = 'focus-ring-soft relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold leading-tight text-ink transition hover:bg-primary/5 hover:text-primary';

function HeaderUtilityLink({ item }) {
  if (!item?.label || !item?.url) return null;

  const className = 'focus-ring-soft flex min-h-11 items-center whitespace-nowrap text-xs text-muted hover:text-primary';
  return item.url.startsWith('/') ? (
    <Link to={item.url} className={className}>{item.label}</Link>
  ) : (
    <a
      href={item.url}
      className={className}
      rel={item.openInNewTab ? 'noreferrer' : undefined}
      target={item.openInNewTab ? '_blank' : undefined}
    >
      {item.label}
    </a>
  );
}

function DockCount({ count }) {
  if (!count) return null;

  return (
    <span className="absolute left-1/2 top-0.5 ml-1 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary px-1 text-[9px] leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function Header({ showMobileStickyMenu = true }) {
  const header = useHeaderState();
  const { count: wishlistCount } = useContext(WishlistContext);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const { siteSettings } = useCmsSiteSettings();
  const { navigation: headerNavigation } = useCmsNavigation({
    placement: 'header',
    fallbackNavigation: DEFAULT_HEADER_NAVIGATION,
  });
  const headerLinks = headerNavigation.flatMap((group) => group.items || []);
  const announcementText = String(siteSettings?.announcementBanner?.shortText || '').trim();

  return (
    <>
      <div className="border-b border-ink/10 bg-white lg:hidden">
        <div className="page-shell flex min-h-[50px] items-center justify-between gap-2">
          <HeaderBrand siteName={siteSettings.siteName} />
          <Link
            to={header.isAuthenticated ? '/account' : '/login'}
            aria-label={header.isAuthenticated ? 'Личный кабинет' : 'Войти'}
            className="focus-ring-soft grid h-11 w-11 shrink-0 place-items-center rounded-lg text-primary"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
      <div
        className={`viewport-fixed-edge pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:bottom-auto lg:top-0 ${showMobileStickyMenu ? '' : 'hidden lg:block'}`}
      >
        <header ref={header.headerRef} className="relative pointer-events-auto">
          <div
            ref={header.headerBarRef}
            className="relative z-[90] border-t border-ink/15 bg-white lg:border-b lg:border-t-0"
          >
            {announcementText ? (
              <div className="border-b border-primary/10 bg-primary/5 text-primary">
                <p className="page-shell py-1.5 text-center text-xs">{announcementText}</p>
              </div>
            ) : null}
            <div className="page-shell flex flex-col pb-[env(safe-area-inset-bottom,0px)] lg:pb-0">
              <nav
                aria-label="Навигация магазина"
                data-testid="mobile-sticky-menu"
                className="order-2 grid grid-cols-5 items-stretch lg:hidden"
              >
                <button type="button" className={dockItem} onClick={header.openMenu} aria-expanded={header.isMenuOpen} aria-controls="mobile-nav-panel">
                  <MenuIcon className="h-5 w-5" />
                  Меню
                </button>
                <Link to="/" className={dockItem} aria-label={`${siteSettings.siteName}, домой`}>
                  <HomeIcon className="h-5 w-5" />
                  Домой
                </Link>
                <button type="button" className={dockItem} onClick={header.openSearchPanel} aria-haspopup="dialog" aria-expanded={header.isSearchOpen}>
                  <SearchIcon className="h-5 w-5" />
                  Поиск
                </button>
                <Link to="/favorites" className={dockItem}>
                  <HeartIcon className="h-5 w-5" filled={wishlistCount > 0} />
                  Избранное
                  <DockCount count={wishlistCount} />
                </Link>
                <button type="button" className={dockItem} onClick={() => setIsMiniCartOpen(true)} aria-expanded={isMiniCartOpen}>
                  <CartIcon className="h-5 w-5" />
                  Корзина
                  <DockCount count={header.totalItems} />
                </button>
              </nav>

              <div className="order-1 grid min-w-0 grid-cols-1 lg:min-h-[62px] lg:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.25fr)_minmax(10rem,0.75fr)] lg:items-center lg:gap-6">
                <div className="hidden min-w-0 lg:block">
                  <HeaderBrand siteName={siteSettings.siteName} />
                </div>

                <SearchBar
                  autocompleteData={header.autocompleteData}
                  isSearchOpen={header.isSearchOpen}
                  isSearchPanelVisible={header.isSearchPanelVisible}
                  onChange={header.handleSearchInputChange}
                  onClear={header.clearSearch}
                  onClose={header.closeSearch}
                  onCloseMobile={header.dismissMobileSearch}
                  onFocus={header.handleSearchFocus}
                  onTrackSearchSuggestion={header.trackSearchSuggestionClick}
                  onNavigateSearch={header.navigateSearch}
                  onSetSearchScope={header.setSearchScope}
                  onSubmit={header.handleSearchSubmit}
                  scopeOptions={header.scopeOptions}
                  mobileSearchInputRef={header.mobileSearchInputRef}
                  searchRef={header.searchRef}
                  searchScope={header.searchScope}
                  searchTerm={header.searchTerm}
                />

                <div className="hidden items-center justify-end gap-1 lg:flex">
                  <FavoritesButton totalItems={wishlistCount} />
                  <AccountMenu
                    accountLinks={header.accountLinks}
                    accountMenuRef={header.accountMenuRef}
                    displayName={header.displayName}
                    displayPhone={header.displayPhone}
                    isAccountMenuOpen={header.isAccountMenuOpen}
                    isAuthenticated={header.isAuthenticated}
                    onAccountNav={header.handleAccountNav}
                    onAccountTrigger={header.handleAccountTrigger}
                    onLogout={header.handleLogout}
                  />
                  <CartButton totalItems={header.totalItems} />
                </div>
              </div>
            </div>
            <div className="hidden border-t border-ink/10 lg:block">
              <div className="page-shell flex min-h-11 items-center justify-between gap-5">
                <nav aria-label="Каталог" className="flex min-w-0 items-center gap-5 xl:gap-7">
                  <button
                    type="button"
                    className="focus-ring-soft flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-primary"
                    aria-expanded={header.isCatalogMenuOpen}
                    aria-haspopup="dialog"
                    onClick={header.handleCatalogToggle}
                  >
                    <CatalogIcon className="h-4 w-4" />
                    Каталог
                  </button>
                  {header.navCategories.slice(0, 4).map((category) => {
                    const token = resolveCategoryToken(category);
                    return (
                      <Link
                        key={token}
                        to={`/category/${token}`}
                        className="focus-ring-soft flex min-h-11 min-w-0 items-center text-sm font-medium text-ink/85 hover:text-primary"
                        onClick={() => header.trackCategoryNavigation(token, 'desktop_navigation')}
                      >
                        <span className="truncate">{category.name}</span>
                      </Link>
                    );
                  })}
                </nav>
                <nav aria-label="Сервис магазина" className="hidden shrink-0 gap-4 xl:flex">
                  {headerLinks.map((item) => (
                    <HeaderUtilityLink key={`${item.label}:${item.url}`} item={item} />
                  ))}
                </nav>
              </div>
            </div>
          </div>
          <DesktopMegaMenu
            childrenByParent={header.childrenByParent}
            isOpen={header.isCatalogMenuOpen}
            navCategories={header.navCategories}
            onCloseMega={header.closeMega}
            onTrackCategoryClick={header.trackCategoryNavigation}
          />
        </header>
      </div>
      <MobileMenu
        childrenByParent={header.childrenByParent}
        isOpen={header.isMenuOpen}
        mobileCategories={header.mobileCategories}
        onClose={header.closeMenu}
        onTrackCategoryClick={header.trackCategoryNavigation}
        searchTerm={header.searchTerm}
        siteName={siteSettings.siteName}
        utilityNavigation={headerNavigation}
        wishlistCount={wishlistCount}
      />

      <MiniCartDrawer open={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />
      <LastAddedCartNotice lastAddedItem={header.lastAddedItem} onDismiss={header.dismissLastAddedItem} />
    </>
  );
}

export default Header;

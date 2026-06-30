import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCmsNavigation, useCmsSiteSettings } from '../contexts/CmsContentContext';
import { WishlistContext } from '../contexts/WishlistContext';
import { DEFAULT_HEADER_NAVIGATION } from '../data/cms/defaults';
import { Button } from './ui';
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
import { CartIcon, CatalogIcon, HeartIcon, SearchIcon } from './header/icons';

function isInternalUrl(url) {
  return typeof url === 'string' && url.startsWith('/');
}

function HeaderUtilityLink({ item }) {
  if (!item?.label || !item?.url) {
    return null;
  }

  const className =
    'focus-ring-soft inline-flex min-h-[34px] items-center rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-sm text-ink/78 transition hover:border-primary/30 hover:text-primary';

  if (isInternalUrl(item.url)) {
    return (
      <Link to={item.url} className={className}>
        {item.label}
      </Link>
    );
  }

  return (
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

function Header() {
  const header = useHeaderState();
  const { count: wishlistCount } = useContext(WishlistContext);
  const [isUtilityCollapsed, setIsUtilityCollapsed] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const { siteSettings } = useCmsSiteSettings();
  const { navigation: headerNavigation } = useCmsNavigation({
    placement: 'header',
    fallbackNavigation: DEFAULT_HEADER_NAVIGATION,
  });
  const headerLinks = headerNavigation.flatMap((group) => group.items || []);
  const announcementText = String(siteSettings?.announcementBanner?.shortText || '').trim();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleScroll = () => {
      setIsUtilityCollapsed(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="viewport-fixed-edge fixed inset-x-0 top-0 z-50 pointer-events-none">
        <header ref={header.headerRef} className="relative pointer-events-auto">
          <div
            ref={header.headerBarRef}
            className="relative z-[90] border-b border-ink/10 bg-[#fbf7f1]/96 shadow-[0_10px_24px_rgba(43,39,34,0.08)] backdrop-blur-xl lg:bg-white/92 lg:shadow-[0_12px_28px_rgba(43,39,34,0.08)]"
          >
            {announcementText ? (
              <div
                className={`overflow-hidden border-b border-white/12 bg-accent text-white transition-all duration-200 ${
                  isUtilityCollapsed ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'
                }`}
              >
                <div className="page-shell flex min-h-[32px] items-center justify-center py-1 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/82 sm:min-h-[34px]">
                  {announcementText}
                </div>
              </div>
            ) : null}
            <div className="page-shell page-section--tight py-1.5 sm:py-3 lg:pb-5 lg:pt-2.5 xl:pb-5 xl:pt-3">
              {headerLinks.length > 0 ? (
                <div className="mb-2.5 hidden items-center justify-between gap-4 border-b border-ink/10 pb-2.5 lg:flex">
                  <nav
                    aria-label="Основная навигация сайта"
                    className="flex flex-wrap items-center gap-2"
                  >
                    {headerLinks.map((item) => (
                      <HeaderUtilityLink
                        key={`${item.label}:${item.url}`}
                        item={item}
                      />
                    ))}
                  </nav>
                  <p className="truncate text-[11px] uppercase tracking-[0.18em] text-muted">
                    {siteSettings.supportPhone} · {siteSettings.supportEmail}
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] items-stretch gap-1 lg:hidden">
                <button
                  type="button"
                  className="focus-ring-soft flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl border border-ink/10 bg-white/88 px-1 text-[11px] font-semibold text-ink shadow-[0_8px_18px_rgba(43,39,34,0.08)]"
                  onClick={header.openMenu}
                  aria-expanded={header.isMenuOpen}
                  aria-controls="mobile-nav-panel"
                >
                  <CatalogIcon className="h-5 w-5" />
                  Меню
                </button>
                <Link
                  to="/"
                  className="focus-ring-soft flex min-h-[52px] flex-col items-center justify-center rounded-2xl border border-ink/10 bg-white/88 px-1 text-center font-display text-[17px] font-semibold leading-none text-ink shadow-[0_8px_18px_rgba(43,39,34,0.08)]"
                >
                  {siteSettings.siteName}
                  <span className="mt-1 font-body text-[10px] font-semibold text-muted">Домой</span>
                </Link>
                <button
                  type="button"
                  className="focus-ring-soft flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl border border-ink/10 bg-white/88 px-1 text-[11px] font-semibold text-ink shadow-[0_8px_18px_rgba(43,39,34,0.08)]"
                  onClick={header.openSearchPanel}
                  aria-expanded={header.isSearchOpen}
                >
                  <SearchIcon className="h-5 w-5" />
                  Поиск
                </button>
                <Link
                  to="/favorites"
                  className="focus-ring-soft relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl border border-ink/10 bg-white/88 px-1 text-[11px] font-semibold text-ink shadow-[0_8px_18px_rgba(43,39,34,0.08)]"
                >
                  <HeartIcon className="h-5 w-5" filled={wishlistCount > 0} />
                  Избранное
                  {wishlistCount > 0 ? (
                    <span className="absolute right-1 top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-none text-white">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  ) : null}
                </Link>
                <button
                  type="button"
                  className="focus-ring-soft relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl border border-ink/10 bg-white/88 px-1 text-[11px] font-semibold text-ink shadow-[0_8px_18px_rgba(43,39,34,0.08)]"
                  onClick={() => setIsMiniCartOpen(true)}
                  aria-expanded={isMiniCartOpen}
                >
                  <CartIcon className="h-5 w-5" />
                  Корзина
                  {header.totalItems > 0 ? (
                    <span className="absolute right-1 top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-none text-white">
                      {header.totalItems > 99 ? '99+' : header.totalItems}
                    </span>
                  ) : null}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1.5 pt-1.5 sm:gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-3.5 lg:pt-0">
                <div className="hidden lg:block">
                  <HeaderBrand
                    siteName={siteSettings.siteName}
                    wayfindingLabel={header.wayfindingLabel}
                  />
                </div>

                <SearchBar
                  autocompleteData={header.autocompleteData}
                  isSearchOpen={header.isSearchOpen}
                  isSearchPanelVisible={header.isSearchPanelVisible}
                  onChange={header.handleSearchInputChange}
                  onClear={header.clearSearch}
                  onClose={header.closeSearch}
                  onFocus={header.handleSearchFocus}
                  onTrackSearchSuggestion={header.trackSearchSuggestionClick}
                  onNavigateSearch={header.navigateSearch}
                  onSetSearchScope={header.setSearchScope}
                  onSubmit={header.handleSearchSubmit}
                  scopeOptions={header.scopeOptions}
                  searchInputRef={header.searchInputRef}
                  searchRef={header.searchRef}
                  searchScope={header.searchScope}
                  searchTerm={header.searchTerm}
                />

                <div className="hidden items-center justify-end gap-2 lg:flex">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-expanded={header.isCatalogMenuOpen}
                    aria-haspopup="dialog"
                    onClick={header.handleCatalogToggle}
                  >
                    Каталог
                  </Button>

                  <CartButton totalItems={header.totalItems} />
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
                </div>
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

      <MiniCartDrawer
        open={isMiniCartOpen}
        onClose={() => setIsMiniCartOpen(false)}
      />

      <LastAddedCartNotice
        lastAddedItem={header.lastAddedItem}
        onDismiss={header.dismissLastAddedItem}
      />
    </>
  );
}

export default Header;

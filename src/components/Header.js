import React from 'react';
import { Link } from 'react-router-dom';
import { useCmsNavigation, useCmsSiteSettings } from '../contexts/CmsContentContext';
import { DEFAULT_HEADER_NAVIGATION } from '../data/cms/defaults';
import { Button } from './ui';
import AccountMenu from './header/AccountMenu';
import BottomNavBar from './header/BottomNavBar';
import CartButton from './header/CartButton';
import DesktopMegaMenu from './header/DesktopMegaMenu';
import HeaderBrand from './header/HeaderBrand';
import LastAddedCartNotice from './header/LastAddedCartNotice';
import MobileMenu from './header/MobileMenu';
import SearchBar from './header/SearchBar';
import { useHeaderState } from './header/useHeaderState';

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
  const { siteSettings } = useCmsSiteSettings();
  const { navigation: headerNavigation } = useCmsNavigation({
    placement: 'header',
    fallbackNavigation: DEFAULT_HEADER_NAVIGATION,
  });
  const headerLinks = headerNavigation.flatMap((group) => group.items || []);

  return (
    <>
      <div className="viewport-fixed-edge fixed inset-x-0 top-0 z-50 pointer-events-none">
        <header ref={header.headerRef} className="relative pointer-events-auto">
          <div
            ref={header.headerBarRef}
            className="relative z-[90] border-b border-ink/10 bg-[#fbf7f1]/96 shadow-[0_10px_24px_rgba(43,39,34,0.08)] backdrop-blur-xl lg:bg-white/92 lg:shadow-[0_12px_28px_rgba(43,39,34,0.08)]"
          >
            <div className="page-shell page-section--tight py-2.5 sm:py-3 lg:py-3.5 xl:py-4">
              {headerLinks.length > 0 ? (
                <div className="mb-3 hidden items-center justify-between gap-4 border-b border-ink/10 pb-3 lg:flex">
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

              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-3.5">
                <HeaderBrand
                  siteName={siteSettings.siteName}
                  wayfindingLabel={header.wayfindingLabel}
                />

                <SearchBar
                  autocompleteData={header.autocompleteData}
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
            activeMegaCategory={header.activeMegaCategory}
            activeMegaCategoryData={header.activeMegaCategoryData}
            childrenByParent={header.childrenByParent}
            isOpen={header.isCatalogMenuOpen}
            megaChildren={header.megaChildren}
            navCategories={header.navCategories}
            onCloseMega={header.closeMega}
            onCloseMegaWithDelay={header.closeMegaWithDelay}
            onOpenMega={header.openMega}
            onTrackCategoryClick={header.trackCategoryNavigation}
            onToggleMega={(token) => {
              header.setActiveMegaCategory((current) => (current === token ? '' : token));
            }}
          />
        </header>
      </div>
      <MobileMenu
        activeMobileParent={header.activeMobileParent}
        childrenByParent={header.childrenByParent}
        isOpen={header.isMenuOpen}
        mobileCategories={header.mobileCategories}
        mobilePath={header.mobilePath}
        mobileTitle={header.mobileTitle}
        onClose={header.closeMenu}
        onOpenCategory={(token) => {
          header.setMobilePath((current) => [...current, token]);
        }}
        onStepBack={() => {
          header.setMobilePath((current) => current.slice(0, -1));
        }}
        onTrackCategoryClick={header.trackCategoryNavigation}
        searchTerm={header.searchTerm}
        siteName={siteSettings.siteName}
        utilityNavigation={headerNavigation}
      />

      <BottomNavBar
        activeKey={header.activeBottomNavKey}
        isAuthenticated={header.isAuthenticated}
        isEnabled={header.isBottomNavEnabled}
        isMenuOpen={header.isMenuOpen}
        onOpenMenu={header.openMenu}
        onOpenSearch={header.openSearchPanel}
        totalItems={header.totalItems}
      />

      <LastAddedCartNotice
        lastAddedItem={header.lastAddedItem}
        onDismiss={header.dismissLastAddedItem}
      />
    </>
  );
}

export default Header;

import React from 'react';
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

function Header() {
  const header = useHeaderState();

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 pointer-events-none">
        <header ref={header.headerRef} className="relative pointer-events-auto">
          <div
            ref={header.headerBarRef}
            className="relative z-[90] border-b border-ink/10 bg-[#fbf7f1]/96 shadow-[0_10px_24px_rgba(43,39,34,0.08)] backdrop-blur-xl lg:bg-white/92 lg:shadow-[0_12px_28px_rgba(43,39,34,0.08)]"
          >
            <div className="page-shell page-section--tight py-2.5 sm:py-3 lg:py-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-3.5">
                <HeaderBrand
                  isMenuOpen={header.isMenuOpen}
                  menuTriggerRef={header.menuTriggerRef}
                  onMenuToggle={header.handleMenuToggle}
                  wayfindingLabel={header.wayfindingLabel}
                />

                <SearchBar
                  autocompleteData={header.autocompleteData}
                  buildSearchParams={header.buildSearchParams}
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

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="hidden lg:inline-flex"
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
        onSearchChange={header.handleMobileDrawerSearchInput}
        onSearchFocus={header.closeSearch}
        onSearchSubmit={header.handleMobileDrawerSearchSubmit}
        onStepBack={() => {
          header.setMobilePath((current) => current.slice(0, -1));
        }}
        onTrackCategoryClick={header.trackCategoryNavigation}
        searchTerm={header.searchTerm}
      />

      <BottomNavBar
        activeKey={header.activeBottomNavKey}
        isAuthenticated={header.isAuthenticated}
        isEnabled={header.isBottomNavEnabled}
        isMenuOpen={header.isMenuOpen}
        isSearchPanelVisible={header.isSearchPanelVisible}
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

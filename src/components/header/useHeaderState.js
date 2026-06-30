import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CartContext } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProductDirectoryData } from '../../features/product-list/data';
import { METRIKA_GOALS, trackMetrikaGoal } from '../../utils/metrika';
import {
  buildAccountLinks,
  buildCategoryCollections,
  buildHeaderSearchParams,
  resolveWayfindingLabel
} from '../../utils/header';
import { buildAutocompleteData, normalizeSearchText } from '../../utils/search';
import { readEnv } from '../../config/runtime';

export function useHeaderState() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchScope, setSearchScope] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCatalogMenuOpen, setIsCatalogMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { categories, products } = useProductDirectoryData();
  const { items, lastAddedItem, dismissLastAddedItem } = useContext(CartContext);
  const { hasRole, isAuthenticated, logout, tokenParsed } = useAuth();

  const managerRole = readEnv('REACT_APP_KEYCLOAK_MANAGER_ROLE', 'manager') || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);

  const headerRef = useRef(null);
  const headerBarRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const accountMenuRef = useRef(null);
  const lastAddedDismissTimerRef = useRef(null);

  const {
    navCategories,
    childrenByParent
  } = useMemo(() => buildCategoryCollections(categories), [categories]);

  const wayfindingLabel = useMemo(
    () => resolveWayfindingLabel(location.pathname, location.search),
    [location.pathname, location.search]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const displayName = useMemo(() => {
    if (!tokenParsed) {
      return 'Мой аккаунт';
    }
    const nameParts = [tokenParsed.given_name, tokenParsed.family_name].filter(Boolean);
    if (nameParts.length) {
      return nameParts.join(' ');
    }
    return tokenParsed.name || tokenParsed.preferred_username || 'Мой аккаунт';
  }, [tokenParsed]);

  const displayPhone = useMemo(() => {
    if (isManager) {
      return 'Менеджер';
    }
    return (
      tokenParsed?.phone_number ||
      tokenParsed?.phone ||
      tokenParsed?.phoneNumber ||
      'Добавьте телефон'
    );
  }, [isManager, tokenParsed]);

  const accountLinks = useMemo(() => buildAccountLinks(isManager), [isManager]);
  const scopeOptions = useMemo(() => navCategories.slice(0, 8), [navCategories]);

  const autocompleteData = useMemo(
    () =>
      buildAutocompleteData({
        query: debouncedSearchTerm.length >= 2 ? debouncedSearchTerm : '',
        products,
        categories,
        scopeToken: searchScope,
        queryLimit: 2,
        productLimit: 3,
        categoryLimit: 2
      }),
    [categories, debouncedSearchTerm, products, searchScope]
  );

  const hasSearchSuggestions =
    autocompleteData.categorySuggestions.length > 0 ||
    autocompleteData.suggestedQueries.length > 0 ||
    autocompleteData.productSuggestions.length > 0 ||
    autocompleteData.hasCorrection;
  const hasSearchMinimumLength = normalizeSearchText(searchTerm).length >= 2;

  const isSearchPanelVisible =
    (isSearchOpen || isSearchFocused) && hasSearchMinimumLength && (searchTerm || hasSearchSuggestions);

  const mobileCategories = navCategories;
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setIsSearchFocused(false);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const closeAccountMenu = useCallback(() => {
    setIsAccountMenuOpen(false);
  }, []);

  const closeMega = useCallback(() => {
    setIsCatalogMenuOpen(false);
  }, []);

  const closeAllPanels = useCallback(() => {
    closeSearch();
    closeMenu();
    closeAccountMenu();
    closeMega();
  }, [closeAccountMenu, closeMega, closeMenu, closeSearch]);

  const updateHeaderHeight = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const headerEl = headerBarRef.current;
    if (!headerEl) {
      return;
    }
    const height = Math.ceil(headerEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--site-header-height', `${height}px`);
  }, []);

  useEffect(() => {
    updateHeaderHeight();
  }, [isMenuOpen, isSearchPanelVisible, navCategories.length, updateHeaderHeight]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(normalizeSearchText(searchTerm));
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    const headerEl = headerBarRef.current;
    if (!headerEl || typeof window === 'undefined') {
      return undefined;
    }

    updateHeaderHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateHeaderHeight());
      observer.observe(headerEl);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [updateHeaderHeight]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeMenu();
      }
      if (window.innerWidth >= 768) {
        closeAccountMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeAccountMenu, closeMenu]);

  useEffect(() => {
    closeAllPanels();
  }, [closeAllPanels, location.pathname, location.search]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const shouldLockViewport =
      isMenuOpen ||
      (isSearchPanelVisible &&
        typeof window !== 'undefined' &&
        window.innerWidth < 1024);

    if (!shouldLockViewport) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [isMenuOpen, isSearchPanelVisible]);

  useEffect(() => {
    if ((!isSearchOpen && !isSearchFocused) || typeof document === 'undefined') {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!searchRef.current || searchRef.current.contains(event.target)) {
        return;
      }
      closeSearch();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [closeSearch, isSearchFocused, isSearchOpen]);

  useEffect(() => {
    if (!isAccountMenuOpen || typeof document === 'undefined') {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current || accountMenuRef.current.contains(event.target)) {
        return;
      }
      closeAccountMenu();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [closeAccountMenu, isAccountMenuOpen]);

  useEffect(() => {
    if (!isCatalogMenuOpen || typeof document === 'undefined') {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!headerRef.current || headerRef.current.contains(event.target)) {
        return;
      }
      closeMega();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isCatalogMenuOpen, closeMega]);

  useEffect(() => {
    if (!lastAddedItem) {
      return undefined;
    }

    if (lastAddedDismissTimerRef.current) {
      clearTimeout(lastAddedDismissTimerRef.current);
    }

    lastAddedDismissTimerRef.current = setTimeout(() => {
      dismissLastAddedItem();
    }, 5000);

    return () => {
      if (lastAddedDismissTimerRef.current) {
        clearTimeout(lastAddedDismissTimerRef.current);
      }
    };
  }, [dismissLastAddedItem, lastAddedItem]);

  useEffect(() => {
    if (
      !isMenuOpen &&
      !isSearchOpen &&
      !isSearchFocused &&
      !isAccountMenuOpen &&
      !isCatalogMenuOpen
    ) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return;
      }
      closeAllPanels();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    closeAllPanels,
    isCatalogMenuOpen,
    isAccountMenuOpen,
    isMenuOpen,
    isSearchFocused,
    isSearchOpen
  ]);

  useEffect(
    () => () => {
      if (lastAddedDismissTimerRef.current) {
        clearTimeout(lastAddedDismissTimerRef.current);
      }
    },
    []
  );

  const buildSearchParams = useCallback(
    (queryValue, scopeValue = searchScope, originalQuery = '') =>
      buildHeaderSearchParams({
        queryValue,
        scopeValue,
        originalQuery
      }),
    [searchScope]
  );

  const navigateSearch = useCallback(
    (queryValue, options = {}) => {
      const normalized = normalizeSearchText(queryValue);
      if (!normalized) {
        return;
      }

      const params = buildSearchParams(
        queryValue.trim(),
        options.scopeValue ?? searchScope,
        options.originalQuery || ''
      );

      const targetSearch = params.toString();
      navigate(targetSearch ? `/search?${targetSearch}` : '/search');
      closeSearch();
      closeMenu();
      closeMega();
    },
    [buildSearchParams, closeMega, closeMenu, closeSearch, navigate, searchScope]
  );

  const trackCategoryNavigation = useCallback((token, source) => {
    trackMetrikaGoal(METRIKA_GOALS.CATEGORY_NAV_CLICK, {
      category: token,
      source
    });
  }, []);

  const trackSearchSuggestionClick = useCallback((kind, value, scopeToken = '') => {
    trackMetrikaGoal(METRIKA_GOALS.SEARCH_SUGGESTION_CLICK, {
      kind,
      value,
      scope: scopeToken
    });
  }, []);

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const typedQuery = searchTerm.trim();
      if (!typedQuery) {
        return;
      }

      if (autocompleteData.hasCorrection && autocompleteData.correctedQuery) {
        navigateSearch(autocompleteData.correctedQuery, {
          originalQuery: typedQuery
        });
        return;
      }

      navigateSearch(typedQuery);
    },
    [autocompleteData, navigateSearch, searchTerm]
  );

  const handleSearchInputChange = useCallback(
    (event) => {
      setSearchTerm(event.target.value);
      closeAccountMenu();
      closeMenu();
      closeMega();
      setIsSearchOpen(true);
    },
    [closeAccountMenu, closeMega, closeMenu]
  );

  const handleSearchFocus = useCallback(() => {
    closeAccountMenu();
    closeMenu();
    closeMega();
    setIsSearchFocused(true);
    setIsSearchOpen(true);
  }, [closeAccountMenu, closeMega, closeMenu]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    closeSearch();
  }, [closeSearch]);

  const openSearchPanel = useCallback(() => {
    closeMenu();
    closeMega();
    closeAccountMenu();
    setIsSearchOpen(true);
    setIsSearchFocused(true);
    if (typeof window === 'undefined') {
      return;
    }
    window.requestAnimationFrame?.(() => {
      searchInputRef.current?.focus();
    });
  }, [closeAccountMenu, closeMega, closeMenu]);

  const openMenu = useCallback(() => {
    setIsMenuOpen(true);
    closeAccountMenu();
    closeSearch();
    closeMega();
  }, [closeAccountMenu, closeMega, closeSearch]);

  const handleCatalogToggle = useCallback(() => {
    setIsMenuOpen(false);
    closeAccountMenu();
    closeSearch();
    setIsCatalogMenuOpen((current) => !current);
  }, [closeAccountMenu, closeSearch]);

  const handleLogout = useCallback(() => {
    closeAccountMenu();
    logout();
    navigate('/');
  }, [closeAccountMenu, logout, navigate]);

  const handleAccountTrigger = useCallback(
    (event) => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        event.preventDefault();
        navigate('/account');
        return;
      }
      setIsAccountMenuOpen((prev) => !prev);
    },
    [navigate]
  );

  const handleAccountNav = useCallback(() => {
    closeAccountMenu();
    closeMenu();
  }, [closeAccountMenu, closeMenu]);

  return {
    accountLinks,
    accountMenuRef,
    autocompleteData,
    childrenByParent,
    clearSearch,
    closeMenu,
    closeMega,
    closeSearch,
    dismissLastAddedItem,
    displayName,
    displayPhone,
    handleAccountNav,
    handleAccountTrigger,
    handleCatalogToggle,
    handleLogout,
    handleSearchFocus,
    handleSearchInputChange,
    handleSearchSubmit,
    headerBarRef,
    headerRef,
    isAccountMenuOpen,
    isAuthenticated,
    isCatalogMenuOpen,
    isManager,
    isMenuOpen,
    isSearchOpen,
    isSearchPanelVisible,
    lastAddedItem,
    mobileCategories,
    navCategories,
    navigateSearch,
    openMenu,
    openSearchPanel,
    scopeOptions,
    searchRef,
    searchInputRef,
    searchScope,
    searchTerm,
    setSearchScope,
    trackCategoryNavigation,
    trackSearchSuggestionClick,
    totalItems,
    wayfindingLabel
  };
}

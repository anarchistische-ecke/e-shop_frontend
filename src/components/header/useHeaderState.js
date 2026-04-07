import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CartContext } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProductDirectoryData } from '../../features/product-list/data';
import {
  buildAccountLinks,
  buildCategoryCollections,
  buildHeaderSearchParams,
  resolveWayfindingLabel
} from '../../utils/header';
import { buildAutocompleteData, normalizeSearchText } from '../../utils/search';

export function useHeaderState() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchScope, setSearchScope] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobilePath, setMobilePath] = useState([]);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { categories, products } = useProductDirectoryData();
  const { items, lastAddedItem, dismissLastAddedItem } = useContext(CartContext);
  const { hasRole, isAuthenticated, logout, tokenParsed } = useAuth();

  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);

  const headerRef = useRef(null);
  const searchRef = useRef(null);
  const accountMenuRef = useRef(null);
  const hoverCloseTimerRef = useRef(null);
  const lastAddedDismissTimerRef = useRef(null);

  const {
    navCategories,
    categoryByToken,
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
        query: searchTerm,
        products,
        categories,
        scopeToken: searchScope
      }),
    [categories, products, searchScope, searchTerm]
  );

  const hasSearchSuggestions =
    autocompleteData.suggestedQueries.length > 0 ||
    autocompleteData.productSuggestions.length > 0 ||
    autocompleteData.hasCorrection;

  const isSearchPanelVisible =
    (isSearchOpen || isSearchFocused) && (searchTerm || hasSearchSuggestions);

  const activeMegaCategoryData = activeMegaCategory
    ? categoryByToken[activeMegaCategory]
    : null;
  const megaChildren = activeMegaCategoryData
    ? childrenByParent[String(activeMegaCategoryData.id)] || []
    : [];

  const activeMobileParentToken = mobilePath[mobilePath.length - 1] || '';
  const activeMobileParent = activeMobileParentToken
    ? categoryByToken[activeMobileParentToken]
    : null;
  const mobileCategories = activeMobileParent
    ? childrenByParent[String(activeMobileParent.id)] || []
    : navCategories;
  const mobileTitle = activeMobileParent ? activeMobileParent.name : 'Каталог';

  const clearHoverCloseTimer = useCallback(() => {
    if (!hoverCloseTimerRef.current) {
      return;
    }
    clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = null;
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setIsSearchFocused(false);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setMobilePath([]);
  }, []);

  const closeAccountMenu = useCallback(() => {
    setIsAccountMenuOpen(false);
  }, []);

  const closeMega = useCallback(() => {
    clearHoverCloseTimer();
    setActiveMegaCategory('');
  }, [clearHoverCloseTimer]);

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
    const headerEl = headerRef.current;
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
    const headerEl = headerRef.current;
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
    if (!isMenuOpen) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

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
      !activeMegaCategory
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
    activeMegaCategory,
    closeAllPanels,
    isAccountMenuOpen,
    isMenuOpen,
    isSearchFocused,
    isSearchOpen
  ]);

  useEffect(
    () => () => {
      clearHoverCloseTimer();
      if (lastAddedDismissTimerRef.current) {
        clearTimeout(lastAddedDismissTimerRef.current);
      }
    },
    [clearHoverCloseTimer]
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

      navigate(`/catalog?${params.toString()}`);
      closeSearch();
      closeMenu();
      closeMega();
    },
    [buildSearchParams, closeMega, closeMenu, closeSearch, navigate, searchScope]
  );

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
      closeMenu();
      setIsSearchOpen(true);
    },
    [closeMenu]
  );

  const handleSearchFocus = useCallback(() => {
    closeMenu();
    setIsSearchFocused(true);
    setIsSearchOpen(true);
  }, [closeMenu]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    closeSearch();
  }, [closeSearch]);

  const openMega = useCallback(
    (categoryToken) => {
      clearHoverCloseTimer();
      setActiveMegaCategory(categoryToken);
    },
    [clearHoverCloseTimer]
  );

  const closeMegaWithDelay = useCallback(() => {
    clearHoverCloseTimer();
    hoverCloseTimerRef.current = setTimeout(() => {
      setActiveMegaCategory('');
    }, 120);
  }, [clearHoverCloseTimer]);

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
    closeSearch();
  }, [closeSearch]);

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

  const handleMobileDrawerSearchInput = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleMobileDrawerSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!searchTerm.trim()) {
        return;
      }
      navigateSearch(searchTerm);
    },
    [navigateSearch, searchTerm]
  );

  return {
    accountLinks,
    accountMenuRef,
    activeMegaCategory,
    activeMegaCategoryData,
    activeMobileParent,
    autocompleteData,
    buildSearchParams,
    childrenByParent,
    clearSearch,
    closeMenu,
    closeMega,
    closeMegaWithDelay,
    closeSearch,
    dismissLastAddedItem,
    displayName,
    displayPhone,
    handleAccountNav,
    handleAccountTrigger,
    handleLogout,
    handleMenuToggle,
    handleMobileDrawerSearchInput,
    handleMobileDrawerSearchSubmit,
    handleSearchFocus,
    handleSearchInputChange,
    handleSearchSubmit,
    headerRef,
    isAccountMenuOpen,
    isAuthenticated,
    isManager,
    isMenuOpen,
    isSearchPanelVisible,
    lastAddedItem,
    megaChildren,
    mobileCategories,
    mobilePath,
    mobileTitle,
    navCategories,
    navigateSearch,
    openMega,
    scopeOptions,
    searchRef,
    searchScope,
    searchTerm,
    setActiveMegaCategory,
    setMobilePath,
    setSearchScope,
    totalItems,
    wayfindingLabel
  };
}

import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCategories, getProducts } from '../api';
import { CartContext } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { buildAutocompleteData, normalizeSearchText } from '../utils/search';
import { getPrimaryImageUrl, getProductPrice } from '../utils/product';

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function ChevronIcon({ className = 'h-4 w-4', isOpen = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} transition-transform ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CartIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M3 4h2l2.5 10.5a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L21 7H7" />
    </svg>
  );
}

function UserIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function resolveCategoryToken(category) {
  return String(category?.slug || category?.id || category?.name || '');
}

function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchScope, setSearchScope] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobilePath, setMobilePath] = useState([]);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeMegaCategory, setActiveMegaCategory] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const {
    items,
    lastAddedItem,
    dismissLastAddedItem,
  } = useContext(CartContext);
  const { isAuthenticated, logout, tokenParsed, hasRole } = useAuth();
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);

  const hoverCloseTimerRef = useRef(null);
  const headerRef = useRef(null);
  const accountMenuRef = useRef(null);
  const megaMenuRef = useRef(null);
  const searchRef = useRef(null);
  const lastAddedDismissTimerRef = useRef(null);

  const displayName = useMemo(() => {
    if (!tokenParsed) return 'Мой аккаунт';
    const nameParts = [tokenParsed.given_name, tokenParsed.family_name].filter(Boolean);
    if (nameParts.length) return nameParts.join(' ');
    return tokenParsed.name || tokenParsed.preferred_username || 'Мой аккаунт';
  }, [tokenParsed]);

  const displayPhone = useMemo(() => {
    if (isManager) return 'Менеджер';
    return (
      tokenParsed?.phone_number ||
      tokenParsed?.phone ||
      tokenParsed?.phoneNumber ||
      'Добавьте телефон'
    );
  }, [isManager, tokenParsed]);

  const navCategories = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list
      .filter((cat) => !cat.parentId)
      .slice()
      .sort(
        (a, b) =>
          (a.position ?? 0) - (b.position ?? 0) ||
          (a.name || '').localeCompare(b.name || '')
      );
  }, [categories]);

  const categoryByToken = useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      const token = resolveCategoryToken(category);
      if (!token) return;
      map[token] = category;
    });
    return map;
  }, [categories]);

  const childrenByParent = useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      const parentToken = String(category?.parentId || '');
      if (!parentToken) return;
      if (!map[parentToken]) map[parentToken] = [];
      map[parentToken].push(category);
    });

    Object.keys(map).forEach((parentToken) => {
      map[parentToken].sort(
        (a, b) =>
          (a.position ?? 0) - (b.position ?? 0) ||
          (a.name || '').localeCompare(b.name || '')
      );
    });

    return map;
  }, [categories]);

  const scopeOptions = useMemo(() => navCategories.slice(0, 8), [navCategories]);

  const autocompleteData = useMemo(
    () =>
      buildAutocompleteData({
        query: searchTerm,
        products,
        categories,
        scopeToken: searchScope,
      }),
    [searchTerm, products, categories, searchScope]
  );

  const hasSearchSuggestions =
    autocompleteData.suggestedQueries.length > 0 ||
    autocompleteData.productSuggestions.length > 0 ||
    autocompleteData.hasCorrection;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const activeMobileParentToken = mobilePath[mobilePath.length - 1] || '';
  const activeMobileParent = activeMobileParentToken ? categoryByToken[activeMobileParentToken] : null;
  const mobileCategories = activeMobileParent
    ? childrenByParent[String(activeMobileParent.id)] || []
    : navCategories;

  const mobileTitle = activeMobileParent ? activeMobileParent.name : 'Каталог';

  const accountLinks = useMemo(() => {
    if (isManager) {
      return [
        { to: '/account#overview', label: 'Сводка' },
        { to: '/account#orders', label: 'Заказы' },
        { to: '/cart', label: 'Ссылка на оплату' },
      ];
    }

    return [
      { to: '/account#profile', label: 'Профиль' },
      { to: '/account#bonuses', label: 'Уютные бонусы' },
      { to: '/account#promocodes', label: 'Мои промокоды' },
      { to: '/account#referral', label: 'Приведи друга' },
      { to: '/account#orders', label: 'Мои заказы' },
      { to: '/account#purchases', label: 'Купленные товары' },
    ];
  }, [isManager]);

  const updateHeaderHeight = useCallback(() => {
    if (typeof window === 'undefined') return;
    const headerEl = headerRef.current;
    if (!headerEl) return;
    const height = Math.ceil(headerEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--site-header-height', `${height}px`);
  }, []);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));

    getProducts()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProducts(list.filter((product) => product?.isActive !== false));
      })
      .catch((err) => {
        console.error('Failed to fetch products for search:', err);
        setProducts([]);
      });
  }, []);

  useEffect(() => {
    updateHeaderHeight();
  }, [isMenuOpen, navCategories.length, isSearchOpen, updateHeaderHeight]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
        setMobilePath([]);
      }
      if (window.innerWidth >= 768) {
        setIsAccountMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl || typeof window === 'undefined') return undefined;
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
    setIsMenuOpen(false);
    setMobilePath([]);
    setActiveMegaCategory('');
    setIsSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isAccountMenuOpen || typeof document === 'undefined') return undefined;
    const handlePointerDown = (event) => {
      if (!accountMenuRef.current || accountMenuRef.current.contains(event.target)) return;
      setIsAccountMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if ((!isSearchOpen && !isSearchFocused) || typeof document === 'undefined') return undefined;
    const handlePointerDown = (event) => {
      if (!searchRef.current || searchRef.current.contains(event.target)) return;
      setIsSearchOpen(false);
      setIsSearchFocused(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isSearchOpen, isSearchFocused]);

  useEffect(() => {
    if (!lastAddedItem) return undefined;
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
  }, [lastAddedItem, dismissLastAddedItem]);

  const buildSearchParams = useCallback((queryValue, scopeValue = searchScope, originalQuery = '') => {
    const params = new URLSearchParams();
    params.set('query', queryValue);

    if (scopeValue) {
      const scopeCategory = categoryByToken[scopeValue];
      params.set('scope', scopeValue);
      if (scopeCategory?.name) {
        params.set('scopeLabel', scopeCategory.name);
      }
    }

    if (originalQuery && normalizeSearchText(originalQuery) !== normalizeSearchText(queryValue)) {
      params.set('original', originalQuery);
      params.set('corrected', queryValue);
    }

    return params;
  }, [searchScope, categoryByToken]);

  const navigateSearch = useCallback((queryValue, options = {}) => {
    const normalized = normalizeSearchText(queryValue);
    if (!normalized) return;

    const params = buildSearchParams(queryValue.trim(), options.scopeValue ?? searchScope, options.originalQuery || '');
    navigate(`/category/search?${params.toString()}`);
    setIsSearchOpen(false);
    setIsSearchFocused(false);
    setIsMenuOpen(false);
  }, [buildSearchParams, navigate, searchScope]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const typedQuery = searchTerm.trim();
    if (!typedQuery) return;

    if (autocompleteData.hasCorrection && autocompleteData.correctedQuery) {
      navigateSearch(autocompleteData.correctedQuery, { originalQuery: typedQuery });
      return;
    }

    navigateSearch(typedQuery);
  };

  const handleSearchInputChange = (event) => {
    setSearchTerm(event.target.value);
    setIsSearchOpen(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  const openMega = (categoryToken) => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
    setActiveMegaCategory(categoryToken);
  };

  const closeMegaWithDelay = () => {
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = setTimeout(() => {
      setActiveMegaCategory('');
    }, 110);
  };

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    logout();
    navigate('/');
  };

  const handleAccountTrigger = (event) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      event.preventDefault();
      setIsMenuOpen(false);
      setIsAccountMenuOpen((prev) => !prev);
      return;
    }
    setIsAccountMenuOpen((prev) => !prev);
  };

  const handleAccountNav = () => {
    setIsAccountMenuOpen(false);
    setIsMenuOpen(false);
  };

  const activeMegaCategoryData = activeMegaCategory ? categoryByToken[activeMegaCategory] : null;
  const megaChildren = activeMegaCategoryData
    ? childrenByParent[String(activeMegaCategoryData.id)] || []
    : [];

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-40">
      <div className="relative z-30 bg-white/90 backdrop-blur-xl border-b border-ink/10 shadow-[0_12px_28px_rgba(43,39,34,0.08)]">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="lg:hidden h-11 w-11 inline-flex items-center justify-center rounded-2xl border border-ink/10 bg-white text-ink hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Открыть меню"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
              <Link
                to="/"
                className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-ink tracking-tight hover:text-primary whitespace-nowrap"
              >
                Постельное Белье-ЮГ
              </Link>
            </div>

            <div ref={searchRef} className="relative w-full">
              <form onSubmit={handleSearchSubmit} className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Поиск по товарам, коллекциям и категориям"
                  className="w-full rounded-2xl border border-ink/10 bg-white pl-11 pr-12 py-3 text-sm shadow-[0_10px_24px_rgba(43,39,34,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label="Поиск товаров"
                  autoComplete="off"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 inline-flex items-center justify-center rounded-2xl text-ink/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    aria-label="Очистить поиск"
                  >
                    ×
                  </button>
                )}
              </form>

              {(isSearchOpen || isSearchFocused) && (searchTerm || hasSearchSuggestions) && (
                <div className="absolute z-50 mt-3 w-full rounded-[26px] border border-ink/10 bg-white p-4 shadow-[0_24px_56px_rgba(43,39,34,0.18)]">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Область поиска</span>
                    <button
                      type="button"
                      onClick={() => setSearchScope('')}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        !searchScope
                          ? 'border-primary/45 bg-primary/10 text-primary'
                          : 'border-ink/15 bg-white text-ink/70'
                      }`}
                    >
                      Везде
                    </button>
                    {scopeOptions.map((category) => {
                      const token = normalizeSearchText(resolveCategoryToken(category));
                      const isActive = searchScope === token;
                      return (
                        <button
                          key={resolveCategoryToken(category)}
                          type="button"
                          onClick={() => setSearchScope(isActive ? '' : token)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            isActive
                              ? 'border-primary/45 bg-primary/10 text-primary'
                              : 'border-ink/15 bg-white text-ink/70 hover:border-primary/35 hover:text-primary'
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>

                  {autocompleteData.hasCorrection && autocompleteData.correctedQuery && (
                    <p className="mb-3 text-xs text-muted">
                      Показываем подсказки для <span className="font-semibold text-ink">“{autocompleteData.correctedQuery}”</span>. Исходный запрос:
                      {' '}
                      <span className="font-semibold text-ink">“{searchTerm.trim()}”</span>.
                    </p>
                  )}

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                    <section>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted mb-2">Подсказки поиска</p>
                      <div className="space-y-1">
                        {autocompleteData.suggestedQueries.length > 0 ? (
                          autocompleteData.suggestedQueries.map((suggestion) => (
                            <button
                              key={`${suggestion.label}-${suggestion.scopeToken}`}
                              type="button"
                              onClick={() => {
                                const nextScope = suggestion.scopeToken || searchScope;
                                setSearchScope(nextScope);
                                navigateSearch(suggestion.label, { scopeValue: nextScope });
                              }}
                              className="w-full rounded-xl border border-transparent px-3 py-2 text-left text-sm text-ink hover:border-ink/10 hover:bg-secondary/45"
                            >
                              {suggestion.label}
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-muted px-3 py-2">Начните вводить запрос, чтобы увидеть подсказки.</p>
                        )}
                      </div>
                    </section>

                    <section>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted mb-2">Товары</p>
                      <div className="space-y-1">
                        {autocompleteData.productSuggestions.length > 0 ? (
                          autocompleteData.productSuggestions.map((product) => {
                            const previewImage = getPrimaryImageUrl(product);
                            const previewPrice = getProductPrice(product);
                            return (
                              <Link
                                key={product.id}
                                to={`/product/${product.id}`}
                                state={{
                                  fromPath: `/category/search?${buildSearchParams(searchTerm.trim() || autocompleteData.correctedQuery || '', searchScope).toString()}`,
                                  fromLabel: 'Результаты поиска',
                                }}
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  setIsSearchFocused(false);
                                }}
                                className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-transparent px-3 py-2 hover:border-ink/10 hover:bg-secondary/45"
                              >
                                <div className="h-11 w-11 overflow-hidden rounded-xl border border-ink/10 bg-sand/60">
                                  {previewImage ? (
                                    <img
                                      src={previewImage}
                                      alt={product.name}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">Фото</div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                                  <p className="text-xs text-muted">
                                    {(Number(product.rating) || 0) > 0
                                      ? `★ ${Number(product.rating).toFixed(1)} · ${product.reviewCount || product.reviewsCount || 0} отзывов`
                                      : 'Пока без отзывов'}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-accent whitespace-nowrap">
                                  {previewPrice.toLocaleString('ru-RU')} ₽
                                </p>
                              </Link>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted px-3 py-2">Товары появятся, когда запрос станет точнее.</p>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <Link
                to="/cart"
                aria-label="Корзина"
                className="relative inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-white px-3 text-ink shadow-[0_10px_20px_rgba(43,39,34,0.06)] hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition"
              >
                <CartIcon className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">Корзина</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-accent text-white text-[11px] leading-none">
                    {totalItems}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div ref={accountMenuRef} className="relative">
                  <button
                    type="button"
                    aria-label="Личный кабинет"
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-ink/10 bg-white px-3 text-ink shadow-[0_10px_20px_rgba(43,39,34,0.06)] hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    onClick={handleAccountTrigger}
                    aria-expanded={isAccountMenuOpen}
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sand/70 text-accent">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <span className="hidden sm:inline text-sm font-medium">Мой кабинет</span>
                  </button>

                  <div
                    className={`absolute right-0 top-full mt-3 w-72 transition-all duration-200 ${
                      isAccountMenuOpen
                        ? 'translate-y-0 opacity-100 pointer-events-auto'
                        : 'translate-y-2 opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="rounded-[24px] border border-ink/10 bg-white shadow-[0_24px_60px_rgba(43,39,34,0.18)] overflow-hidden">
                      <div className="flex items-start justify-between gap-3 px-4 py-4 border-b border-ink/10 bg-sand/40">
                        <div>
                          <p className="text-base font-semibold leading-tight">{displayName}</p>
                          <p className="text-xs text-muted mt-1">{displayPhone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="h-10 w-10 inline-flex items-center justify-center rounded-2xl border border-ink/10 text-ink/70 hover:text-primary hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label="Выйти"
                        >
                          ↗
                        </button>
                      </div>
                      <div className="py-2">
                        {accountLinks.map((entry) => (
                          <Link
                            key={entry.to}
                            to={entry.to}
                            onClick={handleAccountNav}
                            className="flex w-full items-center px-4 py-2.5 text-sm text-ink hover:bg-sand/45"
                          >
                            {entry.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  aria-label="Войти"
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-ink/10 bg-white px-3 text-ink shadow-[0_10px_20px_rgba(43,39,34,0.06)] hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm">Войти</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={megaMenuRef}
        className="relative z-10 hidden lg:block bg-white/95 backdrop-blur border-b border-ink/10"
        onMouseLeave={closeMegaWithDelay}
      >
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-2 py-3 text-sm overflow-x-auto scrollbar-hide">
            <li>
              <Link
                to="/category/popular"
                className="inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-white/90 px-3 py-2 hover:text-primary hover:border-primary/45"
              >
                Лучшее
              </Link>
            </li>
            {navCategories.map((category) => {
              const token = resolveCategoryToken(category);
              const children = childrenByParent[String(category.id)] || [];
              const isActive = activeMegaCategory === token;
              const hasChildren = children.length > 0;

              return (
                <li
                  key={token}
                  onMouseEnter={() => {
                    if (hasChildren) openMega(token);
                    else setActiveMegaCategory('');
                  }}
                  onFocus={() => {
                    if (hasChildren) openMega(token);
                  }}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 transition ${
                        isActive
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-ink/10 bg-white/90 text-ink hover:text-primary hover:border-primary/45'
                      }`}
                      onClick={() => {
                        setActiveMegaCategory((prev) => (prev === token ? '' : token));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setActiveMegaCategory('');
                        }
                      }}
                      aria-expanded={isActive}
                    >
                      <span>{category.name}</span>
                      <ChevronIcon className="h-4 w-4" isOpen={isActive} />
                    </button>
                  ) : (
                    <Link
                      to={`/category/${token}`}
                      className="inline-flex items-center rounded-xl border border-ink/10 bg-white/90 px-3 py-2 hover:text-primary hover:border-primary/45"
                    >
                      {category.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {activeMegaCategoryData && megaChildren.length > 0 && (
            <div
              className="pb-4"
              onMouseEnter={() => openMega(activeMegaCategory)}
            >
              <div className="rounded-[24px] border border-ink/10 bg-white p-5 shadow-[0_20px_48px_rgba(43,39,34,0.14)]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{activeMegaCategoryData.name}</p>
                  <Link to={`/category/${resolveCategoryToken(activeMegaCategoryData)}`} className="text-sm text-primary">
                    Смотреть всё
                  </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {megaChildren.map((subCategory) => {
                    const nested = childrenByParent[String(subCategory.id)] || [];
                    return (
                      <div key={resolveCategoryToken(subCategory)} className="space-y-2">
                        <Link
                          to={`/category/${resolveCategoryToken(subCategory)}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-primary"
                        >
                          {subCategory.name}
                        </Link>
                        <div className="space-y-1">
                          {nested.slice(0, 6).map((nestedCategory) => (
                            <Link
                              key={resolveCategoryToken(nestedCategory)}
                              to={`/category/${resolveCategoryToken(nestedCategory)}`}
                              className="block rounded-xl px-2 py-1.5 text-sm text-muted hover:bg-secondary/40 hover:text-primary"
                            >
                              {nestedCategory.name}
                            </Link>
                          ))}
                          {nested.length === 0 && (
                            <p className="text-xs text-muted">Подкатегории появятся позже.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-b border-ink/10 bg-white backdrop-blur">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Навигация</p>
                <p className="text-sm font-semibold">{mobileTitle}</p>
              </div>
              {mobilePath.length > 0 ? (
                <button
                  type="button"
                  className="button-ghost !px-2 !py-1 text-xs"
                  onClick={() => setMobilePath((prev) => prev.slice(0, -1))}
                >
                  ← Назад
                </button>
              ) : null}
            </div>

            <div className="rounded-2xl border border-ink/10 bg-secondary/45 p-2 flex gap-2">
              <Link to="/category/popular" className="button-ghost !px-3 !py-2 text-xs" onClick={() => setIsMenuOpen(false)}>
                Лучшее
              </Link>
              <Link to="/category/new" className="button-ghost !px-3 !py-2 text-xs" onClick={() => setIsMenuOpen(false)}>
                Новинки
              </Link>
            </div>

            <ul className="space-y-1">
              {mobileCategories.map((category) => {
                const token = resolveCategoryToken(category);
                const nested = childrenByParent[String(category.id)] || [];
                const hasNested = nested.length > 0;

                return (
                  <li key={token}>
                    {hasNested ? (
                      <button
                        type="button"
                        className="w-full min-h-[44px] rounded-2xl border border-ink/10 bg-white px-3 py-2 flex items-center justify-between text-left text-sm"
                        onClick={() => setMobilePath((prev) => [...prev, token])}
                      >
                        <span>{category.name}</span>
                        <ChevronIcon className="h-4 w-4 -rotate-90" />
                      </button>
                    ) : (
                      <Link
                        to={`/category/${token}`}
                        className="w-full min-h-[44px] rounded-2xl border border-ink/10 bg-white px-3 py-2 flex items-center justify-between text-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span>{category.name}</span>
                        <span className="text-muted">→</span>
                      </Link>
                    )}
                  </li>
                );
              })}
              {mobileCategories.length === 0 && (
                <li className="text-sm text-muted px-2 py-2">Категории появятся после заполнения каталога.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div
        className={`fixed right-4 z-50 w-[min(92vw,390px)] transition-all duration-200 ${
          lastAddedItem
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
        style={{ top: 'calc(var(--site-header-height, 6.5rem) + 0.75rem)' }}
      >
        <div className="rounded-[22px] border border-ink/10 bg-white p-4 shadow-[0_22px_48px_rgba(43,39,34,0.22)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Добавлено в корзину</p>
              <p className="text-sm font-semibold text-ink">{lastAddedItem?.name || 'Товар'}</p>
            </div>
            <button
              type="button"
              className="h-10 w-10 inline-flex items-center justify-center rounded-2xl text-ink/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={dismissLastAddedItem}
              aria-label="Закрыть уведомление"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 grid grid-cols-[56px_minmax(0,1fr)] gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl border border-ink/10 bg-sand/60">
              {lastAddedItem?.imageUrl ? (
                <img src={lastAddedItem.imageUrl} alt={lastAddedItem.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">Фото</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted">{lastAddedItem?.variantName || 'Базовый вариант'}</p>
              <p className="text-sm text-ink">
                {lastAddedItem?.quantity || 1} шт. ·{' '}
                <span className="font-semibold text-accent">
                  {Number(lastAddedItem?.unitPriceValue || 0).toLocaleString('ru-RU')} ₽
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/cart" className="button-gray !px-3 !py-2 text-xs" onClick={dismissLastAddedItem}>
              Открыть корзину
            </Link>
            <Link to="/checkout" className="button !px-3 !py-2 text-xs" onClick={dismissLastAddedItem}>
              К оформлению
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

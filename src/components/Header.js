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

function resolveWayfindingLabel(pathname = '') {
  if (pathname === '/') return 'Главная';
  if (pathname.startsWith('/catalog')) return 'Каталог';
  if (pathname.startsWith('/category/search')) return 'Поиск';
  if (pathname.startsWith('/category/')) return 'Категория';
  if (pathname.startsWith('/product/')) return 'Карточка товара';
  if (pathname.startsWith('/cart')) return 'Корзина';
  if (pathname.startsWith('/checkout')) return 'Оформление';
  if (pathname.startsWith('/account')) return 'Личный кабинет';
  return 'Раздел магазина';
}

function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchScope, setSearchScope] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobilePath, setMobilePath] = useState([]);

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState('');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

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

  const headerRef = useRef(null);
  const searchRef = useRef(null);
  const accountMenuRef = useRef(null);
  const hoverCloseTimerRef = useRef(null);
  const lastAddedDismissTimerRef = useRef(null);

  const wayfindingLabel = useMemo(
    () => resolveWayfindingLabel(location.pathname),
    [location.pathname]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const displayName = useMemo(() => {
    if (!tokenParsed) return 'Мой аккаунт';
    const nameParts = [tokenParsed.given_name, tokenParsed.family_name].filter(Boolean);
    if (nameParts.length) return nameParts.join(' ');
    return tokenParsed.name || tokenParsed.preferred_username || 'Мой аккаунт';
  }, [tokenParsed]);

  const displayPhone = useMemo(() => {
    if (isManager) return 'Менеджер';
    return (
      tokenParsed?.phone_number
      || tokenParsed?.phone
      || tokenParsed?.phoneNumber
      || 'Добавьте телефон'
    );
  }, [isManager, tokenParsed]);

  const navCategories = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list
      .filter((cat) => !cat.parentId)
      .slice()
      .sort(
        (a, b) =>
          (a.position ?? 0) - (b.position ?? 0)
          || (a.name || '').localeCompare(b.name || '')
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

  const categoryByNormalizedToken = useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      const token = normalizeSearchText(resolveCategoryToken(category));
      if (!token) return;
      map[token] = category;
      map[normalizeSearchText(String(category.id || ''))] = category;
      map[normalizeSearchText(String(category.slug || ''))] = category;
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
          (a.position ?? 0) - (b.position ?? 0)
          || (a.name || '').localeCompare(b.name || '')
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
    autocompleteData.suggestedQueries.length > 0
    || autocompleteData.productSuggestions.length > 0
    || autocompleteData.hasCorrection;

  const isSearchPanelVisible = (isSearchOpen || isSearchFocused) && (searchTerm || hasSearchSuggestions);

  const activeMegaCategoryData = activeMegaCategory ? categoryByToken[activeMegaCategory] : null;
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
      .catch((error) => {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      });

    getProducts()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProducts(list.filter((product) => product?.isActive !== false));
      })
      .catch((error) => {
        console.error('Failed to fetch products for search:', error);
        setProducts([]);
      });
  }, []);

  useEffect(() => {
    updateHeaderHeight();
  }, [isMenuOpen, isSearchPanelVisible, navCategories.length, updateHeaderHeight]);

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
    setIsMenuOpen(false);
    setMobilePath([]);
    setIsSearchOpen(false);
    setIsSearchFocused(false);
    setIsAccountMenuOpen(false);
    setActiveMegaCategory('');
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

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
    if (!isAccountMenuOpen || typeof document === 'undefined') return undefined;
    const handlePointerDown = (event) => {
      if (!accountMenuRef.current || accountMenuRef.current.contains(event.target)) return;
      setIsAccountMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isAccountMenuOpen]);

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

  useEffect(
    () => () => {
      if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
      if (lastAddedDismissTimerRef.current) clearTimeout(lastAddedDismissTimerRef.current);
    },
    []
  );

  const buildSearchParams = useCallback(
    (queryValue, scopeValue = searchScope, originalQuery = '') => {
      const params = new URLSearchParams();
      params.set('query', queryValue);

      if (scopeValue) {
        const scopeCategory = categoryByNormalizedToken[scopeValue];
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
    },
    [searchScope, categoryByNormalizedToken]
  );

  const navigateSearch = useCallback(
    (queryValue, options = {}) => {
      const normalized = normalizeSearchText(queryValue);
      if (!normalized) return;

      const params = buildSearchParams(
        queryValue.trim(),
        options.scopeValue ?? searchScope,
        options.originalQuery || ''
      );

      navigate(`/category/search?${params.toString()}`);
      setIsSearchOpen(false);
      setIsSearchFocused(false);
      setIsMenuOpen(false);
      setMobilePath([]);
    },
    [buildSearchParams, navigate, searchScope]
  );

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
    setIsMenuOpen(false);
    setIsSearchOpen(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearchOpen(false);
    setIsSearchFocused(false);
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
    }, 120);
  };

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    logout();
    navigate('/');
  };

  const handleAccountTrigger = (event) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      event.preventDefault();
      navigate('/account');
      return;
    }
    setIsAccountMenuOpen((prev) => !prev);
  };

  const handleAccountNav = () => {
    setIsAccountMenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleMobileDrawerSearchInput = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleMobileDrawerSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) return;
    navigateSearch(searchTerm);
  };

  const searchPanelBody = (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
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
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted">Подсказки поиска</p>
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
              <p className="px-3 py-2 text-sm text-muted">Начните вводить запрос, чтобы увидеть подсказки.</p>
            )}
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted">Товары</p>
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
                      fromPath: `/category/search?${buildSearchParams(
                        searchTerm.trim() || autocompleteData.correctedQuery || '',
                        searchScope
                      ).toString()}`,
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
                    <p className="whitespace-nowrap text-sm font-semibold text-accent">
                      {previewPrice.toLocaleString('ru-RU')} ₽
                    </p>
                  </Link>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm text-muted">Товары появятся, когда запрос станет точнее.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50">
      <div className="relative z-[90] border-b border-ink/10 bg-white/92 shadow-[0_12px_28px_rgba(43,39,34,0.08)] backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-2">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 bg-white text-ink transition hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 lg:hidden"
                onClick={() => {
                  setIsMenuOpen((prev) => !prev);
                  setIsSearchOpen(false);
                  setIsSearchFocused(false);
                }}
                aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>

              <div className="min-w-0">
                <Link
                  to="/"
                  className="block truncate font-display text-xl font-semibold tracking-tight text-ink transition hover:text-primary sm:text-2xl lg:text-3xl"
                >
                  Постельное Белье-ЮГ
                </Link>
                <p className="mt-0.5 hidden truncate text-[11px] uppercase tracking-[0.18em] text-muted sm:block">
                  Раздел: {wayfindingLabel}
                </p>
              </div>
            </div>

            <div
              ref={searchRef}
              className={`relative col-span-2 lg:col-span-1 lg:col-start-2 ${
                isSearchPanelVisible ? 'z-[100]' : 'z-20'
              }`}
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onFocus={() => {
                    setIsMenuOpen(false);
                    setIsSearchFocused(true);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Поиск по товарам, коллекциям и категориям"
                  className="w-full rounded-2xl border border-ink/10 bg-white py-3 pl-11 pr-12 text-sm shadow-[0_10px_24px_rgba(43,39,34,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label="Поиск товаров"
                  autoComplete="off"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl text-ink/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    aria-label="Очистить поиск"
                  >
                    ×
                  </button>
                )}
              </form>

              {isSearchPanelVisible && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/20 lg:hidden"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setIsSearchFocused(false);
                    }}
                    aria-label="Закрыть подсказки поиска"
                  />

                  <div
                    className="fixed left-3 right-3 z-[110] max-h-[70vh] overflow-y-auto rounded-[24px] border border-ink/10 bg-white p-4 shadow-[0_24px_56px_rgba(43,39,34,0.22)] lg:hidden"
                    style={{ top: 'calc(var(--site-header-height, 6.5rem) + 0.5rem)' }}
                  >
                    {searchPanelBody}
                  </div>

                  <div className="relative hidden lg:block">
                    <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-[110] rounded-[24px] border border-ink/10 bg-white p-4 shadow-[0_24px_56px_rgba(43,39,34,0.18)]">
                      {searchPanelBody}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Link
                to="/catalog"
                className="hidden h-11 items-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-medium text-ink transition hover:border-primary/45 hover:text-primary lg:inline-flex"
              >
                Каталог
              </Link>

              <Link
                to="/cart"
                aria-label="Корзина"
                className="relative inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-white px-3 text-ink shadow-[0_10px_20px_rgba(43,39,34,0.06)] transition hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <CartIcon className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">Корзина</span>
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] leading-none text-white">
                    {totalItems}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    aria-label="Личный кабинет"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 bg-white text-ink shadow-[0_10px_20px_rgba(43,39,34,0.06)] transition hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:hidden"
                  >
                    <UserIcon className="h-5 w-5" />
                  </Link>

                  <div ref={accountMenuRef} className="relative hidden md:block">
                    <button
                      type="button"
                      aria-label="Личный кабинет"
                      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-ink/10 bg-white px-3 text-ink shadow-[0_10px_20px_rgba(43,39,34,0.06)] transition hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      onClick={handleAccountTrigger}
                      aria-expanded={isAccountMenuOpen}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sand/70 text-accent">
                        <UserIcon className="h-4 w-4" />
                      </span>
                      <span className="hidden text-sm font-medium lg:inline">Мой кабинет</span>
                    </button>

                    <div
                      className={`absolute right-0 top-full mt-3 w-72 transition-all duration-200 ${
                        isAccountMenuOpen
                          ? 'pointer-events-auto translate-y-0 opacity-100'
                          : 'pointer-events-none translate-y-2 opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden rounded-[24px] border border-ink/10 bg-white shadow-[0_24px_60px_rgba(43,39,34,0.18)]">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-ink/10 bg-sand/40 px-4 py-4">
                          <div>
                            <p className="text-base font-semibold leading-tight">{displayName}</p>
                            <p className="mt-1 text-xs text-muted">{displayPhone}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 text-ink/70 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
                              className="block px-4 py-2.5 text-sm text-ink transition hover:bg-sand/45"
                            >
                              {entry.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  aria-label="Войти"
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-ink/10 bg-white px-3 text-ink shadow-[0_10px_20px_rgba(43,39,34,0.06)] transition hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
        className="relative z-30 hidden border-b border-ink/10 bg-white/95 backdrop-blur lg:block"
        onMouseLeave={closeMegaWithDelay}
      >
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-2 overflow-x-auto py-3 text-sm scrollbar-hide">
            <li>
              <Link
                to="/category/popular"
                className="inline-flex items-center rounded-xl border border-ink/10 bg-white/90 px-3 py-2 transition hover:border-primary/45 hover:text-primary"
              >
                Лучшее
              </Link>
            </li>
            <li>
              <Link
                to="/category/new"
                className="inline-flex items-center rounded-xl border border-ink/10 bg-white/90 px-3 py-2 transition hover:border-primary/45 hover:text-primary"
              >
                Новинки
              </Link>
            </li>
            {navCategories.map((category) => {
              const token = resolveCategoryToken(category);
              const children = childrenByParent[String(category.id)] || [];
              const hasChildren = children.length > 0;
              const isActive = activeMegaCategory === token;

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
                          : 'border-ink/10 bg-white/90 text-ink hover:border-primary/45 hover:text-primary'
                      }`}
                      onClick={() => setActiveMegaCategory((prev) => (prev === token ? '' : token))}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setActiveMegaCategory('');
                      }}
                      aria-expanded={isActive}
                    >
                      <span>{category.name}</span>
                      <ChevronIcon className="h-4 w-4" isOpen={isActive} />
                    </button>
                  ) : (
                    <Link
                      to={`/category/${token}`}
                      className="inline-flex items-center rounded-xl border border-ink/10 bg-white/90 px-3 py-2 transition hover:border-primary/45 hover:text-primary"
                    >
                      {category.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {activeMegaCategoryData && megaChildren.length > 0 && (
            <div className="pb-4" onMouseEnter={() => openMega(activeMegaCategory)}>
              <div className="rounded-[24px] border border-ink/10 bg-white p-5 shadow-[0_20px_48px_rgba(43,39,34,0.14)]">
                <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{activeMegaCategoryData.name}</p>
                  <Link
                    to={`/category/${resolveCategoryToken(activeMegaCategoryData)}`}
                    className="text-sm text-primary"
                  >
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
                              className="block rounded-xl px-2 py-1.5 text-sm text-muted transition hover:bg-secondary/40 hover:text-primary"
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
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-black/40 lg:hidden"
            onClick={() => {
              setIsMenuOpen(false);
              setMobilePath([]);
            }}
            aria-label="Закрыть меню"
          />

          <aside className="fixed inset-y-0 left-0 z-[80] flex w-[min(88vw,360px)] flex-col border-r border-ink/10 bg-white/98 shadow-[0_24px_60px_rgba(43,39,34,0.25)] lg:hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-ink/10 px-4 pb-4 pt-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Навигация</p>
                <p className="mt-1 text-sm font-semibold">{mobileTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                {mobilePath.length > 0 && (
                  <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-2xl border border-ink/10 px-3 text-xs text-ink hover:border-primary/35 hover:text-primary"
                    onClick={() => setMobilePath((prev) => prev.slice(0, -1))}
                  >
                    ← Назад
                  </button>
                )}
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 text-ink hover:border-primary/35 hover:text-primary"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setMobilePath([]);
                  }}
                  aria-label="Закрыть меню"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="border-b border-ink/10 px-4 py-4">
              <form onSubmit={handleMobileDrawerSearchSubmit} className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleMobileDrawerSearchInput}
                  onFocus={() => {
                    setIsSearchOpen(false);
                    setIsSearchFocused(false);
                  }}
                  placeholder="Поиск по каталогу"
                  className="w-full rounded-2xl border border-ink/10 bg-white py-2.5 pl-10 pr-3 text-sm"
                  aria-label="Поиск по каталогу"
                />
              </form>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/catalog"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setMobilePath([]);
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ink/10 bg-white text-sm font-medium text-ink"
                >
                  Каталог
                </Link>
                <Link
                  to="/category/popular"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setMobilePath([]);
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ink/10 bg-white text-sm font-medium text-ink"
                >
                  Лучшее
                </Link>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {activeMobileParent && (
                <Link
                  to={`/category/${resolveCategoryToken(activeMobileParent)}`}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setMobilePath([]);
                  }}
                  className="mb-3 inline-flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                >
                  <span>Смотреть всё: {activeMobileParent.name}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              )}

              <ul className="space-y-1.5">
                {mobileCategories.map((category) => {
                  const token = resolveCategoryToken(category);
                  const nested = childrenByParent[String(category.id)] || [];
                  const hasNested = nested.length > 0;

                  if (hasNested) {
                    return (
                      <li key={token}>
                        <button
                          type="button"
                          className="grid min-h-[44px] w-full grid-cols-[minmax(0,1fr)_auto] items-center rounded-2xl border border-ink/10 bg-white px-3 py-2 text-left text-sm text-ink"
                          onClick={() => setMobilePath((prev) => [...prev, token])}
                        >
                          <span>{category.name}</span>
                          <span className="text-ink/45" aria-hidden="true">›</span>
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={token}>
                      <Link
                        to={`/category/${token}`}
                        className="grid min-h-[44px] w-full grid-cols-[minmax(0,1fr)_auto] items-center rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setMobilePath([]);
                        }}
                      >
                        <span>{category.name}</span>
                        <span className="text-ink/45" aria-hidden="true">→</span>
                      </Link>
                    </li>
                  );
                })}

                {mobileCategories.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-ink/20 bg-white px-3 py-3 text-sm text-muted">
                    Категории появятся после заполнения каталога.
                  </li>
                )}
              </ul>
            </div>
          </aside>
        </>
      )}

      <div
        className={`fixed left-1/2 z-[95] w-[min(94vw,390px)] -translate-x-1/2 transition-all duration-200 sm:left-auto sm:right-4 sm:translate-x-0 ${
          lastAddedItem
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-4 opacity-0'
        }`}
        style={{ top: 'calc(var(--site-header-height, 6.5rem) + 0.75rem)' }}
      >
        <div className="rounded-[22px] border border-ink/10 bg-white p-4 shadow-[0_22px_48px_rgba(43,39,34,0.22)]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Добавлено в корзину</p>
              <p className="text-sm font-semibold text-ink">{lastAddedItem?.name || 'Товар'}</p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-ink/55 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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

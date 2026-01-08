import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../api';
import { CartContext } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { items } = useContext(CartContext);
  const [categories, setCategories] = useState([]);
  const { isAuthenticated, logout, tokenParsed } = useAuth();
  const isCartBouncing = useRef(false);
  const headerRef = useRef(null);
  const accountMenuRef = useRef(null);
  const displayName = useMemo(() => {
    if (!tokenParsed) return 'Мой аккаунт';
    const nameParts = [tokenParsed.given_name, tokenParsed.family_name].filter(Boolean);
    if (nameParts.length) return nameParts.join(' ');
    return tokenParsed.name || tokenParsed.preferred_username || 'Мой аккаунт';
  }, [tokenParsed]);
  const displayPhone = useMemo(
    () =>
      tokenParsed?.phone_number ||
      tokenParsed?.phone ||
      tokenParsed?.phoneNumber ||
      'Добавьте телефон',
    [tokenParsed]
  );

  // Load categories for navigation menu
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  const navCategories = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list
      .filter((cat) => !cat.parentId)
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.name || '').localeCompare(b.name || ''));
  }, [categories]);

  const updateHeaderHeight = useCallback(() => {
    if (typeof window === 'undefined') return;
    const headerEl = headerRef.current;
    if (!headerEl) return;
    const height = Math.ceil(headerEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--site-header-height', `${height}px`);
  }, []);

  useEffect(() => {
    updateHeaderHeight();
  }, [isMenuOpen, navCategories.length, updateHeaderHeight]);

  // Close the mobile navigation when the viewport becomes desktop-sized
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth >= 768) setIsMenuOpen(false);
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
    if (!isAccountMenuOpen || typeof document === 'undefined') return undefined;
    const handlePointerDown = (event) => {
      if (!accountMenuRef.current || accountMenuRef.current.contains(event.target)) return;
      setIsAccountMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isAccountMenuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      // Navigate to search results page
      navigate(`/category/search?query=${encodeURIComponent(query)}`);
      setSearchTerm('');  // clear search input after navigating
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    if (typeof window === 'undefined') {
      logout();
      return;
    }
    setIsAccountMenuOpen(false);
    logout({ redirectUri: window.location.origin });
    navigate('/');
  };

  const handleAccountNav = () => {
    setIsMenuOpen(false);
    setIsAccountMenuOpen(false);
  };

  const handleAccountTrigger = (event) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      event.preventDefault();
      setIsMenuOpen(false);
      setIsAccountMenuOpen((prev) => !prev);
      return;
    }
    setIsAccountMenuOpen(false);
  };

  // Total items count in cart (for badge display)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-30">
      <div className="bg-white/80 backdrop-blur border-b border-ink/10">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-muted">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-white/80 px-3 py-1 border border-ink/5">
              🚚 Бесплатная доставка от 5000 ₽
            </span>
            <span className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-white/80 px-3 py-1 border border-ink/5">
              ↺ 365 дней на возврат
            </span>
            <span className="hidden md:inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-white/80 px-3 py-1 border border-ink/5">
              ⭐ 150k+ отзывов на 5 звёзд
            </span>
          </div>
          <Link to="/info/delivery" className="hidden sm:inline-flex button-ghost text-xs">
            Помощь
          </Link>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur border-b border-ink/10 shadow-sm">
        <div className="container mx-auto px-4 flex flex-col gap-3 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <div className="flex items-center gap-3 md:justify-self-start">
              <button
                type="button"
                className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-full border border-ink/10 bg-white/80 hover:border-primary text-lg"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Открыть меню"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
              <Link
                to="/"
                className="font-display text-lg sm:text-2xl font-semibold text-ink hover:text-primary whitespace-nowrap"
              >
                Постельное Белье-Юг
              </Link>
            </div>
            <form
              onSubmit={handleSearch}
              className="relative hidden md:block w-full md:justify-self-center md:w-[min(720px,100%)]"
            >
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск мягкого текстиля, комплектов и подарков"
                className="pl-12 pr-4 py-3 border border-ink/10 rounded-full w-full bg-white/90 shadow-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center text-ink/60"
                aria-label="Искать"
              >
                <span className="text-base leading-none">🔍</span>
              </button>
            </form>
            <div className="flex items-center gap-3 text-sm md:justify-self-end">
              <Link
                to="/cart"
                aria-label="Корзина"
                className={`relative inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-ink hover:border-primary/40 transition ${isCartBouncing.current ? 'animate-bounce' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-lg">🛍</span>
                <span className="hidden sm:inline">Корзина</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[11px] rounded-full px-1.5">
                    {totalItems}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <div ref={accountMenuRef} className="relative group">
                  <Link
                    to="/account"
                    aria-label="Личный кабинет"
                    className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-2.5 py-1.5 text-ink hover:border-primary/40 transition"
                    onClick={handleAccountTrigger}
                    aria-expanded={isAccountMenuOpen}
                  >
                    <span className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-secondary text-ink">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
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
                    </span>
                    <span className="hidden sm:inline text-sm font-medium">Мой кабинет</span>
                  </Link>
                  <div
                    className={`absolute right-0 top-full mt-3 w-72 transition-all duration-200 ${
                      isAccountMenuOpen
                        ? 'translate-y-0 opacity-100 pointer-events-auto'
                        : 'translate-y-2 opacity-0 pointer-events-none'
                    } group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto`}
                  >
                    <div className="rounded-3xl border border-ink/10 bg-white/95 shadow-[0_24px_50px_rgba(44,38,34,0.16)] overflow-hidden">
                      <div className="flex items-start justify-between gap-3 px-4 py-4 border-b border-ink/10">
                        <div>
                          <p className="text-base font-semibold leading-tight">{displayName}</p>
                          <p className="text-xs text-muted mt-1">{displayPhone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-ink/10 text-ink/70 hover:text-primary hover:border-primary/40 transition"
                          aria-label="Выйти"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <path d="M10 17l5-5-5-5" />
                            <path d="M15 12H3" />
                          </svg>
                        </button>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/account#profile"
                          onClick={handleAccountNav}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-ink hover:bg-secondary/70 transition"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-ink/60 group-hover:text-primary transition-colors"
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
                          <span className="text-sm font-medium">Профиль</span>
                        </Link>
                        <Link
                          to="/account#bonuses"
                          onClick={handleAccountNav}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-ink hover:bg-secondary/70 transition"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-ink/60 group-hover:text-primary transition-colors"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M8 14l-1 7 5-3 5 3-1-7" />
                          </svg>
                          <span className="text-sm font-medium">Уютные бонусы</span>
                        </Link>
                        <Link
                          to="/account#promocodes"
                          onClick={handleAccountNav}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-ink hover:bg-secondary/70 transition"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-ink/60 group-hover:text-primary transition-colors"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M5 7h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9a2 2 0 0 1 2-2z" />
                            <path d="M10 7v10" />
                            <path d="M14 10h2" />
                          </svg>
                          <span className="text-sm font-medium">Мои промокоды</span>
                        </Link>
                        <Link
                          to="/account#referral"
                          onClick={handleAccountNav}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-ink hover:bg-secondary/70 transition"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-ink/60 group-hover:text-primary transition-colors"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="9" cy="8" r="3" />
                            <circle cx="17" cy="9" r="2.5" />
                            <path d="M3 20a6 6 0 0 1 12 0" />
                            <path d="M14 20a4 4 0 0 1 7 0" />
                          </svg>
                          <span className="text-sm font-medium">Приведи друга</span>
                        </Link>
                        <Link
                          to="/account#orders"
                          onClick={handleAccountNav}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-ink hover:bg-secondary/70 transition"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-ink/60 group-hover:text-primary transition-colors"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M6 7h12l-1 12H7L6 7z" />
                            <path d="M9 7V6a3 3 0 0 1 6 0v1" />
                          </svg>
                          <span className="text-sm font-medium">Мои заказы</span>
                        </Link>
                        <Link
                          to="/account#purchases"
                          onClick={handleAccountNav}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-ink hover:bg-secondary/70 transition"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-ink/60 group-hover:text-primary transition-colors"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
                            <path d="M3 7l9 4 9-4" />
                            <path d="M12 11v10" />
                          </svg>
                          <span className="text-sm font-medium">Купленные товары</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  aria-label="Личный кабинет"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-ink hover:border-primary/40 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-lg">👤</span>
                  <span className="hidden sm:inline">Войти</span>
                </Link>
              )}
            </div>
          </div>
          <form onSubmit={handleSearch} className="relative md:hidden">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск товаров..."
              className="pl-12 pr-4 py-3 border border-ink/10 rounded-full w-full bg-white/90 shadow-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center text-ink/60"
              aria-label="Искать"
            >
              <span className="text-base leading-none">🔍</span>
            </button>
          </form>
        </div>
      </div>

      <nav className={`bg-white/80 border-b border-ink/10 ${isMenuOpen ? 'block' : 'hidden'} md:block`}>
        <div className="container mx-auto px-4">
          <ul className="flex md:flex-wrap items-center gap-2 py-2 sm:py-3 text-sm overflow-x-auto md:overflow-visible scrollbar-hide">
            <li className="flex-shrink-0">
              <Link
                to="/category/popular"
                className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1.5 hover:text-primary hover:border-primary/40 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Лучшее
              </Link>
            </li>
            {navCategories.map((cat) => (
              <li key={cat.slug || cat.id} className="flex-shrink-0">
                <Link
                  to={`/category/${cat.slug || cat.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1.5 hover:text-primary hover:border-primary/40 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            {navCategories.length === 0 && (
              <li className="text-muted">Категории появятся после добавления в админке.</li>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Header;

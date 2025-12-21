import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../api';
import { CartContext } from '../contexts/CartContext';
import { notifyAuthChange, subscribeToAuthChanges } from '../utils/auth';

function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { items } = useContext(CartContext);
  const [categories, setCategories] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('userToken'));
  });
  const isCartBouncing = useRef(false);

  // Load categories for navigation menu
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(() => {
      setIsLoggedIn(Boolean(localStorage.getItem('userToken')));
    });
    return unsubscribe;
  }, []);

  // Close the mobile navigation when the viewport becomes desktop-sized
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    localStorage.removeItem('userToken');
    notifyAuthChange({ type: 'user', action: 'logout' });
    navigate('/');
  };

  // Total items count in cart (for badge display)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur shadow z-20">
      {/* Top bar: logo, icons, and search (desktop) */}
      <div className="container mx-auto px-4 flex flex-col gap-2 py-2">
        <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[1fr,minmax(360px,720px),1fr] md:items-center">
          <div className="flex items-center gap-3 md:justify-self-start">
            <button
              type="button"
              className="md:hidden w-10 h-10 inline-flex items-center justify-center rounded-full border border-gray-200 hover:border-primary text-lg"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Открыть меню"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
            <Link to="/" className="text-xl sm:text-2xl font-bold text-primary hover:text-accent whitespace-nowrap">
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
              placeholder="Поиск товаров..." 
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-full w-full shadow-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" 
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              🔍
            </button>
          </form>
          {/* Icons: cart and user account */}
          <div className="flex items-center gap-3 text-xl md:justify-self-end">
            <Link 
              to="/cart" 
              aria-label="Корзина" 
              className={`relative hover:scale-110 active:scale-90 transition-transform ${isCartBouncing.current ? 'animate-bounce' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              🛒
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-white text-xs rounded-full px-1">
                  {totalItems}
                </span>
              )}
            </Link>
            {isLoggedIn ? (
              <button 
                onClick={handleLogout} 
                aria-label="Выйти" 
                className="text-sm hover:scale-110 active:scale-90 transition-transform"
              >
                Выйти
              </button>
            ) : (
              <Link 
                to="/login" 
                aria-label="Личный кабинет" 
                className="hover:scale-110 active:scale-90 transition-transform"
                onClick={() => setIsMenuOpen(false)}
              >
                👤
              </Link>
            )}
          </div>
        </div>
        {/* Mobile search */}
        <form onSubmit={handleSearch} className="relative md:hidden">
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Поиск товаров..." 
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-full w-full shadow-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" 
          />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            🔍
          </button>
        </form>
      </div>
      {/* Secondary navigation: category menu */}
      <nav className={`bg-secondary border-t border-gray-200 ${isMenuOpen ? 'block' : 'hidden'} md:block`}>
        <div className="container mx-auto px-4">
          <ul className="flex md:flex-wrap items-center gap-3 py-3 text-sm overflow-x-auto md:overflow-visible scrollbar-hide">
            {categories.map((cat) => (
              <li key={cat.slug || cat.id} className="flex-shrink-0">
                <Link 
                  to={`/category/${cat.slug || cat.id}`} 
                  className="hover:text-primary px-2 py-1 inline-block rounded-full hover:bg-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="text-muted">Категории появятся после добавления в админке.</li>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Header;

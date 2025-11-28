import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../api';
import { CartContext } from '../contexts/CartContext';
import { notifyAuthChange, subscribeToAuthChanges } from '../utils/auth';

function Header() {
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      // Navigate to search results page
      navigate(`/category/search?query=${encodeURIComponent(query)}`);
      setSearchTerm('');  // clear search input after navigating
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
    <header className="fixed top-0 left-0 right-0 bg-white shadow z-10">
      {/* Top bar: logo, search, icons */}
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo and search */}
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-primary hover:text-accent">
            CozyHome
          </Link>
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Поиск товаров..." 
              className="pl-8 pr-3 py-1 border border-gray-300 rounded w-64" 
            />
            <button type="submit" className="absolute left-0 top-0 mt-1 ml-1 text-gray-500">
              🔍
            </button>
          </form>
        </div>
        {/* Icons: cart and user account */}
        <div className="flex items-center gap-4 text-xl">
          <Link 
            to="/cart" 
            aria-label="Корзина" 
            className={`relative hover:scale-110 active:scale-90 transition-transform ${isCartBouncing.current ? 'animate-bounce' : ''}`}
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
            >
              👤
            </Link>
          )}
        </div>
      </div>
      {/* Secondary navigation: category menu */}
      <nav className="bg-secondary border-t border-gray-200">
        <div className="container mx-auto px-4">
          <ul className="flex flex-wrap items-center gap-4 py-2 text-sm">
            {categories.map((cat) => (
              <li key={cat.slug || cat.id}>
                <Link 
                  to={`/category/${cat.slug || cat.id}`} 
                  className="hover:text-primary"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Header;

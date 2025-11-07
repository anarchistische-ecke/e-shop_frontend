import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../api';
import { CartContext } from '../contexts/CartContext';

function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { items } = useContext(CartContext);
  const [categories, setCategories] = useState([]);
  const isCartBouncing = useRef(false);

  // Load categories for navigation menu
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    window.location.href = '/';
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow z-10">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo and search omitted for brevity */}
        {/* Icons */}
        <div className="flex-none flex items-center gap-4 text-xl">
          <Link
            to="/cart"
            aria-label="Корзина"
            className={`relative transition-transform transform hover:scale-110 active:scale-90 ${isCartBouncing.current ? 'animate-bounce' : ''}`}
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-white text-xs rounded-full px-1">
                {totalItems}
              </span>
            )}
          </Link>
          {typeof window !== 'undefined' && localStorage.getItem('userToken') ? (
            <button 
              onClick={handleLogout} 
              aria-label="Выйти" 
              className="transition-transform transform hover:scale-110 active:scale-90 text-sm"
            >
              Выйти
            </button>
          ) : (
            <Link
              to="/login"
              aria-label="Личный кабинет"
              className="transition-transform transform hover:scale-110 active:scale-90"
            >
              👤
            </Link>
          )}
        </div>
      </div>
      {/* Supermenu with categories (omitted for brevity) */}
    </header>
  );
}

export default Header;
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../api';
import { CartContext } from '../contexts/CartContext';

/**
 * Header renders the fixed top navigation bar and supermenu for the
 * storefront.  It loads category data from the backend so that the
 * supermenu reflects the current catalogue taxonomy.  The cart
 * icon displays a badge with the total quantity of items and
 * bounces briefly whenever new items are added.
 */
function Header() {
  // Search term for the persistent search bar.
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Access cart context to display quantity and animate the cart icon
  const { items } = useContext(CartContext);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const prevCountRef = useRef(0);

  // Categories loaded from the API.  We assume a flat list of
  // top‑level categories; if a category has children or a
  // `subcategories` property it will be used to render a dropdown.
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  // Fetch categories once on mount
  useEffect(() => {
    getCategories()
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  // Build a lookup map for categories by slug to facilitate
  // retrieving potential children.
  const categoriesMap = React.useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.slug || cat.id] = cat;
    });
    return map;
  }, [categories]);

  // Trigger bounce animation when items count increases
  useEffect(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    if (count > prevCountRef.current) {
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 600);
    }
    prevCountRef.current = count;
  }, [items]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/category/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
    setSearchTerm('');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200">
      {/* Top bar with shop name, search bar and icons */}
      <div className="mx-auto max-w-screen-xl px-4 h-16 flex items-center justify-between">
        {/* Shop name */}
        <div className="flex-none">
          <Link to="/" className="font-bold text-xl md:text-2xl text-accent whitespace-nowrap">
            Постельное Белье‑Юг
          </Link>
        </div>
        {/* Search bar */}
        <div className="flex-1 flex justify-center">
          <form onSubmit={handleSearchSubmit} className="w-full max-w-lg">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-primary"
            />
          </form>
        </div>
        {/* Icons */}
        <div className="flex-none flex items-center gap-4 text-xl">
          <Link
            to="/cart"
            aria-label="Корзина"
            className={`relative transition-transform transform hover:scale-110 active:scale-90 ${isCartBouncing ? 'animate-bounce' : ''}`}
          >
            🛒
            {items.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-white text-xs rounded-full px-1">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Link>
          <Link
            to="/login"
            aria-label="Личный кабинет"
            className="transition-transform transform hover:scale-110 active:scale-90"
          >
            👤
          </Link>
        </div>
      </div>
      {/* Supermenu */}
      <nav
        className="border-t border-gray-200 bg-white relative"
        onMouseLeave={() => setActiveCategory(null)}
      >
        <div className="mx-auto max-w-screen-xl px-4 overflow-x-auto">
          <ul className="flex flex-nowrap items-center justify-center gap-6 text-sm">
            {categories.map((cat) => (
              <li
                key={cat.slug || cat.id}
                className="relative py-2"
                onMouseEnter={() => setActiveCategory(cat.slug || cat.id)}
              >
                <Link
                  to={`/category/${cat.slug || cat.id}`}
                  className={`hover:text-primary transition-colors ${activeCategory === (cat.slug || cat.id) ? 'text-primary' : ''}`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Dropdown of subcategories when available */}
        {activeCategory && categoriesMap[activeCategory] && (
          (() => {
            const subcats = categoriesMap[activeCategory].children || categoriesMap[activeCategory].subcategories;
            if (!subcats || subcats.length === 0) return null;
            return (
              <div className="absolute left-0 right-0 bg-white border-t border-gray-200 shadow-md py-4 z-50">
                <div className="mx-auto max-w-screen-xl px-4 flex flex-wrap justify-center gap-4">
                  {subcats.map((sub) => (
                    <Link
                      key={typeof sub === 'object' ? sub.slug || sub.id : sub}
                      to={`/category/${activeCategory}`}
                      className="text-sm text-gray-700 hover:text-primary whitespace-nowrap"
                    >
                      {typeof sub === 'object' ? sub.name : sub}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()
        )}
      </nav>
    </header>
  );
}

export default Header;
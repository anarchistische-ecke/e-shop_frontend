import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories } from '../data/categories';
import { CartContext } from '../contexts/CartContext';

/**
 * The Header component renders a fixed top navigation bar with the store
 * name, a persistent search bar, navigation icons and a supermenu.  The
 * supermenu displays top‑level categories and reveals subcategories on
 * hover.  The cart icon shows a badge with the total quantity and
 * performs a bounce animation when items are added.  An admin icon
 * routes to the admin panel for managing products.  Unicode glyphs
 * represent the icons to avoid pulling in external icon libraries.
 */
function Header() {
  // Search term for the persistent search bar.  The bar is always visible
  // between the store name and the icons.
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Access cart context to display quantity and animate the cart icon
  const { items } = useContext(CartContext);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const prevCountRef = useRef(0);

  // Track which top‑level category is currently hovered to show a dropdown.
  // When hovering a category its subcategories are displayed in a dropdown
  // below the supermenu.
  const [activeCategory, setActiveCategory] = useState(null);

  // Create a lookup of categories by slug to easily access subcategories
  const categoriesMap = React.useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.slug] = cat;
    });
    return map;
  }, []);

  // Watch for cart count changes to trigger bounce animation
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
      // Redirect to a search results page.  For simplicity we reuse the
      // category page path and pass the term as a query string.
      navigate(`/category/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
    setSearchTerm('');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200">
      {/* Top bar with shop name, search bar and icons */}
      {/* Use mx-auto and max-w-screen-xl instead of the Tailwind container so that
         the header aligns exactly with the main page content. */}
      <div className="mx-auto max-w-screen-xl px-4 h-16 flex items-center justify-between">
        {/* Left: shop name */}
        <div className="flex-none">
          <Link to="/" className="font-bold text-xl md:text-2xl text-accent whitespace-nowrap">
            Постельное Белье‑Юг
          </Link>
        </div>
        {/* Center: search bar centered in available space */}
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
        {/* Right: icons aligned to the container edge */}
        <div className="flex-none flex items-center gap-4 text-xl">
          {/* Cart icon with badge and bounce animation */}
          <Link
            to="/cart"
            aria-label="Корзина"
            className={`relative transition-transform transform hover:scale-110 active:scale-90 ${isCartBouncing ? 'animate-bounce' : ''}`}
          >
            🛒
            {/* Badge for item count */}
            {items.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-white text-xs rounded-full px-1">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Link>
          {/* Account icon */}
          <Link
            to="/login"
            aria-label="Личный кабинет"
            className="transition-transform transform hover:scale-110 active:scale-90"
          >
            👤
          </Link>
        </div>
      </div>
      {/* Supermenu: a horizontal list of categories centered. On small screens it scrolls horizontally. */}
      <nav
        className="border-t border-gray-200 bg-white relative"
        onMouseLeave={() => setActiveCategory(null)}
      >
        <div className="mx-auto max-w-screen-xl px-4 overflow-x-auto">
          <ul className="flex flex-nowrap items-center justify-center gap-6 text-sm">
            {categories.map((cat) => (
              <li
                key={cat.slug}
                className="relative py-2"
                onMouseEnter={() => setActiveCategory(cat.slug)}
              >
                <Link
                  to={`/category/${cat.slug}`}
                  className={`hover:text-primary transition-colors ${activeCategory === cat.slug ? 'text-primary' : ''}`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Dropdown for subcategories */}
        {activeCategory && categoriesMap[activeCategory] && categoriesMap[activeCategory].subcategories && (
          <div className="absolute left-0 right-0 bg-white border-t border-gray-200 shadow-md py-4 z-50">
            <div className="mx-auto max-w-screen-xl px-4 flex flex-wrap justify-center gap-4">
              {categoriesMap[activeCategory].subcategories.map((sub) => (
                <Link
                  key={sub}
                  to={`/category/${activeCategory}`}
                  className="text-sm text-gray-700 hover:text-primary whitespace-nowrap"
                >
                  {sub}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
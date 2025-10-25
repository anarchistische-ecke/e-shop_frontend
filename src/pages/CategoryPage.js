import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { products } from '../data/products';
import { categories } from '../data/categories';
import ProductCard from '../components/ProductCard';

/**
 * CategoryPage renders a list of products filtered by top‑level
 * category or search query.  A simple sorting dropdown allows the
 * visitor to reorder items by popularity, price or discount.  The
 * search results route uses a pseudo‑category slug of "search" and
 * reads the query string to filter product names.
 */
function CategoryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const searchTerm = query.get('query') || '';
  const [sortKey, setSortKey] = useState('popular');

  // Determine the heading based on slug
  let heading = '';
  let filteredProducts = [];
  if (slug === 'search') {
    heading = `Результаты поиска: “${searchTerm}”`;
    const termLower = searchTerm.toLowerCase();
    filteredProducts = products.filter((p) => p.name.toLowerCase().includes(termLower));
  } else if (slug === 'popular') {
    heading = 'Популярные товары';
    filteredProducts = [...products].sort((a, b) => b.rating - a.rating);
  } else if (slug === 'new') {
    heading = 'Новинки';
    // For demonstration we treat last half of the list as new
    filteredProducts = products.slice(Math.floor(products.length / 2));
  } else if (slug === 'collections') {
    heading = 'Коллекции';
    filteredProducts = []; // no product list for collections
  } else {
    const category = categories.find((c) => c.slug === slug);
    heading = category ? category.name : 'Категория';
    filteredProducts = products.filter((p) => p.category === slug);
  }

  // Sorting logic
  const sortFunctions = {
    popular: (a, b) => b.rating - a.rating,
    cheap: (a, b) => a.price - b.price,
    expensive: (a, b) => b.price - a.price,
    discount: (a, b) => {
      const discA = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0;
      const discB = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0;
      return discB - discA;
    },
    newest: (a, b) => a.id.localeCompare(b.id),
  };
  const sortedProducts = [...filteredProducts].sort(sortFunctions[sortKey]);

  return (
    <div className="category-page py-8">
      <div className="container mx-auto px-4">
        <h1 className="mt-0 mb-4 text-2xl font-semibold">{heading}</h1>
        {/* Sorting */}
        {sortedProducts.length > 0 && (
          <div className="mb-4 flex items-center space-x-2">
            <label htmlFor="sort" className="whitespace-nowrap">
              Сортировать:
            </label>
            <select
              id="sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="p-1 border border-gray-300 rounded"
            >
              <option value="popular">Сначала популярные</option>
              <option value="newest">Сначала новые</option>
              <option value="cheap">Сначала дешёвые</option>
              <option value="expensive">Сначала дорогие</option>
              <option value="discount">По размеру скидки</option>
            </select>
          </div>
        )}
        {/* Product grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sortedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <p>Нет товаров в этой категории.</p>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;
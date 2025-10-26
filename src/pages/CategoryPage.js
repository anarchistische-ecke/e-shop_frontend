import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../api';

/**
 * CategoryPage displays products based on a category slug, special
 * pseudo‑categories (popular, new, collections) or search results.  It
 * fetches data from the backend on demand and supports client‑side
 * sorting of the retrieved list.  The page heading is derived from
 * either the slug or the matched category name.
 */
function CategoryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const searchTerm = query.get('query') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sortKey, setSortKey] = useState('popular');

  // Load category metadata once so we can derive names from slugs
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  // Fetch products whenever the slug or search term changes
  useEffect(() => {
    async function fetchData() {
      try {
        if (slug === 'search') {
          // For search we need all products then filter on the client
          const all = await getProducts();
          const termLower = searchTerm.toLowerCase();
          setProducts(
            all.filter((p) => (p.name || '').toLowerCase().includes(termLower))
          );
        } else if (slug === 'popular') {
          const all = await getProducts();
          // Sort by rating descending; if rating is absent default to 0
          setProducts(
            all.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          );
        } else if (slug === 'new') {
          const all = await getProducts();
          setProducts(all.slice(Math.floor(all.length / 2)));
        } else if (slug === 'collections') {
          // Collections page does not list products
          setProducts([]);
        } else {
          // Normal category listing
          const list = await getProducts({ category: slug });
          setProducts(list);
        }
      } catch (err) {
        console.error('Failed to fetch products for category:', err);
        setProducts([]);
      }
    }
    fetchData();
  }, [slug, searchTerm]);

  // Determine heading based on slug or category name
  let heading = '';
  if (slug === 'search') {
    heading = `Результаты поиска: “${searchTerm}”`;
  } else if (slug === 'popular') {
    heading = 'Популярные товары';
  } else if (slug === 'new') {
    heading = 'Новинки';
  } else if (slug === 'collections') {
    heading = 'Коллекции';
  } else {
    const cat = categories.find((c) => c.slug === slug || c.id === slug);
    heading = cat ? cat.name : 'Категория';
  }

  // Sorting functions available to the user
  const sortFunctions = {
    popular: (a, b) => (b.rating || 0) - (a.rating || 0),
    cheap: (a, b) => (a.price || 0) - (b.price || 0),
    expensive: (a, b) => (b.price || 0) - (a.price || 0),
    discount: (a, b) => {
      const discA = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0;
      const discB = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0;
      return discB - discA;
    },
    newest: (a, b) => {
      // As a fallback for "newest" sort by ID lexicographically
      return String(a.id).localeCompare(String(b.id));
    },
  };

  const sortedProducts = [...products].sort(sortFunctions[sortKey]);

  return (
    <div className="category-page py-8">
      <div className="container mx-auto px-4">
        <h1 className="mt-0 mb-4 text-2xl font-semibold">{heading}</h1>
        {/* Sorting dropdown */}
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
        {/* Product grid or empty state */}
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
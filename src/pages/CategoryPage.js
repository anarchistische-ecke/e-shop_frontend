import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../api';

/**
 * CategoryPage lists products based on the current category slug or
 * search query.  Sorting options allow the user to reorder the
 * results by popularity, price, discount size or recency.  This
 * implementation handles Money objects returned by the backend when
 * performing numerical comparisons.
 */
function CategoryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const searchTerm = query.get('query') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sortKey, setSortKey] = useState('popular');

  // Load category metadata once
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  // Load products when slug or search term changes
  useEffect(() => {
    async function fetchData() {
      try {
        if (slug === 'search') {
          const all = await getProducts();
          const termLower = searchTerm.toLowerCase();
          setProducts(
            all.filter((p) => (p.name || '').toLowerCase().includes(termLower))
          );
        } else if (slug === 'popular') {
          const all = await getProducts();
          setProducts(all.sort((a, b) => (b.rating || 0) - (a.rating || 0)));
        } else if (slug === 'new') {
          const all = await getProducts();
          setProducts(all.slice(Math.floor(all.length / 2)));
        } else if (slug === 'collections') {
          setProducts([]);
        } else {
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

  // Helper to extract a numeric price from a product
  const extractPrice = (prod) => {
    const price = prod.price;
    if (typeof price === 'object' && price !== null) {
      return price.amount / 100;
    }
    return price || 0;
  };
  const extractOldPrice = (prod) => {
    const op = prod.oldPrice;
    if (!op) return 0;
    if (typeof op === 'object' && op !== null) {
      return op.amount / 100;
    }
    return op;
  };

  // Sorting functions
  const sortFunctions = {
    popular: (a, b) => (b.rating || 0) - (a.rating || 0),
    cheap: (a, b) => extractPrice(a) - extractPrice(b),
    expensive: (a, b) => extractPrice(b) - extractPrice(a),
    discount: (a, b) => {
      const pa = extractPrice(a);
      const oa = extractOldPrice(a);
      const pb = extractPrice(b);
      const ob = extractOldPrice(b);
      const da = oa ? (oa - pa) / oa : 0;
      const db = ob ? (ob - pb) / ob : 0;
      return db - da;
    },
    newest: (a, b) => String(a.id).localeCompare(String(b.id)),
  };

  const sortedProducts = [...products].sort(sortFunctions[sortKey]);

  return (
    <div className="category-page py-8">
      <div className="container mx-auto px-4">
        <h1 className="mt-0 mb-4 text-2xl font-semibold">{heading}</h1>
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
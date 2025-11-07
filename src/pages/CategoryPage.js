import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories, getBrands } from '../api';

function CategoryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const searchTerm = query.get('query') || '';
  const brandFilter = query.get('brand') || '';

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [sortKey, setSortKey] = useState('popular');

  // Load category and brand metadata once
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
    getBrands()
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch brands:', err));
  }, []);

  // Load products whenever category slug, search term, or brand filter changes
  useEffect(() => {
    async function fetchData() {
      try {
        if (slug === 'search') {
          // Search across all products by name
          const all = await getProducts();
          const termLower = searchTerm.toLowerCase();
          setProducts(all.filter((p) => (p.name || '').toLowerCase().includes(termLower)));
        } else if (slug === 'popular') {
          const all = await getProducts();
          setProducts(all.sort((a, b) => (b.rating || 0) - (a.rating || 0)));
        } else if (slug === 'new') {
          const all = await getProducts();
          setProducts(all.slice(-8));  // example: last N products as "new"
        } else if (slug === 'collections') {
          // Collections page could show special grouped products; not implemented
          setProducts([]);
        } else {
          // Filter by category (and brand if applicable)
          const params = brandFilter ? { category: slug, brand: brandFilter } : { category: slug };
          const list = await getProducts(params);
          setProducts(list);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      }
    }
    fetchData();
  }, [slug, searchTerm, brandFilter]);

  // Determine page heading based on slug
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

  // Sorting helpers (extract numeric price values for comparisons)
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

  const sortFunctions = {
    popular: (a, b) => (b.rating || 0) - (a.rating || 0),
    newest: (a, b) => String(b.id).localeCompare(String(a.id)),  // newest first
    cheap: (a, b) => extractPrice(a) - extractPrice(b),
    expensive: (a, b) => extractPrice(b) - extractPrice(a),
    discount: (a, b) => {
      const da = extractOldPrice(a) ? (extractOldPrice(a) - extractPrice(a)) / extractOldPrice(a) : 0;
      const db = extractOldPrice(b) ? (extractOldPrice(b) - extractPrice(b)) / extractOldPrice(b) : 0;
      return db - da;
    }
  };

  const sortedProducts = [...products].sort(sortFunctions[sortKey]);

  // Handle brand filter change by updating URL query parameters
  const handleBrandFilterChange = (brandSlug) => {
    const params = new URLSearchParams(location.search);
    if (brandSlug) params.set('brand', brandSlug);
    else params.delete('brand');
    navigate(`/category/${slug}?${params.toString()}`);
  };

  return (
    <div className="category-page py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-6">{heading}</h1>
        {sortedProducts.length > 0 ? (
          <>
            {/* Filters and sorting controls */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Brand filter dropdown */}
              <div className="flex items-center">
                <label htmlFor="brandFilter" className="mr-2 text-sm">Бренд:</label>
                <select 
                  id="brandFilter" 
                  value={brandFilter} 
                  onChange={(e) => handleBrandFilterChange(e.target.value)} 
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">Все</option>
                  {brands.map((b) => (
                    <option key={b.slug || b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Sort dropdown */}
              <div className="flex items-center">
                <label htmlFor="sort" className="mr-2 text-sm">Сортировать:</label>
                <select
                  id="sort"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="popular">Сначала популярные</option>
                  <option value="newest">Сначала новые</option>
                  <option value="cheap">Сначала дешёвые</option>
                  <option value="expensive">Сначала дорогие</option>
                  <option value="discount">По размеру скидки</option>
                </select>
              </div>
            </div>
            {/* Product grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sortedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </>
        ) : (
          <p>Нет товаров{slug !== 'search' ? ' в этой категории.' : ' по данному запросу.'}</p>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;

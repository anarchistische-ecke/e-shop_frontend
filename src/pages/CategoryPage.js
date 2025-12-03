import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories, getBrands } from '../api';
import { getProductPrice, moneyToNumber } from '../utils/product';

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
  const activeBrand = brands.find((b) => (b.slug || b.id) === brandFilter);

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
          const list = Array.isArray(all) ? all : [];
          const termLower = searchTerm.toLowerCase();
          setProducts(list.filter((p) => (p.name || '').toLowerCase().includes(termLower)));
        } else if (slug === 'popular') {
          const all = await getProducts();
          const list = Array.isArray(all) ? all : [];
          setProducts(list.sort((a, b) => (b.rating || 0) - (a.rating || 0)));
        } else if (slug === 'new') {
          const all = await getProducts();
          const list = Array.isArray(all) ? all : [];
          setProducts(list.slice(-8));  // example: last N products as "new"
        } else if (slug === 'collections') {
          // Collections page could show special grouped products; not implemented
          setProducts([]);
        } else {
          // Filter by category (and brand if applicable)
          const params = brandFilter ? { category: slug, brand: brandFilter } : { category: slug };
          const list = await getProducts(params);
          setProducts(Array.isArray(list) ? list : []);
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
  const extractPrice = (prod) => getProductPrice(prod);
  const extractOldPrice = (prod) => (prod?.oldPrice ? moneyToNumber(prod.oldPrice) : 0);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h1 className="text-2xl font-semibold">{heading}</h1>
            <p className="text-sm text-muted">Подберите текстиль и декор по категориям или брендам.</p>
          </div>
          {activeBrand && (
            <button
              className="text-xs bg-secondary px-3 py-1 rounded-full border border-gray-200 self-start"
              onClick={() => handleBrandFilterChange('')}
            >
              Бренд: {activeBrand.name} ×
            </button>
          )}
        </div>
        {sortedProducts.length > 0 ? (
          <>
            <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shadow-sm">
              <div>
                <p className="text-sm font-semibold m-0">Найдено: {sortedProducts.length} товаров</p>
                <p className="text-xs text-muted m-0">Отфильтруйте по бренду и настройте сортировку.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="brandFilter" className="text-sm">Бренд:</label>
                  <select 
                    id="brandFilter" 
                    value={brandFilter} 
                    onChange={(e) => handleBrandFilterChange(e.target.value)} 
                    className="p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Все</option>
                    {brands.map((b) => (
                      <option key={b.slug || b.id} value={b.slug || b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="sort" className="text-sm">Сортировать:</label>
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
            </div>
            {/* Product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {sortedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
            <p className="text-base font-semibold mb-2">Нет товаров{slug !== 'search' ? ' в этой категории' : ' по запросу'}</p>
            <p className="text-sm text-muted mb-4">Попробуйте выбрать другой бренд или изменить запрос.</p>
            <div className="flex justify-center gap-2">
              <button className="button-gray" onClick={() => handleBrandFilterChange('')}>
                Сбросить фильтры
              </button>
              <button className="button" onClick={() => setSortKey('popular')}>
                Показать популярные
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;

import React from 'react';
import { products } from '../data/products';

/**
 * AdminDashboard provides a high‑level overview of store performance.
 * It displays summary cards for sales, orders and customers along with
 * simple charts and lists of top products.  Since this project
 * doesn't include a backend or real orders we compute some fake
 * metrics from the product data as a placeholder.  Replace these
 * calculations with your actual analytics when connecting to a
 * backend.
 */
function AdminDashboard() {
  // Fake metrics
  const totalProducts = products.length;
  const topProducts = products
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard & Analytics</h1>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Сегодняшние продажи</h3>
          <p className="text-2xl font-bold">0 ₽</p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Заказы (неделя)</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Средний чек</h3>
          <p className="text-2xl font-bold">0 ₽</p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Товары в каталоге</h3>
          <p className="text-2xl font-bold">{totalProducts}</p>
        </div>
      </div>
      {/* Top products */}
      <div className="bg-white border rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Топ‑продаваемые товары</h2>
          <ul className="space-y-2">
            {topProducts.map((p) => (
              <li key={p.id} className="flex justify-between items-center">
                <span>{p.name}</span>
                <span className="text-sm text-gray-500">рейтинг: {p.rating}</span>
              </li>
            ))}
          </ul>
        </div>
    </div>
  );
}

export default AdminDashboard;
import React, { useEffect, useState } from 'react';
import { getProducts, getOrders } from '../api';

/**
 * AdminDashboard provides a high‑level overview of store performance.
 * It displays summary cards for sales, orders and customers along with
 * simple charts and lists of top products.  In this production‑ready
 * version we fetch the product catalogue from the backend rather than
 * relying on static sample data.  Metrics such as the number of
 * products or top rated items are derived from the fetched list.
 */
function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch product catalogue
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch products:', err));
    // Fetch orders to derive sales metrics
    getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch orders:', err));
  }, []);

  // Derived metrics
  const totalProducts = products.length;
  const topProducts = [...products]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);
  // Compute total sales and average order value from orders
  let totalSales = 0;
  orders.forEach((o) => {
    const t = o.total;
    if (t) {
      if (typeof t === 'object') {
        if (t.amount !== undefined) {
          totalSales += t.amount / 100;
        } else if (t.totalAmount !== undefined) {
          totalSales += t.totalAmount / 100;
        }
      } else {
        totalSales += t;
      }
    }
  });
  const ordersCount = orders.length;
  const averageOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard &amp; Analytics</h1>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Всего продаж</h3>
          <p className="text-2xl font-bold">{totalSales.toLocaleString('ru-RU')} ₽</p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Количество заказов</h3>
          <p className="text-2xl font-bold">{ordersCount}</p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Средний чек</h3>
          <p className="text-2xl font-bold">{averageOrderValue.toLocaleString('ru-RU')} ₽</p>
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

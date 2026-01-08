import React, { useEffect, useState } from 'react';
import { getProducts, getOrders } from '../api';

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch products:', err));
    getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch orders:', err));
  }, []);

  const totalProducts = products.length;
  const topProducts = [...products]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);
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
  const statusBreakdown = orders.reduce(
    (acc, o) => ({ ...acc, [o.status || 'UNKNOWN']: (acc[o.status || 'UNKNOWN'] || 0) + 1 }),
    {}
  );
  const topCategories = products.reduce((map, p) => {
    const categoryLabels = Array.isArray(p.categories)
      ? p.categories.map((c) => c?.name || c?.slug || c?.id).filter(Boolean)
      : [];
    if (categoryLabels.length > 0) {
      categoryLabels.forEach((label) => {
        map[label] = (map[label] || 0) + 1;
      });
      return map;
    }
    const fallback = p.category || p.categoryRef;
    const key = fallback || 'Без категории';
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
  const topCategoryList = Object.entries(topCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const recentOrders = [...orders].slice(-5).reverse();

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
      {/* Status and navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Статус заказов</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {['PENDING', 'PAID', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map((status) => (
              <div key={status} className="p-3 rounded border border-gray-200 bg-secondary/60">
                <p className="text-muted text-xs mb-1">{status}</p>
                <p className="text-xl font-semibold">{statusBreakdown[status] || 0}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Быстрые действия</h2>
          <div className="flex flex-wrap gap-2">
            <a href="/admin/orders" className="button text-sm">Заказы</a>
            <a href="/admin/products" className="button text-sm">Каталог</a>
            <a href="/admin/promotions" className="button text-sm">Скидки</a>
            <a href="/admin/settings" className="button text-sm">Настройки</a>
          </div>
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
          {topProducts.length === 0 && <li className="text-sm text-muted">Нет данных</li>}
        </ul>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Популярные категории</h2>
          <ul className="space-y-2 text-sm">
            {topCategoryList.map(([name, count]) => (
              <li key={name} className="flex justify-between">
                <span>{name}</span>
                <span className="text-muted">{count} товаров</span>
              </li>
            ))}
            {topCategoryList.length === 0 && <li className="text-muted">Категории не найдены</li>}
          </ul>
        </div>
        <div className="bg-white border rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Недавние заказы</h2>
          <ul className="space-y-2 text-sm">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">#{o.id}</p>
                  <p className="text-xs text-muted">{o.createdAt || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {(o.total?.amount ? o.total.amount / 100 : o.total || 0).toLocaleString('ru-RU')} ₽
                  </p>
                  <p className="text-xs text-muted">{o.status}</p>
                </div>
              </li>
            ))}
            {recentOrders.length === 0 && <li className="text-muted">Заказов пока нет</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

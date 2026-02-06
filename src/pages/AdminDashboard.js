import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  const extractOrderTotal = (order) => {
    const value = order?.total;
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object') {
      if (value.amount !== undefined) return Number(value.amount) / 100;
      if (value.totalAmount !== undefined) return Number(value.totalAmount) / 100;
    }
    return 0;
  };

  const totalProducts = products.length;
  const topProducts = [...products]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);
  const totalSales = orders.reduce((sum, order) => sum + extractOrderTotal(order), 0);
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
  const statusCards = [
    { key: 'PENDING', label: 'Ожидают оплаты' },
    { key: 'PAID', label: 'Оплачены' },
    { key: 'PROCESSING', label: 'В обработке' },
    { key: 'DELIVERED', label: 'Доставлены' },
    { key: 'CANCELLED', label: 'Отменены' },
  ];
  const formatCurrency = (value) => `${Number(value || 0).toLocaleString('ru-RU')} ₽`;

  return (
    <div className="space-y-6">
      <section className="admin-panel admin-panel--hero">
        <div className="space-y-2">
          <p className="admin-chip">Оперативная сводка</p>
          <h1 className="text-2xl font-semibold md:text-3xl">Пульс магазина</h1>
          <p className="text-sm text-muted md:text-base">
            Следите за продажами, активностью клиентов и наполнением каталога в одном окне.
          </p>
        </div>
      </section>

      <section
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Ключевые показатели"
      >
        <article className="admin-kpi">
          <p className="admin-kpi__label">Выручка</p>
          <p className="admin-kpi__value">{formatCurrency(totalSales)}</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi__label">Заказы</p>
          <p className="admin-kpi__value">{ordersCount}</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi__label">Средний чек</p>
          <p className="admin-kpi__value">{formatCurrency(averageOrderValue)}</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi__label">Товары в каталоге</p>
          <p className="admin-kpi__value">{totalProducts}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="admin-panel xl:col-span-2">
          <h2 className="text-lg font-semibold">Статусы заказов</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {statusCards.map((status) => (
              <div key={status.key} className="admin-status-card">
                <p className="admin-status-card__label">{status.label}</p>
                <p className="admin-status-card__value">{statusBreakdown[status.key] || 0}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <h2 className="text-lg font-semibold">Быстрые действия</h2>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <Link to="/admin/orders" className="button">
              Перейти к заказам
            </Link>
            <Link to="/admin/products" className="button-gray">
              Управление каталогом
            </Link>
            <Link to="/admin/promotions" className="button-gray">
              Купоны и скидки
            </Link>
            <Link to="/admin/settings" className="button-gray">
              Настройки магазина
            </Link>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="admin-panel">
          <h2 className="text-lg font-semibold">Топ‑товары</h2>
          <ul className="mt-4 space-y-2">
            {topProducts.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white/75 px-3 py-2 text-sm"
              >
                <span className="font-medium">{product.name}</span>
                <span className="text-xs text-muted">Рейтинг {product.rating || 0}</span>
              </li>
            ))}
            {topProducts.length === 0 && (
              <li className="rounded-xl border border-dashed border-ink/20 px-3 py-4 text-sm text-muted">
                Пока нет данных о популярных товарах.
              </li>
            )}
          </ul>
        </article>

        <article className="admin-panel">
          <h2 className="text-lg font-semibold">Популярные категории</h2>
          <ul className="mt-4 space-y-2">
            {topCategoryList.map(([name, count]) => (
              <li
                key={name}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white/75 px-3 py-2 text-sm"
              >
                <span>{name}</span>
                <span className="text-xs text-muted">{count} товаров</span>
              </li>
            ))}
            {topCategoryList.length === 0 && (
              <li className="rounded-xl border border-dashed border-ink/20 px-3 py-4 text-sm text-muted">
                Категории пока не определены.
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className="admin-panel">
        <h2 className="text-lg font-semibold">Последние заказы</h2>
        <ul className="mt-4 space-y-2">
          {recentOrders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white/75 px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold">#{order.id}</p>
                <p className="text-xs text-muted">{order.createdAt || 'Дата неизвестна'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrency(extractOrderTotal(order))}</p>
                <p className="text-xs text-muted">{order.status || 'UNKNOWN'}</p>
              </div>
            </li>
          ))}
          {recentOrders.length === 0 && (
            <li className="rounded-xl border border-dashed border-ink/20 px-3 py-4 text-sm text-muted">
              Заказов пока нет.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

export default AdminDashboard;

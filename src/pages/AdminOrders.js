import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, getCustomers } from '../api';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [filter, setFilter] = useState('Все');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch orders:', err));
    getCustomers()
      .then((data) => {
        if (Array.isArray(data)) {
          const map = {};
          data.forEach((c) => {
            map[c.id] = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || c.id;
          });
          setCustomers(map);
        }
      })
      .catch((err) => console.error('Failed to fetch customers:', err));
  }, []);

  // Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const filteredOrders = orders.filter((o) => (filter === 'Все' ? true : o.status === filter));
  const visibleOrders = filteredOrders.filter(
    (o) =>
      (o.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (customers[o.customerId] || '').toLowerCase().includes(search.toLowerCase())
  );

  // Helper to extract numeric total from order.total
  const extractTotal = (order) => {
    const total = order.total;
    if (typeof total === 'object' && total !== null) {
      // Some controllers return { totalAmount: number }, others a Money object
      if (total.amount !== undefined) {
        return total.amount / 100;
      }
      if (total.totalAmount !== undefined) {
        return total.totalAmount / 100;
      }
    }
    return total || 0;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Заказы</h1>
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded text-sm"
        >
          {['Все', 'PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map((status) => (
            <option key={status} value={status}>
              {status === 'PENDING'
                ? 'Новый'
                : status === 'PROCESSING'
                ? 'В обработке'
                : status === 'DELIVERED'
                ? 'Доставлен'
                : status === 'CANCELLED'
                ? 'Отменён'
                : status}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по ID или клиенту"
          className="p-2 border border-gray-300 rounded flex-1 min-w-[200px] text-sm"
        />
        <div className="text-sm text-muted">Показано: {visibleOrders.length}</div>
      </div>
      <div className="md:hidden space-y-3">
        {visibleOrders.map((order) => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted">Заказ</div>
                <div className="font-semibold">#{order.id}</div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  order.status === 'DELIVERED'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'PROCESSING'
                    ? 'bg-amber-100 text-amber-800'
                    : order.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {order.status}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-muted text-xs block">Клиент</span>
                <span>{customers[order.customerId] || order.customerId}</span>
              </div>
              <div>
                <span className="text-muted text-xs block">Сумма</span>
                <span>{extractTotal(order).toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className="p-2 border border-gray-300 rounded text-xs"
              >
                {['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                className="text-xs text-primary underline"
                onClick={() => setExpandedId((prev) => (prev === order.id ? null : order.id))}
              >
                {expandedId === order.id ? 'Скрыть' : 'Подробнее'}
              </button>
            </div>
            {expandedId === order.id && (
              <div className="bg-secondary border border-gray-200 rounded p-2 text-xs mt-1 space-y-1">
                <div>Создан: {order.createdAt || '—'}</div>
                <div>Позиций: {Array.isArray(order.items) ? order.items.length : '—'}</div>
                {Array.isArray(order.items) && order.items.length > 0 && (
                  <ul className="list-disc pl-4">
                    {order.items.slice(0, 5).map((item, idx) => (
                      <li key={idx}>
                        {item.productName || item.productId} × {item.quantity} —{' '}
                        {(item.totalPrice?.amount
                          ? item.totalPrice.amount / 100
                          : item.totalPrice || 0
                        ).toLocaleString('ru-RU')}{' '}
                        ₽
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
        {visibleOrders.length === 0 && (
          <div className="text-sm text-muted text-center">Заказы не найдены</div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 align-top">
          <thead className="bg-secondary">
            <tr>
              <th className="p-2 border-b">ID</th>
              <th className="p-2 border-b">Клиент</th>
              <th className="p-2 border-b">Сумма</th>
              <th className="p-2 border-b">Статус</th>
              <th className="p-2 border-b">Действия</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="p-2">{order.id}</td>
                <td className="p-2">{customers[order.customerId] || order.customerId}</td>
                <td className="p-2">
                  {extractTotal(order).toLocaleString('ru-RU')} ₽
                </td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'DELIVERED'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'PROCESSING'
                        ? 'bg-amber-100 text-amber-800'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="p-2 space-y-1">
                  <div className="flex gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="p-1 border border-gray-300 rounded text-xs"
                    >
                      {['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      className="text-xs text-primary underline"
                      onClick={() => setExpandedId((prev) => (prev === order.id ? null : order.id))}
                    >
                      {expandedId === order.id ? 'Скрыть' : 'Подробнее'}
                    </button>
                  </div>
                  {expandedId === order.id && (
                    <div className="bg-secondary border border-gray-200 rounded p-2 text-xs mt-1 space-y-1">
                      <div>Создан: {order.createdAt || '—'}</div>
                      <div>Позиций: {Array.isArray(order.items) ? order.items.length : '—'}</div>
                      {Array.isArray(order.items) && order.items.length > 0 && (
                        <ul className="list-disc pl-4">
                          {order.items.slice(0, 5).map((item, idx) => (
                            <li key={idx}>
                              {item.productName || item.productId} × {item.quantity} —{' '}
                              {(item.totalPrice?.amount
                                ? item.totalPrice.amount / 100
                                : item.totalPrice || 0
                              ).toLocaleString('ru-RU')}{' '}
                              ₽
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminOrders;

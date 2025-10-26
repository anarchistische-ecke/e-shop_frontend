import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, getCustomers } from '../api';

/**
 * AdminOrders displays a list of all orders retrieved from the backend.
 * Administrators can filter by status and update an order's status
 * directly in the table.  Customer names are resolved by fetching
 * customer metadata on mount.
 */
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [filter, setFilter] = useState('Все');

  // Fetch orders and customers once when the component mounts
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

  // Handle status update
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  // Apply status filter
  const filteredOrders = orders.filter((o) =>
    filter === 'Все' ? true : o.status === filter
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Заказы</h1>
      <div className="flex items-center gap-4">
        <label htmlFor="filter" className="text-sm text-gray-700">
          Фильтр:
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded"
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
      </div>
      <table className="w-full text-sm border border-gray-200">
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
          {filteredOrders.map((order) => (
            <tr key={order.id} className="border-b">
              <td className="p-2">{order.id}</td>
              <td className="p-2">{customers[order.customerId] || order.customerId}</td>
              <td className="p-2">
                {/* Convert Money object or numeric total to currency string */}
                {typeof order.total === 'object'
                  ? (order.total.amount / 100).toLocaleString('ru-RU')
                  : (order.total || 0).toLocaleString('ru-RU')}{' '}
                ₽
              </td>
              <td className="p-2">{order.status}</td>
              <td className="p-2">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className="p-1 border border-gray-300 rounded"
                >
                  {['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminOrders;
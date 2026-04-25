import React, { useEffect, useMemo, useState } from 'react';
import { getOrders, updateOrderStatus, getCustomers } from '../api';
import { moneyToNumber } from '../utils/product';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [filter, setFilter] = useState('Все');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const statusLabels = {
    PENDING: 'Ожидает оплаты',
    PAID: 'Оплачен',
    PROCESSING: 'В обработке',
    SHIPPED: 'Отгружен',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён',
    REFUNDED: 'Возврат'
  };

  const formatStatus = (status) => {
    if (!status) return '—';
    return statusLabels[status] || status;
  };

  const extractTotal = (order) => moneyToNumber(order?.totalAmount || order?.total || 0);

  const getCustomerLabel = (order) => {
    if (order?.contactName) return order.contactName;
    return customers[order?.customerId] || order?.customerId || '—';
  };

  const getContactSummary = (order) => {
    const parts = [
      order?.contactPhone,
      order?.receiptEmail
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Контакты не указаны';
  };

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch orders:', err));
    getCustomers()
      .then((data) => {
        if (Array.isArray(data)) {
          const map = {};
          data.forEach((customer) => {
            map[customer.id] = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || customer.id;
          });
          setCustomers(map);
        }
      })
      .catch((err) => console.error('Failed to fetch customers:', err));
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)));
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const orderSummary = useMemo(() => {
    const paid = orders.filter((order) => order.status === 'PAID').length;
    const pending = orders.filter((order) => order.status === 'PENDING').length;
    const withAddress = orders.filter((order) => order.homeAddress).length;
    return {
      total: orders.length,
      paid,
      pending,
      withAddress
    };
  }, [orders]);

  const filteredOrders = orders.filter((order) => filter === 'Все' || order.status === filter);

  const visibleOrders = filteredOrders.filter((order) => {
    const source = [
      order.id,
      getCustomerLabel(order),
      order.receiptEmail,
      order.contactPhone,
      order.homeAddress
    ].join(' ').toLowerCase();
    return source.includes(search.toLowerCase());
  });

  const statusOptions = ['Все', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Заказы</h1>
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <label htmlFor="admin-order-status-filter" className="sr-only">
          Фильтр по статусу заказа
        </label>
        <select
          id="admin-order-status-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="p-2 border border-gray-300 rounded text-sm"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === 'Все' ? status : formatStatus(status)}
            </option>
          ))}
        </select>
        <label htmlFor="admin-order-search" className="sr-only">
          Поиск заказов
        </label>
        <input
          id="admin-order-search"
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по ID, клиенту, телефону, email или адресу"
          className="p-2 border border-gray-300 rounded flex-1 min-w-[240px] text-sm"
        />
        <div className="text-sm text-muted">Показано: {visibleOrders.length}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-muted">Всего заказов</div>
          <div className="text-lg font-semibold">{orderSummary.total}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-muted">Ожидают оплаты</div>
          <div className="text-lg font-semibold">{orderSummary.pending}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-muted">Оплачены</div>
          <div className="text-lg font-semibold">{orderSummary.paid}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-muted">С адресом</div>
          <div className="text-lg font-semibold">{orderSummary.withAddress}</div>
        </div>
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
                    : order.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.status === 'PROCESSING' || order.status === 'SHIPPED'
                    ? 'bg-amber-100 text-amber-800'
                    : order.status === 'CANCELLED' || order.status === 'REFUNDED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {formatStatus(order.status)}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-muted text-xs block">Клиент</span>
                <span>{getCustomerLabel(order)}</span>
              </div>
              <div>
                <span className="text-muted text-xs block">Контакты</span>
                <span>{getContactSummary(order)}</span>
              </div>
              <div>
                <span className="text-muted text-xs block">Адрес</span>
                <span>{order.homeAddress || 'Адрес не указан'}</span>
              </div>
              <div>
                <span className="text-muted text-xs block">Сумма товаров</span>
                <span>{extractTotal(order).toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={order.status}
                onChange={(event) => handleStatusChange(order.id, event.target.value)}
                aria-label={`Статус заказа ${order.id}`}
                className="p-2 border border-gray-300 rounded text-xs"
              >
                {statusOptions.filter((status) => status !== 'Все').map((status) => (
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
              {order.publicToken && (
                <a
                  href={`/order/${order.publicToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  Ссылка клиента
                </a>
              )}
            </div>
            {expandedId === order.id && <OrderDetails order={order} />}
          </div>
        ))}
        {visibleOrders.length === 0 && (
          <div className="text-sm text-muted text-center">Заказы не найдены</div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 align-top">
          <caption className="sr-only">
            Список заказов с клиентом, контактами, адресом, суммой, статусом и действиями
          </caption>
          <thead className="bg-secondary">
            <tr>
              <th scope="col" className="p-2 border-b">ID</th>
              <th scope="col" className="p-2 border-b">Клиент</th>
              <th scope="col" className="p-2 border-b">Контакты</th>
              <th scope="col" className="p-2 border-b">Адрес</th>
              <th scope="col" className="p-2 border-b">Сумма</th>
              <th scope="col" className="p-2 border-b">Статус</th>
              <th scope="col" className="p-2 border-b">Действия</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="p-2">{order.id}</td>
                <td className="p-2">{getCustomerLabel(order)}</td>
                <td className="p-2">{getContactSummary(order)}</td>
                <td className="p-2 max-w-[280px]">{order.homeAddress || '—'}</td>
                <td className="p-2">
                  {extractTotal(order).toLocaleString('ru-RU')} ₽
                </td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'DELIVERED'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'PROCESSING' || order.status === 'SHIPPED'
                        ? 'bg-amber-100 text-amber-800'
                        : order.status === 'CANCELLED' || order.status === 'REFUNDED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {formatStatus(order.status)}
                  </span>
                </td>
                <td className="p-2 space-y-1">
                  <div className="flex gap-2">
                    <select
                      value={order.status}
                      onChange={(event) => handleStatusChange(order.id, event.target.value)}
                      aria-label={`Статус заказа ${order.id}`}
                      className="p-1 border border-gray-300 rounded text-xs"
                    >
                      {statusOptions.filter((status) => status !== 'Все').map((status) => (
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
                    {order.publicToken && (
                      <a
                        href={`/order/${order.publicToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline"
                      >
                        Ссылка клиента
                      </a>
                    )}
                  </div>
                  {expandedId === order.id && <OrderDetails order={order} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderDetails({ order }) {
  return (
    <div className="bg-secondary border border-gray-200 rounded p-2 text-xs mt-1 space-y-1">
      <div>Создан: {order.createdAt || order.orderDate || '—'}</div>
      <div>Имя: {order.contactName || '—'}</div>
      <div>Телефон: {order.contactPhone || '—'}</div>
      <div>Email: {order.receiptEmail || '—'}</div>
      <div>Адрес: {order.homeAddress || '—'}</div>
      <div>Доставка: финальную стоимость и варианты согласует менеджер.</div>
      <div>Позиций: {Array.isArray(order.items) ? order.items.length : '—'}</div>
      {Array.isArray(order.items) && order.items.length > 0 && (
        <ul className="list-disc pl-4">
          {order.items.slice(0, 5).map((item, index) => (
            <li key={item.id || index}>
              {item.productName || item.productId} × {item.quantity} —{' '}
              {(item.totalPrice?.amount
                ? item.totalPrice.amount / 100
                : item.totalPrice || moneyToNumber(item.unitPrice || 0) * (item.quantity || 0)
              ).toLocaleString('ru-RU')}{' '}
              ₽
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminOrders;

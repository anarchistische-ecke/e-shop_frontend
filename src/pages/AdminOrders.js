import React, { useState, useEffect, useMemo } from 'react';
import { getOrders, updateOrderStatus, getCustomers, refreshOrderDelivery, cancelOrderDelivery } from '../api';
import { moneyToNumber } from '../utils/product';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [filter, setFilter] = useState('Все');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('ALL');
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState('ALL');
  const [deliveryProviderFilter, setDeliveryProviderFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [deliveryAction, setDeliveryAction] = useState({});
  const [deliveryError, setDeliveryError] = useState('');
  const statusLabels = {
    PENDING: 'Ожидает оплаты',
    PAID: 'Оплачен',
    PROCESSING: 'В обработке',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён',
    REFUNDED: 'Возврат'
  };
  const deliveryMethodLabels = {
    COURIER: 'Курьер',
    PICKUP: 'ПВЗ'
  };
  const deliveryStatusLabels = {
    CREATED: 'Создана',
    NEW: 'Новая',
    REQUESTED: 'Запрошена',
    CONFIRMED: 'Подтверждена',
    IN_PROGRESS: 'В пути',
    DELIVERED: 'Доставлена',
    CANCELLED: 'Отменена',
    FAILED: 'Ошибка'
  };

  const formatStatus = (status) => {
    if (!status) return '—';
    return statusLabels[status] || status;
  };

  const formatDeliveryMethod = (method) => {
    if (!method) return '—';
    const key = method.toUpperCase();
    return deliveryMethodLabels[key] || method;
  };

  const formatDeliveryStatus = (status) => {
    if (!status) return '—';
    const key = status.toUpperCase();
    if (key === 'NONE') return 'Без статуса';
    return deliveryStatusLabels[key] || status;
  };

  const formatDeliveryProvider = (provider) => {
    if (!provider) return '—';
    return provider.toUpperCase() === 'YANDEX' ? 'Яндекс Доставка' : provider;
  };

  const formatInterval = (from, to) => {
    if (!from || !to) return '—';
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return '—';
    }
    return `${fromDate.toLocaleString('ru-RU')} – ${toDate.toLocaleString('ru-RU')}`;
  };

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

  const handleRefreshDelivery = async (orderId) => {
    setDeliveryError('');
    setDeliveryAction((prev) => ({ ...prev, [orderId]: 'refresh' }));
    try {
      const updated = await refreshOrderDelivery(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? mergeOrderUpdate(o, updated) : o))
      );
    } catch (err) {
      console.error('Failed to refresh delivery:', err);
      setDeliveryError('Не удалось обновить статус доставки.');
    } finally {
      setDeliveryAction((prev) => ({ ...prev, [orderId]: null }));
    }
  };

  const handleCancelDelivery = async (orderId) => {
    setDeliveryError('');
    const confirm = window.confirm('Отменить доставку для этого заказа?');
    if (!confirm) return;
    setDeliveryAction((prev) => ({ ...prev, [orderId]: 'cancel' }));
    try {
      const updated = await cancelOrderDelivery(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? mergeOrderUpdate(o, updated) : o))
      );
    } catch (err) {
      console.error('Failed to cancel delivery:', err);
      setDeliveryError('Не удалось отменить доставку.');
    } finally {
      setDeliveryAction((prev) => ({ ...prev, [orderId]: null }));
    }
  };

  const availableDeliveryStatuses = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => {
      if (o?.deliveryStatus) {
        set.add(o.deliveryStatus.toUpperCase());
      }
    });
    return Array.from(set);
  }, [orders]);

  const availableDeliveryMethods = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => {
      if (o?.deliveryMethod) {
        set.add(o.deliveryMethod.toUpperCase());
      }
    });
    return Array.from(set);
  }, [orders]);

  const availableDeliveryProviders = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => {
      if (o?.deliveryProvider) {
        set.add(o.deliveryProvider.toUpperCase());
      }
    });
    return Array.from(set);
  }, [orders]);

  const deliverySummary = useMemo(() => {
    const withDelivery = orders.filter(
      (o) => o.deliveryProvider || o.deliveryMethod || o.deliveryRequestId || o.deliveryStatus
    );
    const courier = withDelivery.filter(
      (o) => (o.deliveryMethod || '').toUpperCase() === 'COURIER'
    ).length;
    const pickup = withDelivery.filter(
      (o) => (o.deliveryMethod || '').toUpperCase() === 'PICKUP'
    ).length;
    const statusCounts = withDelivery.reduce((acc, order) => {
      const key = (order.deliveryStatus || 'NONE').toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      total: orders.length,
      withDelivery: withDelivery.length,
      withoutDelivery: orders.length - withDelivery.length,
      courier,
      pickup,
      statusCounts
    };
  }, [orders]);

  const filteredOrders = orders.filter((order) => {
    if (filter !== 'Все' && order.status !== filter) {
      return false;
    }
    if (deliveryProviderFilter !== 'ALL') {
      if (deliveryProviderFilter === 'NONE') {
        if (order.deliveryProvider) return false;
      } else if ((order.deliveryProvider || '').toUpperCase() !== deliveryProviderFilter) {
        return false;
      }
    }
    if (deliveryMethodFilter !== 'ALL') {
      if (deliveryMethodFilter === 'NONE') {
        if (order.deliveryMethod) return false;
      } else if ((order.deliveryMethod || '').toUpperCase() !== deliveryMethodFilter) {
        return false;
      }
    }
    if (deliveryStatusFilter !== 'ALL') {
      if (deliveryStatusFilter === 'NONE') {
        if (order.deliveryStatus) return false;
      } else if ((order.deliveryStatus || '').toUpperCase() !== deliveryStatusFilter) {
        return false;
      }
    }
    return true;
  });

  const visibleOrders = filteredOrders.filter(
    (o) =>
      (o.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (customers[o.customerId] || '').toLowerCase().includes(search.toLowerCase())
  );

  const extractTotal = (order) => moneyToNumber(order?.totalAmount || order?.total || 0);
  const extractDeliveryAmount = (order) => moneyToNumber(order?.deliveryAmount || 0);

  const mergeOrderUpdate = (current, updated) => {
    if (!updated) return current;
    const merged = { ...current, ...updated };
    if (!updated.items || updated.items.length === 0) {
      merged.items = current?.items;
    }
    return merged;
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
        {['Все', 'PENDING', 'PAID', 'PROCESSING', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((status) => (
          <option key={status} value={status}>
            {status === 'PENDING'
              ? 'Ожидает оплаты'
              : status === 'PAID'
              ? 'Оплачен'
              : status === 'PROCESSING'
              ? 'В обработке'
              : status === 'DELIVERED'
              ? 'Доставлен'
              : status === 'CANCELLED'
                ? 'Отменён'
                : status === 'REFUNDED'
                ? 'Возврат'
                : status}
            </option>
          ))}
        </select>
        <select
          value={deliveryProviderFilter}
          onChange={(e) => setDeliveryProviderFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded text-sm"
        >
          <option value="ALL">Доставка: все провайдеры</option>
          <option value="NONE">Без провайдера</option>
          {availableDeliveryProviders.map((provider) => (
            <option key={provider} value={provider}>
              {formatDeliveryProvider(provider)}
            </option>
          ))}
        </select>
        <select
          value={deliveryMethodFilter}
          onChange={(e) => setDeliveryMethodFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded text-sm"
        >
          <option value="ALL">Доставка: все методы</option>
          <option value="NONE">Без доставки</option>
          {availableDeliveryMethods.map((method) => (
            <option key={method} value={method}>
              {formatDeliveryMethod(method)}
            </option>
          ))}
        </select>
        <select
          value={deliveryStatusFilter}
          onChange={(e) => setDeliveryStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded text-sm"
        >
          <option value="ALL">Статус доставки: любой</option>
          <option value="NONE">Без статуса</option>
          {availableDeliveryStatuses.map((status) => (
            <option key={status} value={status}>
              {formatDeliveryStatus(status)}
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
      {deliveryError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {deliveryError}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-muted">Заказов с доставкой</div>
          <div className="text-lg font-semibold">{deliverySummary.withDelivery}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-muted">Курьер</div>
          <div className="text-lg font-semibold">{deliverySummary.courier}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-muted">ПВЗ</div>
          <div className="text-lg font-semibold">{deliverySummary.pickup}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-muted">Без доставки</div>
          <div className="text-lg font-semibold">{deliverySummary.withoutDelivery}</div>
        </div>
      </div>
      {Object.keys(deliverySummary.statusCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(deliverySummary.statusCounts).map(([status, count]) => (
            <span
              key={status}
              className="px-3 py-1 rounded-full border border-ink/10 bg-white text-ink"
            >
              {formatDeliveryStatus(status)}: {count}
            </span>
          ))}
        </div>
      )}
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
                    : order.status === 'PROCESSING'
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
                <span>{customers[order.customerId] || order.customerId}</span>
              </div>
              <div>
                <span className="text-muted text-xs block">Сумма</span>
                <span>{extractTotal(order).toLocaleString('ru-RU')} ₽</span>
              </div>
              {order.deliveryProvider && (
                <div>
                  <span className="text-muted text-xs block">Доставка</span>
                  <span>
                    {formatDeliveryProvider(order.deliveryProvider)} · {formatDeliveryMethod(order.deliveryMethod)} ·{' '}
                    {extractDeliveryAmount(order).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              )}
              {order.deliveryStatus && (
                <div>
                  <span className="text-muted text-xs block">Статус доставки</span>
                  <span>{formatDeliveryStatus(order.deliveryStatus)}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className="p-2 border border-gray-300 rounded text-xs"
              >
                {['PENDING', 'PAID', 'PROCESSING', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((status) => (
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
                {order.deliveryProvider && (
                  <>
                    <div>Провайдер доставки: {formatDeliveryProvider(order.deliveryProvider)}</div>
                    <div>Метод: {formatDeliveryMethod(order.deliveryMethod)}</div>
                    <div>Статус доставки: {formatDeliveryStatus(order.deliveryStatus)}</div>
                    {order.deliveryRequestId && (
                      <div className="break-all">Запрос: {order.deliveryRequestId}</div>
                    )}
                    {order.deliveryOfferId && (
                      <div className="break-all">Оффер: {order.deliveryOfferId}</div>
                    )}
                    {order.deliveryAddress && (
                      <div>Адрес: {order.deliveryAddress}</div>
                    )}
                    {order.deliveryPickupPointName && (
                      <div>ПВЗ: {order.deliveryPickupPointName}</div>
                    )}
                    {(order.deliveryIntervalFrom || order.deliveryIntervalTo) && (
                      <div>Интервал: {formatInterval(order.deliveryIntervalFrom, order.deliveryIntervalTo)}</div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        className="text-xs text-primary underline"
                        onClick={() => handleRefreshDelivery(order.id)}
                        disabled={!order.deliveryRequestId || deliveryAction[order.id]}
                      >
                        {deliveryAction[order.id] === 'refresh' ? 'Обновляем…' : 'Обновить доставку'}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 underline"
                        onClick={() => handleCancelDelivery(order.id)}
                        disabled={!order.deliveryRequestId || deliveryAction[order.id]}
                      >
                        {deliveryAction[order.id] === 'cancel' ? 'Отменяем…' : 'Отменить доставку'}
                      </button>
                    </div>
                  </>
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
              <th className="p-2 border-b">Доставка</th>
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
                  {order.deliveryProvider ? (
                    <div className="text-xs space-y-1">
                      <div>{formatDeliveryProvider(order.deliveryProvider)}</div>
                      <div>{formatDeliveryMethod(order.deliveryMethod)}</div>
                      <div>{extractDeliveryAmount(order).toLocaleString('ru-RU')} ₽</div>
                      {order.deliveryStatus && (
                        <div className="text-muted">{formatDeliveryStatus(order.deliveryStatus)}</div>
                      )}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-2">
                  <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'DELIVERED'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'PROCESSING'
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
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="p-1 border border-gray-300 rounded text-xs"
                    >
                    {['PENDING', 'PAID', 'PROCESSING', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((status) => (
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
                      {order.deliveryProvider && (
                        <>
                          <div>Провайдер доставки: {formatDeliveryProvider(order.deliveryProvider)}</div>
                          <div>Метод: {formatDeliveryMethod(order.deliveryMethod)}</div>
                          <div>Статус доставки: {formatDeliveryStatus(order.deliveryStatus)}</div>
                          {order.deliveryRequestId && (
                            <div className="break-all">Запрос: {order.deliveryRequestId}</div>
                          )}
                          {order.deliveryOfferId && (
                            <div className="break-all">Оффер: {order.deliveryOfferId}</div>
                          )}
                          {order.deliveryAddress && (
                            <div>Адрес: {order.deliveryAddress}</div>
                          )}
                          {order.deliveryPickupPointName && (
                            <div>ПВЗ: {order.deliveryPickupPointName}</div>
                          )}
                          {(order.deliveryIntervalFrom || order.deliveryIntervalTo) && (
                            <div>Интервал: {formatInterval(order.deliveryIntervalFrom, order.deliveryIntervalTo)}</div>
                          )}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              className="text-xs text-primary underline"
                              onClick={() => handleRefreshDelivery(order.id)}
                              disabled={!order.deliveryRequestId || deliveryAction[order.id]}
                            >
                              {deliveryAction[order.id] === 'refresh' ? 'Обновляем…' : 'Обновить доставку'}
                            </button>
                            <button
                              type="button"
                              className="text-xs text-red-600 underline"
                              onClick={() => handleCancelDelivery(order.id)}
                              disabled={!order.deliveryRequestId || deliveryAction[order.id]}
                            >
                              {deliveryAction[order.id] === 'cancel' ? 'Отменяем…' : 'Отменить доставку'}
                            </button>
                          </div>
                        </>
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

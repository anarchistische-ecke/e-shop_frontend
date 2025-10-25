import React from 'react';

/**
 * AdminOrders displays a filterable list of orders.  This placeholder
 * provides a description of the intended features; implement the
 * functionality when connecting to a backend.
 */
function AdminOrders() {
  const initialOrders = [
    { id: '10001', customer: 'Иван Иванов', date: '2025-09-01', total: 3999, status: 'Новый' },
    { id: '10002', customer: 'Мария Петрова', date: '2025-09-02', total: 7299, status: 'В обработке' },
    { id: '10003', customer: 'Ольга Смирнова', date: '2025-09-03', total: 15999, status: 'Доставлен' },
  ];
  const [orders, setOrders] = React.useState(initialOrders);
  const [filter, setFilter] = React.useState('Все');

  const handleStatusChange = (index, newStatus) => {
    setOrders((prev) => prev.map((o, i) => (i === index ? { ...o, status: newStatus } : o)));
  };

  const filteredOrders = orders.filter((o) => (filter === 'Все' ? true : o.status === filter));

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
          {['Все', 'Новый', 'В обработке', 'Доставлен', 'Отменён'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b">ID</th>
            <th className="p-2 border-b">Клиент</th>
            <th className="p-2 border-b">Дата</th>
            <th className="p-2 border-b">Сумма</th>
            <th className="p-2 border-b">Статус</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order, index) => (
            <tr key={order.id} className="border-b">
              <td className="p-2">{order.id}</td>
              <td className="p-2">{order.customer}</td>
              <td className="p-2">{order.date}</td>
              <td className="p-2">{order.total.toLocaleString('ru-RU')} ₽</td>
              <td className="p-2">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(index, e.target.value)}
                  className="p-1 border border-gray-300 rounded"
                >
                  {['Новый', 'В обработке', 'Доставлен', 'Отменён'].map((status) => (
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
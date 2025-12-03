import React, { useEffect, useState } from 'react';
import { getOrders } from '../api';

/**
 * AdminReports will provide advanced reporting and analytics.  This
 * placeholder highlights the types of reports that can be generated
 * once the backend exposes the necessary data.
 */
function AdminReports() {
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo, setDateTo] = useState('2025-12-31');
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState({ totalSales: 0, totalOrders: 0, averageOrderValue: 0, delivered: 0, cancelled: 0 });

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch orders:', err));
  }, []);

  const handleRunReport = (e) => {
    e.preventDefault();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : 0;
    const toTs = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : Number.MAX_SAFE_INTEGER;
    let totalSales = 0;
    let totalOrders = 0;
    let delivered = 0;
    let cancelled = 0;
    orders.forEach((o) => {
      const created = o.createdAt ? new Date(o.createdAt).getTime() : 0;
      if (created >= fromTs && created <= toTs) {
        totalOrders += 1;
        const amount = o.total?.amount ? o.total.amount / 100 : o.total || 0;
        totalSales += amount;
        if (o.status === 'DELIVERED') delivered += 1;
        if (o.status === 'CANCELLED') cancelled += 1;
      }
    });
    setReport({
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders ? totalSales / totalOrders : 0,
      delivered,
      cancelled,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Отчёты</h1>
      <form onSubmit={handleRunReport} className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-sm mb-1">С даты</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">По дату</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
        </div>
        <button type="submit" className="button h-10">Построить отчёт</button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Продажи за период</h3>
          <p className="text-2xl font-bold">{report.totalSales.toLocaleString('ru-RU')} ₽</p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Количество заказов</h3>
          <p className="text-2xl font-bold">{report.totalOrders}</p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Средний чек</h3>
          <p className="text-2xl font-bold">{report.averageOrderValue.toLocaleString('ru-RU')} ₽</p>
        </div>
      </div>
      <div className="bg-white border rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Статусы</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded border border-gray-200 bg-secondary/60">
            <p className="text-muted text-xs mb-1">Доставлено</p>
            <p className="text-xl font-semibold">{report.delivered}</p>
          </div>
          <div className="p-3 rounded border border-gray-200 bg-secondary/60">
            <p className="text-muted text-xs mb-1">Отменено</p>
            <p className="text-xl font-semibold">{report.cancelled}</p>
          </div>
          <div className="p-3 rounded border border-gray-200 bg-secondary/60">
            <p className="text-muted text-xs mb-1">В обработке</p>
            <p className="text-xl font-semibold">
              {orders.filter((o) => o.status === 'PROCESSING').length}
            </p>
          </div>
          <div className="p-3 rounded border border-gray-200 bg-secondary/60">
            <p className="text-muted text-xs mb-1">Новые</p>
            <p className="text-xl font-semibold">
              {orders.filter((o) => o.status === 'PENDING').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;

import React from 'react';

/**
 * AdminReports will provide advanced reporting and analytics.  This
 * placeholder highlights the types of reports that can be generated
 * once the backend exposes the necessary data.
 */
function AdminReports() {
  const [dateFrom, setDateFrom] = React.useState('2025-01-01');
  const [dateTo, setDateTo] = React.useState('2025-12-31');

  // Fake report summary
  const report = {
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  };

  const handleRunReport = (e) => {
    e.preventDefault();
    // In real implementation fetch report data for the selected range
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
          <p className="text-2xl font-bold">{report.totalSales} ₽</p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Количество заказов</h3>
          <p className="text-2xl font-bold">{report.totalOrders}</p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-500 mb-1">Средний чек</h3>
          <p className="text-2xl font-bold">{report.averageOrderValue} ₽</p>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;
import React from 'react';

/**
 * AdminPromotions will manage marketing tools such as discounts and
 * coupons, abandoned cart campaigns, email campaigns and gift cards.
 * This placeholder describes the features to be implemented.
 */
function AdminPromotions() {
  const initialCoupons = [
    { id: 'COZY10', type: 'percent', value: 10, minSpend: 1000, expiry: '2025-12-31', active: true },
    { id: 'WELCOME500', type: 'fixed', value: 500, minSpend: 2000, expiry: '2025-10-31', active: true },
  ];
  const [coupons, setCoupons] = React.useState(initialCoupons);
  const [newCoupon, setNewCoupon] = React.useState({ id: '', type: 'percent', value: '', minSpend: '', expiry: '', active: true });

  const handleToggle = (code) => {
    setCoupons((prev) => prev.map((c) => (c.id === code ? { ...c, active: !c.active } : c)));
  };

  const handleDelete = (code) => {
    setCoupons((prev) => prev.filter((c) => c.id !== code));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCoupon.id || !newCoupon.value) return;
    setCoupons((prev) => [...prev, { ...newCoupon, value: Number(newCoupon.value), minSpend: Number(newCoupon.minSpend) || 0 }]);
    setNewCoupon({ id: '', type: 'percent', value: '', minSpend: '', expiry: '', active: true });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Купоны и скидки</h1>
      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b">Код</th>
            <th className="p-2 border-b">Тип</th>
            <th className="p-2 border-b">Значение</th>
            <th className="p-2 border-b">Мин. сумма</th>
            <th className="p-2 border-b">Срок</th>
            <th className="p-2 border-b">Активен</th>
            <th className="p-2 border-b">Действия</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.id}</td>
              <td className="p-2">{c.type === 'percent' ? 'Процент' : 'Фиксированная сумма'}</td>
              <td className="p-2">{c.value}{c.type === 'percent' ? '%' : ' ₽'}</td>
              <td className="p-2">{c.minSpend.toLocaleString('ru-RU')} ₽</td>
              <td className="p-2">{c.expiry}</td>
              <td className="p-2">
                <input type="checkbox" checked={c.active} onChange={() => handleToggle(c.id)} />
              </td>
              <td className="p-2 space-x-2">
                <button className="button-gray" onClick={() => handleDelete(c.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="text-xl font-semibold">Создать купон</h2>
      <form onSubmit={handleAdd} className="space-y-4 max-w-xl">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Код"
            value={newCoupon.id}
            onChange={(e) => setNewCoupon({ ...newCoupon, id: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <select
            value={newCoupon.type}
            onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          >
            <option value="percent">Процент</option>
            <option value="fixed">Фиксированная сумма</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            placeholder="Значение"
            value={newCoupon.value}
            onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <input
            type="number"
            placeholder="Мин. сумма заказа"
            value={newCoupon.minSpend}
            onChange={(e) => setNewCoupon({ ...newCoupon, minSpend: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            value={newCoupon.expiry}
            onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <label className="flex items-center gap-2 flex-1 p-2 border border-gray-300 rounded">
            <input
              type="checkbox"
              checked={newCoupon.active}
              onChange={(e) => setNewCoupon({ ...newCoupon, active: e.target.checked })}
            />
            <span>Активен</span>
          </label>
        </div>
        <button type="submit" className="button">Добавить</button>
      </form>
    </div>
  );
}

export default AdminPromotions;
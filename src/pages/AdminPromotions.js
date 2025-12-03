import React from 'react';

/**
 * AdminPromotions will manage marketing tools such as discounts and
 * coupons, abandoned cart campaigns, email campaigns and gift cards.
 * This placeholder describes the features to be implemented.
 */
function AdminPromotions() {
  const initialCoupons = [
    { id: 'COZY10', type: 'percent', value: 10, minSpend: 1000, expiry: '2025-12-31', active: true, usageLimit: 100, used: 4 },
    { id: 'WELCOME500', type: 'fixed', value: 500, minSpend: 2000, expiry: '2025-10-31', active: true, usageLimit: 50, used: 12 },
  ];
  const [coupons, setCoupons] = React.useState(() => {
    const saved = localStorage.getItem('adminCoupons');
    return saved ? JSON.parse(saved) : initialCoupons;
  });
  const [newCoupon, setNewCoupon] = React.useState({ id: '', type: 'percent', value: '', minSpend: '', expiry: '', active: true, usageLimit: 0 });
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    localStorage.setItem('adminCoupons', JSON.stringify(coupons));
  }, [coupons]);

  const handleToggle = (code) => {
    setCoupons((prev) => prev.map((c) => (c.id === code ? { ...c, active: !c.active } : c)));
  };

  const handleDelete = (code) => {
    setCoupons((prev) => prev.filter((c) => c.id !== code));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCoupon.id || !newCoupon.value) return;
    setCoupons((prev) => [
      ...prev,
      {
        ...newCoupon,
        value: Number(newCoupon.value),
        minSpend: Number(newCoupon.minSpend) || 0,
        usageLimit: Number(newCoupon.usageLimit) || 0,
        used: 0,
      },
    ]);
    setNewCoupon({ id: '', type: 'percent', value: '', minSpend: '', expiry: '', active: true, usageLimit: 0 });
  };

  const filtered = coupons.filter(
    (c) =>
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Купоны и скидки</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по коду или типу"
          className="p-2 border border-gray-300 rounded flex-1 min-w-[200px] text-sm"
        />
        <div className="text-sm text-muted">Активных: {coupons.filter((c) => c.active).length}</div>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-sm border border-gray-200 align-top">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b">Код</th>
            <th className="p-2 border-b">Тип</th>
            <th className="p-2 border-b">Значение</th>
            <th className="p-2 border-b">Мин. сумма</th>
            <th className="p-2 border-b">Срок</th>
            <th className="p-2 border-b">Активен</th>
            <th className="p-2 border-b">Использовано</th>
            <th className="p-2 border-b">Действия</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.id}</td>
              <td className="p-2">{c.type === 'percent' ? 'Процент' : 'Фиксированная сумма'}</td>
              <td className="p-2">{c.value}{c.type === 'percent' ? '%' : ' ₽'}</td>
              <td className="p-2">{c.minSpend.toLocaleString('ru-RU')} ₽</td>
              <td className="p-2">{c.expiry}</td>
              <td className="p-2">
                <input type="checkbox" checked={c.active} onChange={() => handleToggle(c.id)} />
              </td>
              <td className="p-2 text-xs">
                {c.used || 0} / {c.usageLimit || '∞'}
              </td>
              <td className="p-2 space-x-2">
                <button className="button-gray" onClick={() => handleDelete(c.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} className="p-4 text-center text-muted">Купоны не найдены</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
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
          <input
            type="number"
            placeholder="Лимит использований (0 = без лимита)"
            value={newCoupon.usageLimit}
            onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
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

import React from 'react';

/**
 * AdminCustomers allows viewing and managing registered customers.
 * This is a placeholder component; extend it to show customer lists,
 * profiles and segmentation reports when implementing backend support.
 */
function AdminCustomers() {
  const initialCustomers = [
    { id: 'c001', name: 'Иван Иванов', email: 'ivan@example.com', totalSpent: 15999 },
    { id: 'c002', name: 'Мария Петрова', email: 'maria@example.com', totalSpent: 8999 },
    { id: 'c003', name: 'Ольга Смирнова', email: 'olga@example.com', totalSpent: 4500 },
  ];
  const [customers, setCustomers] = React.useState(initialCustomers);
  const [editingId, setEditingId] = React.useState(null);
  const [newCustomer, setNewCustomer] = React.useState({ name: '', email: '', totalSpent: '' });

  const handleEditChange = (id, field, value) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleDelete = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email) return;
    const id = 'c' + (Date.now());
    setCustomers((prev) => [...prev, { ...newCustomer, id, totalSpent: Number(newCustomer.totalSpent) || 0 }]);
    setNewCustomer({ name: '', email: '', totalSpent: '' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Клиенты</h1>
      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b">ID</th>
            <th className="p-2 border-b">Имя</th>
            <th className="p-2 border-b">E‑mail</th>
            <th className="p-2 border-b">Сумма покупок</th>
            <th className="p-2 border-b">Действия</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.id}</td>
              <td className="p-2">
                {editingId === c.id ? (
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleEditChange(c.id, 'name', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                ) : (
                  c.name
                )}
              </td>
              <td className="p-2">
                {editingId === c.id ? (
                  <input
                    type="email"
                    value={c.email}
                    onChange={(e) => handleEditChange(c.id, 'email', e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                ) : (
                  c.email
                )}
              </td>
              <td className="p-2">{c.totalSpent.toLocaleString('ru-RU')} ₽</td>
              <td className="p-2 space-x-2">
                {editingId === c.id ? (
                  <>
                    <button className="button" onClick={() => setEditingId(null)}>Сохранить</button>
                    <button className="button-gray" onClick={() => setEditingId(null)}>Отмена</button>
                  </>
                ) : (
                  <>
                    <button className="button" onClick={() => setEditingId(c.id)}>Редактировать</button>
                    <button className="button-gray" onClick={() => handleDelete(c.id)}>Удалить</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="text-xl font-semibold">Добавить клиента</h2>
      <form onSubmit={handleAdd} className="space-y-4 max-w-lg">
        <input
          type="text"
          placeholder="Имя"
          value={newCustomer.name}
          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="email"
          placeholder="E‑mail"
          value={newCustomer.email}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="number"
          placeholder="Сумма покупок (необязательно)"
          value={newCustomer.totalSpent}
          onChange={(e) => setNewCustomer({ ...newCustomer, totalSpent: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button type="submit" className="button">
          Добавить
        </button>
      </form>
    </div>
  );
}

export default AdminCustomers;
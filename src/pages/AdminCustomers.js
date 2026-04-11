import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer } from '../api';

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCustomers()
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch customers:', err));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email) {
      return;
    }
    try {
      const created = await createCustomer(newCustomer);
      setCustomers((prev) => [...prev, created]);
      setNewCustomer({
        firstName: '',
        lastName: '',
        email: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      });
    } catch (err) {
      console.error('Failed to create customer:', err);
    }
  };

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.firstName?.toLowerCase().includes(term) ||
      c.lastName?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

  const handleExportCsv = () => {
    const header = 'Имя,Фамилия,Email\n';
    const rows = filtered
      .map((c) => `${c.firstName || ''},${c.lastName || ''},${c.email || ''}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers.csv');
    link.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Клиенты</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <label htmlFor="admin-customer-search" className="sr-only">
          Поиск клиентов
        </label>
        <input
          id="admin-customer-search"
          type="text"
          placeholder="Поиск по имени или email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border border-gray-300 rounded flex-1 min-w-[200px] text-sm"
        />
        <div className="text-sm text-muted">Показано: {filtered.length}</div>
        <button className="button-gray text-sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
          Экспорт CSV
        </button>
      </div>
      <div className="md:hidden space-y-3">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-2">
            <div>
              <span className="text-xs text-muted block">ID</span>
              <span className="text-sm">{c.id}</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <div>
                <span className="text-xs text-muted block">Имя</span>
                <span>{c.firstName || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted block">Фамилия</span>
                <span>{c.lastName || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted block">E‑mail</span>
                <span>{c.email || '—'}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-muted text-center">Клиенты не найдены</div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 align-top">
          <caption className="sr-only">
            Список клиентов с идентификатором, именем, фамилией и электронной почтой
          </caption>
          <thead className="bg-secondary">
            <tr>
              <th scope="col" className="p-2 border-b">ID</th>
              <th scope="col" className="p-2 border-b">Имя</th>
              <th scope="col" className="p-2 border-b">Фамилия</th>
              <th scope="col" className="p-2 border-b">E‑mail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-2">{c.id}</td>
                <td className="p-2">{c.firstName}</td>
                <td className="p-2">{c.lastName}</td>
                <td className="p-2">{c.email}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted">
                  Клиенты не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <h2 className="text-xl font-semibold">Добавить клиента</h2>
      <form onSubmit={handleAdd} className="space-y-2 max-w-lg">
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1">
            <span className="sr-only">Имя клиента</span>
          <input
            type="text"
            placeholder="Имя"
            value={newCustomer.firstName}
            onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          </label>
          <label className="flex-1">
            <span className="sr-only">Фамилия клиента</span>
          <input
            type="text"
            placeholder="Фамилия"
            value={newCustomer.lastName}
            onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          </label>
        </div>
        <label className="block">
          <span className="sr-only">Электронная почта клиента</span>
        <input
          type="email"
          placeholder="E‑mail"
          value={newCustomer.email}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        </label>
        <label className="block">
          <span className="sr-only">Улица</span>
        <input
          type="text"
          placeholder="Улица"
          value={newCustomer.street}
          onChange={(e) => setNewCustomer({ ...newCustomer, street: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1">
            <span className="sr-only">Город</span>
          <input
            type="text"
            placeholder="Город"
            value={newCustomer.city}
            onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          </label>
          <label className="flex-1">
            <span className="sr-only">Штат или регион</span>
          <input
            type="text"
            placeholder="Штат / регион"
            value={newCustomer.state}
            onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          </label>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1">
            <span className="sr-only">Почтовый индекс</span>
          <input
            type="text"
            placeholder="Почтовый индекс"
            value={newCustomer.postalCode}
            onChange={(e) => setNewCustomer({ ...newCustomer, postalCode: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          </label>
          <label className="flex-1">
            <span className="sr-only">Страна</span>
          <input
            type="text"
            placeholder="Страна"
            value={newCustomer.country}
            onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          </label>
        </div>
        <button type="submit" className="button">
          Добавить
        </button>
      </form>
    </div>
  );
}

export default AdminCustomers;

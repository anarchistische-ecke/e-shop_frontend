import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer } from '../api';

/**
 * AdminCustomers lists all registered customers and allows adding new
 * ones.  Editing and deletion are not implemented because the
 * backend exposes only read and create operations.  To extend this
 * component implement corresponding endpoints in the API and wire
 * them up here.
 */
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

  // Load the customer list on mount
  useEffect(() => {
    getCustomers()
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch customers:', err));
  }, []);

  // Handle form submission to create a customer
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Клиенты</h1>
      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-secondary">
          <tr>
            <th className="p-2 border-b">ID</th>
            <th className="p-2 border-b">Имя</th>
            <th className="p-2 border-b">Фамилия</th>
            <th className="p-2 border-b">E‑mail</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.id}</td>
              <td className="p-2">{c.firstName}</td>
              <td className="p-2">{c.lastName}</td>
              <td className="p-2">{c.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="text-xl font-semibold">Добавить клиента</h2>
      <form onSubmit={handleAdd} className="space-y-2 max-w-lg">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Имя"
            value={newCustomer.firstName}
            onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Фамилия"
            value={newCustomer.lastName}
            onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
        </div>
        <input
          type="email"
          placeholder="E‑mail"
          value={newCustomer.email}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Улица"
          value={newCustomer.street}
          onChange={(e) => setNewCustomer({ ...newCustomer, street: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Город"
            value={newCustomer.city}
            onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Штат / регион"
            value={newCustomer.state}
            onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Почтовый индекс"
            value={newCustomer.postalCode}
            onChange={(e) => setNewCustomer({ ...newCustomer, postalCode: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Страна"
            value={newCustomer.country}
            onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
        </div>
        <button type="submit" className="button">
          Добавить
        </button>
      </form>
    </div>
  );
}

export default AdminCustomers;
import React, { useEffect, useState } from 'react';
import { getOrders } from '../api';
import { Navigate } from 'react-router-dom';

function AccountPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch the current user's orders (requires user to be logged in with token)
    getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch orders:', err));
  }, []);

  // If not logged in, redirect to login page
  const token = localStorage.getItem('userToken');
  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="account-page py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-6">Мой профиль</h1>
        <h2 className="text-xl font-semibold mb-4">История заказов</h2>
        {orders.length === 0 ? (
          <p>У вас ещё нет заказов.</p>
        ) : (
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-secondary">
              <tr>
                <th className="p-2 border-b">Номер заказа</th>
                <th className="p-2 border-b">Дата</th>
                <th className="p-2 border-b">Статус</th>
                <th className="p-2 border-b">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                // Format date and total
                const date = order.createdAt ? new Date(order.createdAt) : new Date();
                const dateStr = date.toLocaleDateString('ru-RU');
                // Extract numeric total (handles Money object or plain number)
                let totalAmount = 0;
                if (order.total) {
                  if (typeof order.total === 'object' && order.total !== null) {
                    totalAmount = order.total.amount !== undefined 
                      ? order.total.amount / 100 
                      : order.total.totalAmount / 100;
                  } else if (typeof order.total === 'number') {
                    totalAmount = order.total;
                  }
                }
                return (
                  <tr key={order.id} className="border-b">
                    <td className="p-2">{String(order.id).slice(0, 8)}...</td>
                    <td className="p-2">{dateStr}</td>
                    <td className="p-2">{order.status || 'PENDING'}</td>
                    <td className="p-2">{totalAmount.toLocaleString('ru-RU')} ₽</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AccountPage;

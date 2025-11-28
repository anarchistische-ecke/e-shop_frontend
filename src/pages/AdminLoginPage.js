import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginAdmin } from '../api';
import { notifyAuthChange } from '../utils/auth';

/**
 * AdminLoginPage renders a login form for administrators. It now integrates with the backend API:
 * on submit, it sends credentials and stores the returned JWT token for authentication.
 */
function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && location.state.from) || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await loginAdmin(username, password);
      localStorage.setItem('adminToken', result.token);
      notifyAuthChange({ type: 'admin', action: 'login' });
      navigate(from);
    } catch (err) {
      console.error('Failed to login admin:', err);
      alert('Ошибка входа');  // "Login error"
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Вход в панель администратора</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1" htmlFor="username">Логин</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block mb-1" htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <button type="submit" className="button w-full">Войти</button>
      </form>
    </div>
  );
}

export default AdminLoginPage;

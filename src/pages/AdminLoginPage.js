import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * AdminLoginPage renders a simple login form for administrators.  In this
 * front‑end replica there is no real authentication logic; submitting
 * the form simply stores a flag in localStorage and redirects the
 * administrator back to the page they attempted to access.  When
 * integrating with a backend you would replace the localStorage
 * interaction with API requests and proper authentication flows.
 */
function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && location.state.from) || '/admin';

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application verify credentials with the server here.
    // For this replica any credentials will succeed.
    localStorage.setItem('adminAuth', 'true');
    navigate(from);
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Вход в панель администратора</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1" htmlFor="username">
            Логин
          </label>
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
          <label className="block mb-1" htmlFor="password">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <button type="submit" className="button w-full">
          Войти
        </button>
      </form>
    </div>
  );
}

export default AdminLoginPage;
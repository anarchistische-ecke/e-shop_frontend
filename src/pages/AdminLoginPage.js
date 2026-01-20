import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginAdmin } from '../api';
import { useAuth } from '../contexts/AuthContext';

function AdminLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = (location.state && location.state.from) || '/admin';
  const { isAuthenticated, isReady, hasRole, login } = useAuth();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const adminRole = process.env.REACT_APP_KEYCLOAK_ADMIN_ROLE || 'admin';
  const isAdmin = isAuthenticated && hasRole(adminRole);

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/admin';
    if (!path.startsWith('/') || path.startsWith('//')) return '/admin';
    return path;
  };

  const handleChange = (field) => (event) => {
    setCredentials((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    if (!credentials.username.trim() || !credentials.password) {
      setStatus({ type: 'error', message: 'Введите логин и пароль администратора.' });
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await loginAdmin(credentials.username.trim(), credentials.password);
      await login({ token: response?.token, profile: { username: credentials.username.trim() } });
      navigate(safeRedirectPath(redirectTo), { replace: true });
    } catch (err) {
      console.error('Admin login failed:', err);
      setStatus({ type: 'error', message: 'Неверные учетные данные.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReady && isAdmin) {
    return <Navigate to={safeRedirectPath(redirectTo)} replace />;
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Вход в панель администратора</h1>
      {status && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-green-300 bg-green-50 text-green-800'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          {status.message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="text-muted">Логин</span>
          <input
            type="text"
            value={credentials.username}
            onChange={handleChange('username')}
            placeholder="admin"
            className="mt-2 w-full"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Пароль</span>
          <input
            type="password"
            value={credentials.password}
            onChange={handleChange('password')}
            placeholder="Введите пароль"
            className="mt-2 w-full"
          />
        </label>
        <button type="submit" className="button w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Входим…' : 'Войти'}
        </button>
      </form>
      {isReady && isAuthenticated && !isAdmin && (
        <p className="mt-4 text-sm text-red-600">
          У вашей учётной записи нет прав администратора.
        </p>
      )}
    </div>
  );
}

export default AdminLoginPage;

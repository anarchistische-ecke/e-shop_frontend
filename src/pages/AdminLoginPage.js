import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminLoginPage() {
  const location = useLocation();
  const redirectTo = (location.state && location.state.from) || '/admin';
  const { isAuthenticated, isReady, isConfigured, hasRole, login } = useAuth();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const adminRole = process.env.REACT_APP_KEYCLOAK_ADMIN_ROLE || 'admin';
  const adminRoleClient = process.env.REACT_APP_KEYCLOAK_ADMIN_ROLE_CLIENT || '';
  const isAdmin = isAuthenticated && (adminRoleClient
    ? hasRole(adminRole, { clientId: adminRoleClient })
    : hasRole(adminRole));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    try {
      if (!isConfigured) {
        throw new Error('Keycloak is not configured');
      }
      await login({
        redirectUri: buildRedirectUri(),
        prompt: 'login'
      });
    } catch (err) {
      console.error('Failed to start admin login:', err);
      setStatus({
        type: 'error',
        message: 'Не удалось открыть страницу входа. Проверьте настройки Keycloak.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/admin';
    if (!path.startsWith('/') || path.startsWith('//')) return '/admin';
    return path;
  };

  const buildRedirectUri = () => {
    if (typeof window === 'undefined') return undefined;
    const safePath = safeRedirectPath(redirectTo);
    return `${window.location.origin}${safePath}`;
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
      {!isConfigured && (
        <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          Keycloak не настроен. Заполните переменные окружения и перезапустите приложение.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          Авторизация администратора выполняется через Keycloak.
        </p>
        <button
          type="submit"
          className="button w-full"
          disabled={isSubmitting || !isConfigured}
        >
          {isSubmitting ? 'Открываем вход…' : 'Войти через Keycloak'}
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

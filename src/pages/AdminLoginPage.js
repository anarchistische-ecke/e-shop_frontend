import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isKeycloakConfigured, login as keycloakLogin } from '../auth/keycloak';

function AdminLoginPage() {
  const location = useLocation();
  const redirectTo = (location.state && location.state.from) || '/admin';
  const { isAuthenticated, isReady, hasRole } = useAuth();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const adminRole = process.env.REACT_APP_KEYCLOAK_ADMIN_ROLE || 'admin';
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isAdmin = isAuthenticated && hasRole(adminRole);
  const isManager = isAuthenticated && hasRole(managerRole);
  const keycloakReady = isKeycloakConfigured();

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/admin';
    if (!path.startsWith('/') || path.startsWith('//')) return '/admin';
    return path;
  };

  const buildRedirectUri = (path) => {
    if (typeof window === 'undefined') return undefined;
    const rawBase = process.env.REACT_APP_BASENAME || process.env.PUBLIC_URL || '';
    const base = rawBase.replace(/\/$/, '');
    const normalizedBase = base && base !== '/' ? base : '';
    return `${window.location.origin}${normalizedBase}${path}`;
  };

  const handleKeycloakLogin = async () => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      await keycloakLogin({
        redirectUri: buildRedirectUri('/admin/login')
      });
    } catch (err) {
      console.error('Keycloak login failed:', err);
      setStatus({ type: 'error', message: 'Не удалось открыть страницу входа.' });
      setIsSubmitting(false);
    }
  };

  if (isReady && isAuthenticated) {
    if (isAdmin) {
      return <Navigate to={safeRedirectPath(redirectTo)} replace />;
    }
    if (isManager) {
      return <Navigate to="/account" replace />;
    }
  }

  return (
    <section className="admin-auth-page">
      <div className="admin-auth-grid">
        <aside className="admin-auth-showcase" aria-hidden="true">
          <p className="admin-auth-showcase__eyebrow">Secure zone</p>
          <h1 className="admin-auth-showcase__title">Панель управления Постельное Белье-Юг</h1>
          <p className="admin-auth-showcase__text">
            Управляйте каталогом, заказами и контентом в одном защищенном интерфейсе.
          </p>
          <ul className="admin-auth-showcase__list">
            <li>Мобильная и десктопная адаптивность</li>
            <li>Безопасная авторизация через Keycloak</li>
            <li>Единый дизайн для всех разделов админки</li>
          </ul>
        </aside>

        <div className="admin-auth-card">
          <p className="admin-auth-card__eyebrow">Вход администратора</p>
          <h2 className="admin-auth-card__title">Добро пожаловать</h2>

          {status && (
            <div
              role="status"
              aria-live="polite"
              className={`admin-auth-alert ${
                status.type === 'success'
                  ? 'admin-auth-alert--success'
                  : 'admin-auth-alert--error'
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted">
              Авторизация выполняется через Keycloak.
            </p>
            {!keycloakReady && (
              <p className="text-sm text-red-600">
                Keycloak не настроен. Проверьте переменные окружения.
              </p>
            )}
            <button
              type="button"
              className="button w-full"
              onClick={handleKeycloakLogin}
              disabled={isSubmitting || !keycloakReady}
            >
              {isSubmitting ? 'Перенаправляем…' : 'Войти через Keycloak'}
            </button>
          </div>

          {isReady && isAuthenticated && !isAdmin && !isManager && (
            <p className="mt-4 text-sm text-red-600">
              У вашей учётной записи нет прав администратора или менеджера.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminLoginPage;

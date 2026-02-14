import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isKeycloakConfigured, login as keycloakLogin } from '../auth/keycloak';

function ManagerLoginPage() {
  const location = useLocation();
  const redirectTo = (location.state && location.state.from) || '/account';
  const { isAuthenticated, isReady, hasRole, hasStrongAuth } = useAuth();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);
  const hasStrongSession = isAuthenticated && hasStrongAuth();
  const useKeycloak = isKeycloakConfigured();

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/account';
    if (!path.startsWith('/') || path.startsWith('//')) return '/account';
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
        redirectUri: buildRedirectUri(safeRedirectPath(redirectTo)),
        prompt: 'login'
      });
    } catch (err) {
      console.error('Keycloak login failed:', err);
      setStatus({ type: 'error', message: 'Не удалось открыть страницу входа.' });
      setIsSubmitting(false);
    }
  };

  if (isReady && isManager && hasStrongSession) {
    return <Navigate to={safeRedirectPath(redirectTo)} replace />;
  }

  return (
    <section className="admin-auth-page">
      <div className="admin-auth-grid">
        <aside className="admin-auth-showcase" aria-hidden="true">
          <p className="admin-auth-showcase__eyebrow">Manager access</p>
          <h1 className="admin-auth-showcase__title">Кабинет менеджера Постельное Белье-Юг</h1>
          <p className="admin-auth-showcase__text">
            Отправляйте ссылки на оплату, отслеживайте сделки и управляйте заказами клиентов.
          </p>
          <ul className="admin-auth-showcase__list">
            <li>Сводка по вашим продажам и заказам</li>
            <li>Быстрая генерация ссылок на оплату</li>
            <li>Доступ к истории ваших заказов</li>
          </ul>
        </aside>

        <div className="admin-auth-card">
          <p className="admin-auth-card__eyebrow">Вход менеджера</p>
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

          {useKeycloak ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Авторизация выполняется через Keycloak.
              </p>
              <button
                type="button"
                className="button w-full"
                onClick={handleKeycloakLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Перенаправляем…' : 'Войти через Keycloak'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-red-600">
              Keycloak не настроен. Для входа менеджера требуется Keycloak.
            </p>
          )}

          {isReady && isAuthenticated && (!isManager || !hasStrongSession) && (
            <p className="mt-4 text-sm text-red-600">
              {!hasStrongSession
                ? 'Для доступа требуется подтвержденный e-mail и MFA.'
                : 'У вашей учётной записи нет прав менеджера.'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default ManagerLoginPage;

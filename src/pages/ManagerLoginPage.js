import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import NotificationBanner from '../components/NotificationBanner';
import { useAuth } from '../contexts/AuthContext';
import { isKeycloakConfigured, login as keycloakLogin } from '../auth/keycloak';
import { buildAbsoluteAppUrl } from '../utils/url';

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

  const handleKeycloakLogin = async () => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      await keycloakLogin({
        redirectUri: buildAbsoluteAppUrl(safeRedirectPath(redirectTo)),
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
          <p className="admin-auth-showcase__eyebrow">Доступ менеджера</p>
          <h1 className="admin-auth-showcase__title">Кабинет менеджера Постельное Белье-ЮГ</h1>
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

          {status ? <NotificationBanner notification={status} className="mb-4" /> : null}

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
            <NotificationBanner
              notification={{
                type: 'error',
                title: 'Keycloak не настроен',
                message: 'Для входа менеджера требуется настроенный Keycloak.'
              }}
            />
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

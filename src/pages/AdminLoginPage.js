import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import NotificationBanner from '../components/NotificationBanner';
import { useAuth } from '../contexts/AuthContext';
import { isKeycloakConfigured, login as keycloakLogin } from '../auth/keycloak';
import { buildAbsoluteAppUrl } from '../utils/url';
import { readEnv } from '../config/runtime';

function AdminLoginPage() {
  const location = useLocation();
  const redirectTo = (location.state && location.state.from) || '/admin';
  const { isAuthenticated, isReady, hasRole, hasStrongAuth } = useAuth();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const adminRole = readEnv('REACT_APP_KEYCLOAK_ADMIN_ROLE', 'admin') || 'admin';
  const managerRole = readEnv('REACT_APP_KEYCLOAK_MANAGER_ROLE', 'manager') || 'manager';
  const isAdmin = isAuthenticated && hasRole(adminRole);
  const isManager = isAuthenticated && hasRole(managerRole);
  const hasStrongSession = isAuthenticated && hasStrongAuth();
  const keycloakReady = isKeycloakConfigured();

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/admin';
    if (!path.startsWith('/') || path.startsWith('//')) return '/admin';
    return path;
  };

  const handleKeycloakLogin = async () => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      await keycloakLogin({
        redirectUri: buildAbsoluteAppUrl('/admin/login'),
        prompt: 'login'
      });
    } catch (err) {
      console.error('Keycloak login failed:', err);
      setStatus({ type: 'error', message: 'Не удалось открыть страницу входа.' });
      setIsSubmitting(false);
    }
  };

  if (isReady && isAuthenticated) {
    if (isAdmin && hasStrongSession) {
      return <Navigate to={safeRedirectPath(redirectTo)} replace />;
    }
    if (isManager && hasStrongSession) {
      return <Navigate to="/account" replace />;
    }
  }

  return (
    <main className="admin-auth-page">
      <a
        href="#admin-login-card"
        className="sr-only fixed left-3 top-3 z-[210] rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink shadow-[0_14px_28px_rgba(43,39,34,0.16)] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-primary/40"
        onClick={() => {
          window.requestAnimationFrame(() => {
            document.getElementById('admin-login-title')?.focus();
          });
        }}
      >
        Перейти к форме входа
      </a>
      <div className="admin-auth-grid">
        <aside className="admin-auth-showcase" aria-hidden="true">
          <p className="admin-auth-showcase__eyebrow">Защищённая зона</p>
          <h2 className="admin-auth-showcase__title">Панель управления Постельное Белье-ЮГ</h2>
          <p className="admin-auth-showcase__text">
            Управляйте каталогом, заказами и контентом в одном защищенном интерфейсе.
          </p>
          <ul className="admin-auth-showcase__list">
            <li>Мобильная и десктопная адаптивность</li>
            <li>Безопасная авторизация через Keycloak</li>
            <li>Единый дизайн для всех разделов админки</li>
          </ul>
        </aside>

        <section
          id="admin-login-card"
          className="admin-auth-card"
          aria-labelledby="admin-login-title"
          aria-describedby="admin-login-description"
        >
          <p className="admin-auth-card__eyebrow">Вход администратора</p>
          <h1 id="admin-login-title" tabIndex={-1} className="admin-auth-card__title">
            Войти в админ-панель
          </h1>

          {status ? <NotificationBanner notification={status} className="mb-4" /> : null}

          <div className="space-y-4">
            <p id="admin-login-description" className="text-sm text-muted">
              Авторизация выполняется через Keycloak.
            </p>
            {!keycloakReady ? (
              <NotificationBanner
                notification={{
                  type: 'error',
                  title: 'Keycloak не настроен',
                  message: 'Проверьте переменные окружения перед входом.'
                }}
                className="mb-3"
              />
            ) : null}
            <button
              type="button"
              className="button w-full"
              onClick={handleKeycloakLogin}
              disabled={isSubmitting || !keycloakReady}
            >
              {isSubmitting ? 'Перенаправляем…' : 'Войти через Keycloak'}
            </button>
          </div>

          {isReady && isAuthenticated && ((!isAdmin && !isManager) || !hasStrongSession) && (
            <p className="mt-4 text-sm text-red-600">
              {!hasStrongSession
                ? 'Для доступа требуется подтвержденный e-mail и MFA.'
                : 'У вашей учётной записи нет прав администратора или менеджера.'}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminLoginPage;

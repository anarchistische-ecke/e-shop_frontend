import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginAdmin } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { isKeycloakConfigured, login as keycloakLogin } from '../auth/keycloak';

function AdminLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = (location.state && location.state.from) || '/admin';
  const { isAuthenticated, isReady, hasRole, login } = useAuth();
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const adminRole = process.env.REACT_APP_KEYCLOAK_ADMIN_ROLE || 'admin';
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isAdmin = isAuthenticated && hasRole(adminRole);
  const isManager = isAuthenticated && hasRole(managerRole);
  const useKeycloak = isKeycloakConfigured();

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

  const handleChange = (field) => (event) => {
    setCredentials((prev) => ({ ...prev, [field]: event.target.value }));
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    if (useKeycloak) {
      await handleKeycloakLogin();
      return;
    }
    if (!credentials.username.trim() || !credentials.password) {
      setStatus({ type: 'error', message: 'Введите логин и пароль администратора.' });
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await loginAdmin(credentials.username.trim(), credentials.password);
      const token =
        (typeof response === 'string' ? response : null) ||
        response?.token ||
        response?.access_token ||
        response?.accessToken ||
        response?.id_token ||
        response?.idToken ||
        response?.token?.access_token ||
        response?.token?.accessToken ||
        response?.token?.token ||
        response?.token?.id_token ||
        response?.token?.idToken ||
        '';
      if (!token) {
        setStatus({
          type: 'error',
          message: 'Не удалось получить токен. Проверьте настройки авторизации.'
        });
        return;
      }
      await login({ token, profile: { username: credentials.username.trim() } });
      navigate(safeRedirectPath(redirectTo), { replace: true });
    } catch (err) {
      console.error('Admin login failed:', err);
      setStatus({ type: 'error', message: 'Неверные учетные данные.' });
    } finally {
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
          <h1 className="admin-auth-showcase__title">Панель управления CozyHome</h1>
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
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="admin-username" className="block text-sm font-medium text-ink/80">
                  Логин
                </label>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  value={credentials.username}
                  onChange={handleChange('username')}
                  placeholder="admin"
                  className="mt-2 w-full"
                />
              </div>

              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-ink/80">
                  Пароль
                </label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={handleChange('password')}
                  placeholder="Введите пароль"
                  className="mt-2 w-full"
                />
              </div>

              <button type="submit" className="button w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Входим…' : 'Войти в админ-панель'}
              </button>
            </form>
          )}

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

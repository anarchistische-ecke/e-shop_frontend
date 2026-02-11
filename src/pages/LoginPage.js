import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isKeycloakConfigured, login as keycloakLogin } from '../auth/keycloak';

function LoginPage() {
  const location = useLocation();
  const redirectTo = location.state?.from || '/account';
  const { isAuthenticated, isReady } = useAuth();

  const [mode, setMode] = useState('signin');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const keycloakReady = isKeycloakConfigured();
  const yandexIdp = process.env.REACT_APP_KEYCLOAK_IDP_YANDEX || '';
  const vkIdp = process.env.REACT_APP_KEYCLOAK_IDP_VK || '';

  const isSignupMode = mode === 'signup';

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/';
    if (!path.startsWith('/') || path.startsWith('//')) return '/';
    return path;
  };

  const buildRedirectUri = (path) => {
    if (typeof window === 'undefined') return undefined;
    const rawBase = process.env.REACT_APP_BASENAME || process.env.PUBLIC_URL || '';
    const base = rawBase.replace(/\/$/, '');
    const normalizedBase = base && base !== '/' ? base : '';
    return `${window.location.origin}${normalizedBase}${path}`;
  };

  const handleKeycloakLogin = async (options = {}) => {
    setStatus(null);
    if (!keycloakReady) {
      setStatus({ type: 'error', message: 'Keycloak не настроен. Проверьте переменные окружения.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await keycloakLogin({
        redirectUri: buildRedirectUri(safeRedirectPath(redirectTo)),
        ...options
      });
    } catch (err) {
      console.error('Keycloak login failed:', err);
      setStatus({ type: 'error', message: 'Не удалось открыть страницу входа.' });
      setIsSubmitting(false);
    }
  };

  if (isReady && isAuthenticated) {
    return <Navigate to={safeRedirectPath(redirectTo)} replace />;
  }

  return (
    <div className="login-page py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto soft-card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent">Личный кабинет</p>
              <h1 className="text-2xl sm:text-3xl font-semibold">
                {mode === 'signin' ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
              </h1>
              <p className="text-muted text-sm mt-1">
                Управляйте заказами, бонусами и адресами доставки в одном месте.
              </p>
            </div>
            <span className="px-3 py-1 bg-sand/60 text-xs font-semibold rounded-2xl border border-primary/30">
              Безопасное соединение
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                !isSignupMode ? 'bg-primary text-white' : 'bg-white/85 border border-ink/10'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                isSignupMode ? 'bg-primary text-white' : 'bg-white/85 border border-ink/10'
              }`}
            >
              Регистрация
            </button>
          </div>

          {status && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                status.type === 'success'
                  ? 'border-green-300 bg-green-50 text-green-800'
                  : 'border-red-300 bg-red-50 text-red-800'
              }`}
            >
              {status.message}
            </div>
          )}
          {!keycloakReady && (
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              Keycloak не настроен. Проверьте переменные окружения.
            </div>
          )}

          {mode === 'signin' ? (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-ink/10 bg-white/80 p-4 text-sm text-muted">
                Авторизация выполняется через Keycloak. После входа вы вернетесь в личный кабинет.
              </div>
              <button
                type="button"
                className="button"
                onClick={() => handleKeycloakLogin()}
                disabled={isSubmitting || !keycloakReady}
              >
                {isSubmitting ? 'Перенаправляем…' : 'Войти через Keycloak'}
              </button>
              {(yandexIdp || vkIdp) && (
                <div className="flex flex-wrap gap-3">
                  {yandexIdp && (
                    <button
                      type="button"
                      className="button-gray"
                      onClick={() => handleKeycloakLogin({ idpHint: yandexIdp })}
                      disabled={isSubmitting || !keycloakReady}
                    >
                      Войти через Яндекс
                    </button>
                  )}
                  {vkIdp && (
                    <button
                      type="button"
                      className="button-gray"
                      onClick={() => handleKeycloakLogin({ idpHint: vkIdp })}
                      disabled={isSubmitting || !keycloakReady}
                    >
                      Войти через VK
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-ink/10 bg-white/80 p-4 text-sm text-muted">
                Регистрация и подтверждение e-mail выполняются в Keycloak.
              </div>
              <button
                type="button"
                className="button"
                onClick={() => handleKeycloakLogin({ action: 'register' })}
                disabled={isSubmitting || !keycloakReady}
              >
                {isSubmitting ? 'Перенаправляем…' : 'Создать аккаунт'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

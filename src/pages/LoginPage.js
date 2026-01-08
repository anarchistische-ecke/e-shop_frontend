import React, { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const location = useLocation();
  const redirectTo = location.state?.from || '/';
  const { isAuthenticated, isReady, isConfigured, login } = useAuth();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const yandexIdp = useMemo(
    () => process.env.REACT_APP_KEYCLOAK_IDP_YANDEX || 'yandex',
    []
  );
  const vkIdp = useMemo(
    () => process.env.REACT_APP_KEYCLOAK_IDP_VK || 'vk',
    []
  );

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/';
    if (!path.startsWith('/') || path.startsWith('//')) return '/';
    return path;
  };

  const buildRedirectUri = () => {
    if (typeof window === 'undefined') return undefined;
    const safePath = safeRedirectPath(redirectTo);
    return `${window.location.origin}${safePath}`;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    try {
      if (!isConfigured) {
        throw new Error('Keycloak is not configured');
      }
      await login({
        redirectUri: buildRedirectUri(),
        loginHint: email || undefined,
        prompt: 'login'
      });
    } catch (err) {
      console.error('Failed to start Keycloak login:', err);
      setStatus({
        type: 'error',
        message: 'Не удалось открыть страницу входа. Проверьте настройки Keycloak.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const redirectToProvider = async (provider) => {
    const idpHint = provider === 'yandex' ? yandexIdp : vkIdp;
    if (!idpHint) {
      setStatus({
        type: 'error',
        message: 'Провайдер входа не настроен. Проверьте alias в Keycloak.'
      });
      return;
    }
    try {
      if (!isConfigured) {
        throw new Error('Keycloak is not configured');
      }
      await login({
        redirectUri: buildRedirectUri(),
        idpHint
      });
    } catch (err) {
      console.error('Failed to start social login:', err);
      setStatus({
        type: 'error',
        message: 'Не удалось открыть страницу входа. Проверьте настройки Keycloak.'
      });
    }
  };

  if (isReady && isAuthenticated) {
    return <Navigate to={safeRedirectPath(redirectTo)} replace />;
  }

  return (
    <div className="login-page py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto soft-card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent">Вход в аккаунт</p>
              <h1 className="text-2xl sm:text-3xl font-semibold">Выберите удобный способ авторизации</h1>
              <p className="text-muted text-sm mt-1">
                Мы поддерживаем почту с паролем, Yandex ID и VK ID.
              </p>
            </div>
            <span className="px-3 py-1 bg-secondary text-xs font-semibold rounded-full border border-primary/30">
              Безопасное соединение
            </span>
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
          {!isConfigured && (
            <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
              Keycloak не настроен. Заполните переменные окружения и перезапустите приложение.
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 border border-ink/10 rounded-2xl bg-white/90 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">По e‑mail и паролю</h2>
              <p className="text-sm text-muted mb-4">
                Вы перейдёте на защищённую страницу Keycloak и введёте пароль там.
              </p>
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-muted block mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-3 border border-ink/10 rounded-xl w-full focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="button text-center"
                  disabled={isSubmitting || !isConfigured}
                >
                  {isSubmitting ? 'Открываем вход…' : 'Войти через Keycloak'}
                </button>
              </form>
            </div>

            <div className="p-5 border border-ink/10 rounded-2xl bg-white/90 shadow-sm flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Войти через соцсети</h3>
                <p className="text-sm text-muted">
                  Имя и фамилия подтянутся из профиля — заполнять их вручную не нужно.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => redirectToProvider('yandex')}
                  disabled={!isConfigured}
                  aria-label="Войти с Яндекс ID"
                  className="flex-1 flex items-center justify-center gap-3 rounded-xl bg-black text-white py-3 px-4 shadow-sm transition hover:bg-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCC00] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="h-8 w-8 rounded-full bg-[#FFCC00] flex items-center justify-center text-black font-bold text-base leading-none">
                    Я
                  </span>
                  <span className="text-sm font-semibold tracking-wide">Войти с Яндекс ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => redirectToProvider('vk')}
                  disabled={!isConfigured}
                  className="flex-1 flex items-center justify-center gap-2 border border-ink/10 rounded-2xl py-3 px-4 hover:shadow-sm hover:-translate-y-0.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="h-10 w-10 rounded-full bg-[#2787F5] flex items-center justify-center text-white font-semibold text-lg">
                    VK
                  </span>
                  <span className="text-sm text-left">
                    <span className="block font-semibold">VK ID</span>
                    <span className="text-muted">Перейти на страницу входа</span>
                  </span>
                </button>
              </div>
              <p className="text-xs text-muted">
                После подтверждения мы вернём вас в магазин. Если что-то не работает — уточните
                client id и redirect uri в переменных окружения.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

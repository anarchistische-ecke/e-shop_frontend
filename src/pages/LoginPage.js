import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginCustomer } from '../api';
import { notifyAuthChange } from '../utils/auth';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const yandexAuthUrl = useMemo(() => {
    const clientId = process.env.REACT_APP_YANDEX_CLIENT_ID || '';
    const redirectUri =
      process.env.REACT_APP_YANDEX_REDIRECT_URI || `${window.location.origin}/oauth/yandex/callback`;
    return clientId
      ? `https://oauth.yandex.ru/authorize?response_type=token&client_id=${encodeURIComponent(
          clientId
        )}&redirect_uri=${encodeURIComponent(redirectUri)}`
      : null;
  }, []);

  const vkAuthUrl = useMemo(() => {
    const clientId = process.env.REACT_APP_VK_CLIENT_ID || '';
    const redirectUri =
      process.env.REACT_APP_VK_REDIRECT_URI || `${window.location.origin}/oauth/vk/callback`;
    return clientId
      ? `https://oauth.vk.com/authorize?client_id=${encodeURIComponent(
          clientId
        )}&display=page&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=token&v=5.199&scope=email`
      : null;
  }, []);

  const handleAuthSuccess = (message) => {
    notifyAuthChange({ type: 'user', action: 'login' });
    setStatus({ type: 'success', message });
    navigate(redirectTo, { replace: true });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    try {
      const result = await loginCustomer(email, password);
      localStorage.setItem('userToken', result.token);
      handleAuthSuccess('Вход выполнен по почте и паролю');
    } catch (err) {
      console.error('Failed to login customer:', err);
      setStatus({ type: 'error', message: 'Не удалось войти. Проверьте почту и пароль.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const redirectToProvider = (provider) => {
    const url = provider === 'yandex' ? yandexAuthUrl : vkAuthUrl;
    if (!url) {
      setStatus({
        type: 'error',
        message: 'OAuth настроен не полностью. Проверьте client id/redirect uri.'
      });
      return;
    }
    window.location.href = url;
  };

  return (
    <div className="login-page py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white/80 border border-primary/20 shadow-xl rounded-2xl p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent">Вход в аккаунт</p>
              <h1 className="text-3xl font-semibold">Выберите удобный способ авторизации</h1>
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

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 border border-secondary rounded-xl bg-white shadow-sm">
              <h2 className="text-xl font-semibold mb-2">По e‑mail и паролю</h2>
              <p className="text-sm text-muted mb-4">
                Классический вход, подходит для клиентов без социальных аккаунтов.
              </p>
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-muted block mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-3 border border-gray-300 rounded w-full focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">Пароль</label>
                  <input
                    type="password"
                    placeholder="Пароль"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="p-3 border border-gray-300 rounded w-full focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <button type="submit" className="button text-center" disabled={isSubmitting}>
                  {isSubmitting ? 'Входим…' : 'Войти'}
                </button>
              </form>
            </div>

            <div className="p-5 border border-primary/30 rounded-xl bg-white shadow-sm flex flex-col justify-between gap-4">
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
                  className="flex-1 flex items-center justify-center gap-2 border border-primary/30 rounded-lg py-3 px-4 hover:shadow-sm hover:-translate-y-0.5 transition"
                >
                  <span className="h-10 w-10 rounded-full bg-[#fcec4f] flex items-center justify-center text-black font-semibold text-lg">
                    Я
                  </span>
                  <span className="text-sm text-left">
                    <span className="block font-semibold">Yandex ID</span>
                    <span className="text-muted">Войти и разрешить доступ</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => redirectToProvider('vk')}
                  className="flex-1 flex items-center justify-center gap-2 border border-primary/30 rounded-lg py-3 px-4 hover:shadow-sm hover:-translate-y-0.5 transition"
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

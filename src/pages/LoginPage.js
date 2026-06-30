import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import NotificationBanner from '../components/NotificationBanner';
import Seo from '../components/Seo';
import { Button, Card, Input } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { buildAbsoluteAppUrl } from '../utils/url';
import { CART_SESSION_STRATEGY } from '../utils/account';
import { requestMagicLink } from '../api';

function LoginPage() {
  const location = useLocation();
  const redirectTo = location.state?.from || '/account';
  const { isAuthenticated, isReady } = useAuth();

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/';
    if (!path.startsWith('/') || path.startsWith('//')) return '/';
    return path;
  };

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const safeRedirectTarget = safeRedirectPath(redirectTo);
  const returnsToCheckout = safeRedirectTarget.startsWith('/checkout');

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const maskedEmail = useMemo(() => {
    const [name = '', domain = ''] = normalizedEmail.split('@');
    if (!name || !domain) return normalizedEmail;
    const visible = name.length <= 2 ? name[0] || '' : `${name.slice(0, 2)}***`;
    return `${visible}@${domain}`;
  }, [normalizedEmail]);

  const handleMagicLink = async (event) => {
    event.preventDefault();
    setStatus(null);
    if (!isEmailValid) {
      setStatus({ type: 'error', message: 'Введите корректную электронную почту.' });
      return;
    }
    if (cooldown > 0) {
      return;
    }
    setIsSubmitting(true);
    try {
      await requestMagicLink({
        email: normalizedEmail,
        redirectUri: buildAbsoluteAppUrl(safeRedirectTarget)
      });
      setCooldown(60);
      setStatus({
        type: 'success',
        title: 'Ссылка отправлена',
        message: `Проверьте почту ${maskedEmail}. Ссылка действует 15 минут.`
      });
    } catch (err) {
      console.error('Magic link request failed:', err);
      setStatus({
        type: 'error',
        title: 'Не удалось отправить ссылку',
        message: err?.message || 'Попробуйте ещё раз позже.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReady && isAuthenticated) {
    return <Navigate to={safeRedirectTarget} replace />;
  }

  return (
    <div className="login-page py-8 md:py-10">
      <Seo
        title="Вход в личный кабинет"
        description="Войдите, чтобы сохранить данные для следующих покупок, видеть историю заказов и быстрее оформлять новые."
        canonicalPath="/login"
        robots="noindex,nofollow"
      />
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-4xl" padding="lg">
          <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent">Личный кабинет</p>
              <h1 className="text-2xl sm:text-3xl font-semibold">Войдите в аккаунт</h1>
              <p className="text-muted text-sm mt-1">
                Войдите или зарегистрируйтесь, чтобы сохранять данные для следующих покупок, отслеживать заказы и возвращаться к оформлению без лишних шагов.
              </p>
              {returnsToCheckout ? (
                <NotificationBanner
                  notification={{
                    type: 'info',
                    title: 'Оформление как гость уже доступно',
                    message:
                      `${CART_SESSION_STRATEGY.loginMessage} После входа вы вернётесь к оформлению.`
                  }}
                  className="mt-4"
                />
              ) : null}
            </div>

            <Card variant="quiet" padding="sm" className="bg-white/85 shadow-none">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-primary">Зачем входить</p>
                <span className="px-3 py-1 bg-sand/60 text-xs font-semibold rounded-2xl border border-primary/30">
                  Безопасное соединение
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">Сохраните данные для следующего заказа</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {CART_SESSION_STRATEGY.loginBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/80" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {status ? <NotificationBanner notification={status} className="mb-6" /> : null}
          <form onSubmit={handleMagicLink} className="space-y-3">
            <label className="block text-sm">
              <span className="text-muted">Электронная почта</span>
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (status?.type === 'error') setStatus(null);
                }}
                placeholder="pochta@example.ru"
                className="mt-2 !min-h-[52px]"
                disabled={isSubmitting}
              />
            </label>
            <Button
              type="submit"
              block
              className="!min-h-[52px]"
              disabled={isSubmitting || cooldown > 0}
            >
              {isSubmitting
                ? 'Отправляем...'
                : cooldown > 0
                ? `Повторно через ${cooldown} с`
                : 'Получить ссылку для входа'}
            </Button>
            {status?.type === 'success' ? (
              <Button
                as="a"
                href={`mailto:${normalizedEmail}`}
                variant="secondary"
                block
              >
                Открыть почту
              </Button>
            ) : null}
          </form>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;

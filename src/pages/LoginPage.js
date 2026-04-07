import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import NotificationBanner from '../components/NotificationBanner';
import { Button, Card } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { isKeycloakConfigured, login as keycloakLogin } from '../auth/keycloak';
import { buildAbsoluteAppUrl } from '../utils/url';
import { CART_SESSION_STRATEGY } from '../utils/account';

function LoginPage() {
  const location = useLocation();
  const redirectTo = location.state?.from || '/account';
  const { isAuthenticated, isReady } = useAuth();

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/';
    if (!path.startsWith('/') || path.startsWith('//')) return '/';
    return path;
  };

  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const keycloakReady = isKeycloakConfigured();
  const safeRedirectTarget = safeRedirectPath(redirectTo);
  const returnsToCheckout = safeRedirectTarget.startsWith('/checkout');

  const handleKeycloakLogin = async () => {
    setStatus(null);
    if (!keycloakReady) {
      setStatus({ type: 'error', message: 'Сервис входа временно недоступен. Попробуйте позже.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await keycloakLogin({
        redirectUri: buildAbsoluteAppUrl(safeRedirectTarget)
      });
    } catch (err) {
      console.error('Login redirect failed:', err);
      setStatus({ type: 'error', message: 'Не удалось открыть страницу входа.' });
      setIsSubmitting(false);
    }
  };

  if (isReady && isAuthenticated) {
    return <Navigate to={safeRedirectTarget} replace />;
  }

  return (
    <div className="login-page py-8 md:py-10">
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-4xl" padding="lg">
          <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent">Личный кабинет</p>
              <h1 className="text-2xl sm:text-3xl font-semibold">Войдите в аккаунт</h1>
              <p className="text-muted text-sm mt-1">
                Сохраняйте данные для следующих покупок, отслеживайте заказы и возвращайтесь к оформлению без лишних шагов.
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
          {!keycloakReady ? (
            <NotificationBanner
              notification={{
                type: 'error',
                title: 'Сервис входа временно недоступен',
                message: 'Попробуйте позже.'
              }}
              className="mb-6"
            />
          ) : null}

          <Button
            block
            onClick={handleKeycloakLogin}
            disabled={isSubmitting || !keycloakReady}
          >
            {isSubmitting ? 'Перенаправляем…' : 'Войти'}
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;

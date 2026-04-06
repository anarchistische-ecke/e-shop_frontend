import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import NotificationBanner from '../components/NotificationBanner';
import { Button, Card } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { isKeycloakConfigured, login as keycloakLogin } from '../auth/keycloak';
import { buildAbsoluteAppUrl } from '../utils/url';

function LoginPage() {
  const location = useLocation();
  const redirectTo = location.state?.from || '/account';
  const { isAuthenticated, isReady } = useAuth();

  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const keycloakReady = isKeycloakConfigured();

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/';
    if (!path.startsWith('/') || path.startsWith('//')) return '/';
    return path;
  };

  const handleKeycloakLogin = async () => {
    setStatus(null);
    if (!keycloakReady) {
      setStatus({ type: 'error', message: 'Сервис входа временно недоступен. Попробуйте позже.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await keycloakLogin({
        redirectUri: buildAbsoluteAppUrl(safeRedirectPath(redirectTo))
      });
    } catch (err) {
      console.error('Login redirect failed:', err);
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
        <Card className="mx-auto max-w-4xl" padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent">Личный кабинет</p>
              <h1 className="text-2xl sm:text-3xl font-semibold">Войдите в аккаунт</h1>
              <p className="text-muted text-sm mt-1">
                Управляйте заказами, бонусами и адресами доставки в одном месте.
              </p>
            </div>
            <span className="px-3 py-1 bg-sand/60 text-xs font-semibold rounded-2xl border border-primary/30">
              Безопасное соединение
            </span>
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

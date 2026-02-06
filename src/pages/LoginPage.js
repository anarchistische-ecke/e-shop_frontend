import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  loginCustomer,
  registerCustomer,
  requestEmailVerification,
  confirmEmailVerification
} from '../api';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = location.state?.from || '/account';
  const { isAuthenticated, isReady, login, refreshProfile } = useAuth();

  const [mode, setMode] = useState('signin');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [signinForm, setSigninForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [pendingVerification, setPendingVerification] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');

  const isSignupMode = mode !== 'signin';

  const safeRedirectPath = (path) => {
    if (typeof path !== 'string') return '/';
    if (!path.startsWith('/') || path.startsWith('//')) return '/';
    return path;
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setStatus(null);
    if (nextMode !== 'verify') {
      setPendingVerification(null);
      setVerificationCode('');
    }
  };

  const resolveVerificationEmail = () =>
    pendingVerification?.email || signupForm.email.trim();

  const resolveVerificationPassword = () =>
    pendingVerification?.password || signupForm.password;

  const verificationEmail = resolveVerificationEmail();

  const handleSigninChange = (field) => (event) => {
    setSigninForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSignupChange = (field) => (event) => {
    setSignupForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setStatus(null);
    const email = signinForm.email.trim();
    const password = signinForm.password;
    if (!email || !password) {
      setStatus({ type: 'error', message: 'Введите e-mail и пароль.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await loginCustomer(email, password);
      await login({ token: response?.token, profile: response?.customer || null });
      await refreshProfile();
      navigate(safeRedirectPath(redirectTo), { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      setStatus({ type: 'error', message: 'Неверный e-mail или пароль.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setStatus(null);
    const payload = {
      firstName: signupForm.firstName.trim(),
      lastName: signupForm.lastName.trim(),
      email: signupForm.email.trim(),
      password: signupForm.password,
      phone: signupForm.phone.trim() || undefined
    };
    if (!payload.firstName || !payload.lastName || !payload.email || !payload.password) {
      setStatus({ type: 'error', message: 'Заполните имя, фамилию, e-mail и пароль.' });
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setStatus({ type: 'error', message: 'Пароли не совпадают.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await registerCustomer(payload);
      const email = payload.email;
      setPendingVerification({ email, password: payload.password });
      setMode('verify');
      setIsSendingCode(true);
      try {
        await requestEmailVerification(email);
        setStatus({
          type: 'success',
          message: `Мы отправили код подтверждения на ${email}.`
        });
      } catch (err) {
        console.error('Failed to send verification code:', err);
        setStatus({
          type: 'error',
          message: 'Аккаунт создан, но письмо с кодом не отправлено. Попробуйте повторить отправку.'
        });
      } finally {
        setIsSendingCode(false);
      }
    } catch (err) {
      console.error('Signup failed:', err);
      setStatus({ type: 'error', message: 'Не удалось создать аккаунт. Проверьте данные.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setStatus(null);
    const email = resolveVerificationEmail();
    const code = verificationCode.trim();
    if (!email) {
      setStatus({ type: 'error', message: 'Укажите e-mail, чтобы подтвердить аккаунт.' });
      return;
    }
    if (!code) {
      setStatus({ type: 'error', message: 'Введите код из письма.' });
      return;
    }
    setIsVerifying(true);
    try {
      const password = resolveVerificationPassword();
      await confirmEmailVerification(email, code, password);
      if (password) {
        const response = await loginCustomer(email, password);
        await login({ token: response?.token, profile: response?.customer || null });
        await refreshProfile();
        navigate(safeRedirectPath(redirectTo), { replace: true });
        return;
      }
      setStatus({
        type: 'success',
        message: 'Почта подтверждена. Войдите в аккаунт.'
      });
      setPendingVerification(null);
      setVerificationCode('');
      setMode('signin');
    } catch (err) {
      console.error('Email verification failed:', err);
      setStatus({ type: 'error', message: 'Неверный или просроченный код.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setStatus(null);
    const email = resolveVerificationEmail();
    if (!email) {
      setStatus({ type: 'error', message: 'Укажите e-mail, чтобы отправить код.' });
      return;
    }
    setIsSendingCode(true);
    try {
      await requestEmailVerification(email);
      setStatus({
        type: 'success',
        message: `Новый код отправлен на ${email}.`
      });
    } catch (err) {
      console.error('Failed to resend verification code:', err);
      setStatus({ type: 'error', message: 'Не удалось отправить код. Повторите позже.' });
    } finally {
      setIsSendingCode(false);
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
                {mode === 'signin'
                  ? 'Войдите в аккаунт'
                  : mode === 'verify'
                    ? 'Подтвердите e-mail'
                    : 'Создайте аккаунт'}
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
              onClick={() => switchMode('signin')}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                !isSignupMode ? 'bg-primary text-white' : 'bg-white/85 border border-ink/10'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
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

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-muted block mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={signinForm.email}
                  onChange={handleSigninChange('email')}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1">Пароль</label>
                <input
                  type="password"
                  placeholder="Введите пароль"
                  value={signinForm.password}
                  onChange={handleSigninChange('password')}
                  className="w-full"
                />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="button" disabled={isSubmitting}>
                  {isSubmitting ? 'Входим…' : 'Войти'}
                </button>
              </div>
            </form>
          ) : mode === 'verify' ? (
            <form onSubmit={handleVerifyEmail} className="grid gap-4">
              <div className="rounded-2xl border border-ink/10 bg-white/80 p-4 text-sm text-muted">
                {verificationEmail ? (
                  <>
                    Мы отправили код на <span className="font-semibold text-ink">{verificationEmail}</span>.
                    Введите его, чтобы активировать аккаунт.
                  </>
                ) : (
                  'Проверьте почту и введите код подтверждения, чтобы активировать аккаунт.'
                )}
              </div>
              <div>
                <label className="text-sm text-muted block mb-1">Код из письма</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Введите 6-значный код"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="button" disabled={isVerifying}>
                  {isVerifying ? 'Проверяем…' : 'Подтвердить'}
                </button>
                <button
                  type="button"
                  className="button-gray"
                  onClick={handleResendCode}
                  disabled={isSendingCode}
                >
                  {isSendingCode ? 'Отправляем…' : 'Отправить код ещё раз'}
                </button>
                <button
                  type="button"
                  className="button-ghost"
                  onClick={() => switchMode('signup')}
                >
                  Изменить e-mail
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-muted block mb-1">Имя</label>
                <input
                  type="text"
                  placeholder="Ольга"
                  value={signupForm.firstName}
                  onChange={handleSignupChange('firstName')}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1">Фамилия</label>
                <input
                  type="text"
                  placeholder="Павленко"
                  value={signupForm.lastName}
                  onChange={handleSignupChange('lastName')}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={signupForm.email}
                  onChange={handleSignupChange('email')}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1">Телефон (опционально)</label>
                <input
                  type="tel"
                  placeholder="+7 (999) 000-00-00"
                  value={signupForm.phone}
                  onChange={handleSignupChange('phone')}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1">Пароль</label>
                <input
                  type="password"
                  placeholder="Придумайте пароль"
                  value={signupForm.password}
                  onChange={handleSignupChange('password')}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1">Повторите пароль</label>
                <input
                  type="password"
                  placeholder="Повторите пароль"
                  value={signupForm.confirmPassword}
                  onChange={handleSignupChange('confirmPassword')}
                  className="w-full"
                />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="button" disabled={isSubmitting}>
                  {isSubmitting ? 'Создаём аккаунт…' : 'Создать аккаунт'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

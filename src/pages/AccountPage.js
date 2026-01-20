import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  getCustomerOrders,
  updateCustomerProfile,
  updateCustomerSubscription
} from '../api';
import { useAuth } from '../contexts/AuthContext';

const IconProfile = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const IconBonus = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M8 14l-1 7 5-3 5 3-1-7" />
  </svg>
);

const IconTicket = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 7h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9a2 2 0 0 1 2-2z" />
    <path d="M10 7v10" />
    <path d="M14 10h2" />
  </svg>
);

const IconUsers = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M14 20a4 4 0 0 1 7 0" />
  </svg>
);

const IconBag = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 7h12l-1 12H7L6 7z" />
    <path d="M9 7V6a3 3 0 0 1 6 0v1" />
  </svg>
);

const IconBox = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
    <path d="M3 7l9 4 9-4" />
    <path d="M12 11v10" />
  </svg>
);

const IconLogout = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
  </svg>
);

const PROFILE_SECTIONS = ['profile', 'addresses', 'events', 'subscriptions'];

const PROFILE_SUBMENU = [
  { id: 'addresses', label: 'Мои адреса' },
  { id: 'events', label: 'Уютные события' },
  { id: 'subscriptions', label: 'Управление подписками' }
];

const ACCOUNT_MENU = [
  { id: 'bonuses', label: 'Уютные бонусы', icon: IconBonus },
  { id: 'promocodes', label: 'Мои промокоды', icon: IconTicket },
  { id: 'referral', label: 'Приведи друга', icon: IconUsers },
  { id: 'orders', label: 'Мои заказы', icon: IconBag },
  { id: 'purchases', label: 'Купленные товары', icon: IconBox }
];

const SECTION_OPTIONS = [
  { id: 'profile', label: 'Профиль' },
  ...PROFILE_SUBMENU,
  ...ACCOUNT_MENU.map((item) => ({ id: item.id, label: item.label }))
];

const SECTION_IDS = [
  'profile',
  ...PROFILE_SUBMENU.map((item) => item.id),
  ...ACCOUNT_MENU.map((item) => item.id)
];

const SECTION_ID_SET = new Set(SECTION_IDS);

const SECTION_LABELS = {
  profile: 'Профиль',
  addresses: 'Мои адреса',
  events: 'Уютные события',
  subscriptions: 'Управление подписками',
  bonuses: 'Уютные бонусы',
  promocodes: 'Мои промокоды',
  referral: 'Приведи друга',
  orders: 'Мои заказы',
  purchases: 'Купленные товары'
};

function AccountPage() {
  const { isAuthenticated, isReady, tokenParsed, logout, refreshProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: 'female'
  });
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    setIsOrdersLoading(true);
    setOrdersError(null);
    getCustomerOrders()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data.slice() : [];
        list.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.orderDate || 0).getTime();
          const timeB = new Date(b.createdAt || b.orderDate || 0).getTime();
          return timeB - timeA;
        });
        setOrders(list);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to fetch orders:', err);
        setOrdersError('Не удалось загрузить заказы. Попробуйте позже.');
      })
      .finally(() => {
        if (mounted) setIsOrdersLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    setIsProfileLoading(true);
    refreshProfile()
      .then((data) => {
        if (!mounted || !data) return;
        setProfile((prev) => ({
          ...prev,
          firstName: data.firstName ?? prev.firstName,
          lastName: data.lastName ?? prev.lastName,
          phone: data.phone ?? prev.phone,
          email: data.email ?? prev.email,
          birthDate: data.birthDate ?? prev.birthDate,
          gender: data.gender ?? prev.gender ?? 'female'
        }));
        if (typeof data.marketingOptIn === 'boolean') {
          setIsSubscribed(data.marketingOptIn);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to fetch profile:', err);
      })
      .finally(() => {
        if (mounted) setIsProfileLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const derivedName = useMemo(() => {
    const fallback = tokenParsed?.name || tokenParsed?.preferred_username || '';
    const parts = fallback.split(' ').filter(Boolean);
    return {
      firstName: tokenParsed?.given_name || parts[0] || '',
      lastName: tokenParsed?.family_name || parts.slice(1).join(' ') || ''
    };
  }, [tokenParsed]);
  const referralCode = useMemo(() => {
    const seed = tokenParsed?.preferred_username || tokenParsed?.email || '';
    if (!seed) return 'COZY-LOVE';
    const base = seed.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `COZY-${base.slice(0, 6) || 'LOVE'}`;
  }, [tokenParsed]);

  useEffect(() => {
    if (!tokenParsed) return;
    setProfile((prev) => ({
      ...prev,
      firstName: prev.firstName || derivedName.firstName,
      lastName: prev.lastName || derivedName.lastName,
      phone:
        prev.phone ||
        tokenParsed?.phone_number ||
        tokenParsed?.phone ||
        tokenParsed?.phoneNumber ||
        '',
      email: prev.email || tokenParsed?.email || ''
    }));
  }, [derivedName, tokenParsed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      setActiveSection('profile');
      return;
    }
    if (SECTION_ID_SET.has(hash)) {
      setActiveSection(hash);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setActiveSection('profile');
        return;
      }
      if (SECTION_ID_SET.has(hash)) {
        setActiveSection(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const loyaltyPoints = orders.length * 120;
  const isProfileActive = PROFILE_SECTIONS.includes(activeSection);
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    tokenParsed?.name ||
    tokenParsed?.preferred_username ||
    'Ваш профиль';
  const displayPhone =
    profile.phone ||
    tokenParsed?.phone_number ||
    tokenParsed?.phone ||
    tokenParsed?.phoneNumber ||
    'Добавьте телефон';
  const activeLabel = SECTION_LABELS[activeSection] || 'Профиль';

  const handleProfileChange = (field) => (event) => {
    setProfile((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaveStatus('saving');
    setSaveMessage(null);
    try {
      const payload = {
        firstName: profile.firstName?.trim() || null,
        lastName: profile.lastName?.trim() || null,
        email: profile.email?.trim() || null,
        phone: profile.phone?.trim() || null,
        birthDate: profile.birthDate || null,
        gender: profile.gender || null
      };
      const updated = await updateCustomerProfile(payload);
      if (updated) {
        setProfile((prev) => ({
          ...prev,
          firstName: updated.firstName ?? prev.firstName,
          lastName: updated.lastName ?? prev.lastName,
          phone: updated.phone ?? prev.phone,
          email: updated.email ?? prev.email,
          birthDate: updated.birthDate ?? prev.birthDate,
          gender: updated.gender ?? prev.gender
        }));
        if (typeof updated.marketingOptIn === 'boolean') {
          setIsSubscribed(updated.marketingOptIn);
        }
      }
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveStatus('error');
      setSaveMessage('Не удалось сохранить данные. Попробуйте ещё раз.');
    }
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', `#${section}`);
    }
  };

  const handleLogout = () => {
    if (typeof window === 'undefined') {
      logout();
      return;
    }
    logout();
  };

  const handleCopyCode = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus(null), 2000);
    } catch (err) {
      console.warn('Failed to copy referral code', err);
      setCopyStatus('error');
      window.setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  const handleSubscriptionToggle = async () => {
    const nextValue = !isSubscribed;
    setIsSubscribed(nextValue);
    setSubscriptionStatus('saving');
    try {
      const updated = await updateCustomerSubscription(nextValue);
      if (typeof updated?.marketingOptIn === 'boolean') {
        setIsSubscribed(updated.marketingOptIn);
      }
      setSubscriptionStatus(null);
    } catch (err) {
      console.error('Failed to update subscription:', err);
      setIsSubscribed((prev) => !prev);
      setSubscriptionStatus('error');
      window.setTimeout(() => setSubscriptionStatus(null), 2000);
    }
  };

  const getOrderTotal = (order) => {
    if (!order) return 0;
    const totalValue = order.total ?? order.totalAmount;
    if (!totalValue) return 0;
    if (typeof totalValue === 'object' && totalValue !== null) {
      if (totalValue.amount !== undefined) return totalValue.amount / 100;
      if (totalValue.totalAmount !== undefined) return totalValue.totalAmount / 100;
    }
    if (typeof totalValue === 'number') return totalValue;
    return 0;
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="soft-card p-6 md:p-8 reveal-up">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">Личные данные</h2>
                <p className="text-sm text-muted mt-1">
                  Заполните профиль, чтобы мы быстрее оформляли заказы и доставку.
                </p>
              </div>
              <span className="text-xs uppercase tracking-[0.25em] text-primary">Профиль</span>
            </div>

            {saveStatus === 'saving' && (
              <div className="mb-5 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm text-muted">
                Сохраняем изменения…
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                Данные сохранены. Мы обновим информацию в вашем профиле.
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveMessage || 'Не удалось сохранить данные.'}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted block mb-1">Имя</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={handleProfileChange('firstName')}
                    placeholder="Ольга"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">Фамилия</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={handleProfileChange('lastName')}
                    placeholder="Павленко"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
                <div>
                  <label className="text-sm text-muted block mb-1">Телефон</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={handleProfileChange('phone')}
                      placeholder="+7 961 000-00-00"
                      className="w-full pr-10"
                      readOnly
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed md:pt-8">
                  Для изменения номера телефона обратитесь в службу поддержки по телефону
                  <span className="text-primary"> +7 961 466-88-33</span> или напишите
                  письмо на <span className="text-primary">postel-yug@yandex.ru</span>.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted block mb-1">Электронная почта</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange('email')}
                    placeholder="you@example.com"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">Дата рождения</label>
                  <input
                    type="date"
                    value={profile.birthDate}
                    onChange={handleProfileChange('birthDate')}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted block mb-2">Ваш пол</label>
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary p-1">
                  <button
                    type="button"
                    onClick={() => setProfile((prev) => ({ ...prev, gender: 'female' }))}
                    className={`px-4 py-2 text-sm rounded-full transition ${
                      profile.gender === 'female'
                        ? 'bg-white shadow text-ink'
                        : 'text-muted hover:text-ink'
                    }`}
                    aria-pressed={profile.gender === 'female'}
                  >
                    Женский
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfile((prev) => ({ ...prev, gender: 'male' }))}
                    className={`px-4 py-2 text-sm rounded-full transition ${
                      profile.gender === 'male'
                        ? 'bg-white shadow text-ink'
                        : 'text-muted hover:text-ink'
                    }`}
                    aria-pressed={profile.gender === 'male'}
                  >
                    Мужской
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="button"
                  disabled={saveStatus === 'saving' || isProfileLoading}
                  aria-busy={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? 'Сохраняем…' : 'Сохранить данные'}
                </button>
              </div>
            </form>
          </div>
        );
      case 'addresses':
        return (
          <div className="soft-card p-6 md:p-8 reveal-up">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Мои адреса</h2>
            <p className="text-sm text-muted">
              Сохраняйте любимые адреса, чтобы оформлять доставку быстрее.
            </p>
            <button type="button" className="button-gray mt-5">
              Добавить новый адрес
            </button>
          </div>
        );
      case 'events':
        return (
          <div className="soft-card p-6 md:p-8 reveal-up">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Уютные события</h2>
            <p className="text-sm text-muted">
              Здесь появятся персональные приглашения, мастер-классы и закрытые распродажи.
            </p>
            <div className="mt-5 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm text-muted">
              Пока событий нет, но мы уже готовим подборки специально для вас.
            </div>
          </div>
        );
      case 'subscriptions':
        return (
          <div className="soft-card p-6 md:p-8 reveal-up">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Управление подписками</h2>
            <p className="text-sm text-muted">
              Настройте рассылки и выбирайте частоту получения уютных подборок.
            </p>
            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white/80 px-4 py-4">
              <div>
                <p className="text-sm font-semibold">Еженедельные подборки</p>
                <p className="text-xs text-muted">Новинки, рекомендации и подборки по сезонам.</p>
              </div>
              <button
                type="button"
                onClick={handleSubscriptionToggle}
                disabled={subscriptionStatus === 'saving'}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                  isSubscribed ? 'bg-primary' : 'bg-ink/10'
                } ${subscriptionStatus === 'saving' ? 'opacity-60 cursor-wait' : ''}`}
                aria-pressed={isSubscribed}
                aria-busy={subscriptionStatus === 'saving'}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    isSubscribed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {subscriptionStatus === 'error' && (
              <p className="mt-3 text-xs text-red-500">
                Не удалось обновить подписку. Попробуйте ещё раз.
              </p>
            )}
          </div>
        );
      case 'bonuses':
        return (
          <div className="soft-card p-6 md:p-8 reveal-up">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Уютные бонусы</h2>
              <span className="text-xs uppercase tracking-[0.25em] text-primary">Баланс</span>
            </div>
            <p className="text-sm text-muted mb-3">Ваши бонусы доступны для списания на следующую покупку.</p>
            <div className="text-3xl font-semibold text-primary">{loyaltyPoints} баллов</div>
            <p className="text-xs text-muted mt-2">1 балл = 1 ₽. Бонусы действуют 365 дней.</p>
            <Link to="/info/bonuses" className="button-gray mt-5">
              Подробнее о программе
            </Link>
          </div>
        );
      case 'promocodes':
        return (
          <div className="soft-card p-6 md:p-8 reveal-up">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Мои промокоды</h2>
            <p className="text-sm text-muted">
              Здесь появятся все активные промокоды и персональные скидки.
            </p>
            <div className="mt-5 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm text-muted">
              Пока нет активных промокодов. Следите за рассылками — мы пришлём первый бонус.
            </div>
          </div>
        );
      case 'referral':
        return (
          <div className="soft-card p-6 md:p-8 reveal-up">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Приведи друга</h2>
            <p className="text-sm text-muted">
              Делитесь кодом с друзьями и получайте бонусы за их покупки.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3">
              <span className="text-sm font-semibold tracking-[0.2em] text-ink">{referralCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="button-ghost text-sm"
              >
                {copyStatus === 'copied' ? 'Скопировано' : 'Скопировать'}
              </button>
              {copyStatus === 'error' && (
                <span className="text-xs text-red-500">Не удалось скопировать</span>
              )}
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="soft-card p-6 md:p-8 reveal-up">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Мои заказы</h2>
              <span className="text-xs text-muted">{orders.length} заказов</span>
            </div>
            {isOrdersLoading ? (
              <p className="text-sm text-muted">Загружаем историю заказов…</p>
            ) : ordersError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {ordersError}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted">
                У вас ещё нет заказов. Самое время подобрать уютный комплект.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const date = order.createdAt
                    ? new Date(order.createdAt)
                    : order.orderDate
                      ? new Date(order.orderDate)
                      : new Date();
                  const dateStr = date.toLocaleDateString('ru-RU');
                  const totalAmount = getOrderTotal(order);
                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-ink/10 bg-white/90 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">Заказ {String(order.id).slice(0, 8)}...</p>
                        <p className="text-xs text-muted">{dateStr} · {order.status || 'PENDING'}</p>
                      </div>
                      <div className="text-sm text-right">
                        <p className="font-semibold">{totalAmount.toLocaleString('ru-RU')} ₽</p>
                        <div className="mt-1 flex flex-col items-end gap-1">
                          {order.publicToken && (
                            <Link to={`/order/${order.publicToken}`} className="text-xs text-primary">
                              Открыть заказ
                            </Link>
                          )}
                          <button type="button" className="text-xs text-primary">
                            Повторить заказ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'purchases':
        return (
          <div className="soft-card p-6 md:p-8 reveal-up">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Купленные товары</h2>
            <p className="text-sm text-muted">
              Подборки с вашими покупками появятся после первого заказа.
            </p>
            <div className="mt-5 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm text-muted">
              Пока список покупок пуст. Мы сохраним здесь всё, что вы купили.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="account-page py-10 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="relative mb-8">
          <div className="pointer-events-none absolute -top-10 right-0 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute top-12 left-6 h-24 w-24 rounded-full bg-sky/40 blur-2xl" />
          <nav className="text-xs sm:text-sm text-muted flex flex-wrap items-center gap-2">
            <Link to="/" className="hover:text-primary transition">
              Главная
            </Link>
            <span className="text-ink/30">/</span>
            <Link to="/account" className="hover:text-primary transition">
              Личный кабинет
            </Link>
            <span className="text-ink/30">/</span>
            <span className="text-ink">{activeLabel}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-3">Личный кабинет</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="soft-card p-5 reveal-up">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Ваш профиль</p>
              <h2 className="text-xl font-semibold mt-2">{displayName}</h2>
              <p className="text-sm text-muted mt-1">{displayPhone}</p>
            </div>

            <div className="rounded-3xl p-5 text-white relative overflow-hidden reveal-up bg-gradient-to-br from-[#c99b7b] via-[#b07c63] to-[#a5684d]">
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top,#ffffff,transparent_65%)]" />
              <div className="relative space-y-3">
                <p className="text-sm uppercase tracking-[0.25em] text-white/80">Лояльность</p>
                <p className="text-base font-semibold leading-snug">
                  Присоединяйтесь к программе лояльности и получайте кешбэк до 50% уютными бонусами.
                </p>
                <Link to="/info/bonuses" className="inline-flex items-center justify-center rounded-full border border-white/60 px-4 py-2 text-xs uppercase tracking-[0.25em]">
                  Подробнее
                </Link>
              </div>
            </div>

            <div className="soft-card p-4 reveal-up lg:hidden">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Раздел</p>
              <select
                value={activeSection}
                onChange={(event) => handleSectionChange(event.target.value)}
                className="w-full mt-3"
              >
                {SECTION_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleLogout}
                className="button-gray w-full mt-4"
              >
                Выйти
              </button>
            </div>

            <nav className="soft-card p-4 reveal-up hidden lg:block">
              <button
                type="button"
                onClick={() => handleSectionChange('profile')}
                className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
                  isProfileActive ? 'bg-primary/10 text-primary' : 'hover:bg-white/70 text-ink'
                }`}
                aria-current={isProfileActive ? 'page' : undefined}
              >
                <IconProfile
                  className={`h-5 w-5 ${
                    isProfileActive ? 'text-primary' : 'text-ink/60 group-hover:text-primary'
                  } transition-colors`}
                />
                <span className="text-sm font-medium">Профиль</span>
              </button>
              <div className="ml-10 mt-2 space-y-2">
                {PROFILE_SUBMENU.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSectionChange(item.id)}
                    className={`block w-full text-left text-sm transition ${
                      activeSection === item.id
                        ? 'text-primary font-medium'
                        : 'text-ink/70 hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 border-t border-ink/10 pt-4 space-y-2">
                {ACCOUNT_MENU.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSectionChange(item.id)}
                      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
                        isActive ? 'bg-primary/10 text-primary' : 'hover:bg-white/70 text-ink'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isActive ? 'text-primary' : 'text-ink/60 group-hover:text-primary'
                        } transition-colors`}
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-ink/10 pt-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-ink/70 hover:text-primary transition"
                >
                  <IconLogout className="h-5 w-5 text-ink/50 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Выйти</span>
                </button>
              </div>
            </nav>
          </aside>

          <section className="space-y-6">
            {renderSection()}
          </section>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;

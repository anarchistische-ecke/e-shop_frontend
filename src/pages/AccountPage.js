import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  getCustomerOrders,
  updateCustomerProfile
} from '../api';
import NotificationBanner from '../components/NotificationBanner';
import Seo from '../components/Seo';
import { Button, Card, Input, Select, Tabs } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { moneyToNumber } from '../utils/product';
import {
  ACCOUNT_DEFAULT_SECTION,
  ACCOUNT_ORDERS_SECTION,
  buildAccountOrderPath,
  buildAccountSectionPath,
  findAccountOrderById,
  resolveAccountLocationState
} from '../utils/account';
import ManagerAccountPage from './ManagerAccountPage';
import { readEnv } from '../config/runtime';

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

const PROFILE_SECTIONS = ['profile', 'addresses', 'events'];

const PROFILE_SUBMENU = [
  { id: 'addresses', label: 'Мои адреса' },
  { id: 'events', label: 'Уютные события' }
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
  bonuses: 'Уютные бонусы',
  promocodes: 'Мои промокоды',
  referral: 'Приведи друга',
  orders: 'Мои заказы',
  purchases: 'Купленные товары'
};
const ORDER_STATUS_LABELS = {
  PENDING: 'Ожидает оплаты',
  PROCESSING: 'В обработке',
  PAID: 'Оплачен',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
  REFUNDED: 'Возврат выполнен',
};

const formatOrderStatus = (status) => {
  if (!status) return 'В обработке';
  return ORDER_STATUS_LABELS[status] || status;
};

function AccountPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isReady, tokenParsed, logout, refreshProfile, hasRole, hasStrongAuth } = useAuth();
  const customerRole = readEnv('REACT_APP_KEYCLOAK_CUSTOMER_ROLE', 'customer') || 'customer';
  const managerRole = readEnv('REACT_APP_KEYCLOAK_MANAGER_ROLE', 'manager') || 'manager';
  const hasManagerRole = isAuthenticated && hasRole(managerRole);
  const isManager = hasManagerRole && hasStrongAuth();
  const isCustomer = isAuthenticated && hasRole(customerRole);
  const [orders, setOrders] = useState([]);
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
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);

  const routeState = useMemo(() => {
    const nextState = resolveAccountLocationState({
      hash: location.hash,
      search: location.search
    });

    return {
      section: SECTION_ID_SET.has(nextState.section)
        ? nextState.section
        : ACCOUNT_DEFAULT_SECTION,
      orderId: nextState.orderId
    };
  }, [location.hash, location.search]);
  const activeSection = routeState.section;
  const selectedOrderId =
    activeSection === ACCOUNT_ORDERS_SECTION ? routeState.orderId : '';

  const loadOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await getCustomerOrders();
      const list = Array.isArray(data) ? data.slice() : [];
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.orderDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.orderDate || 0).getTime();
        return timeB - timeA;
      });
      setOrders(list);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrdersError('Не удалось загрузить заказы. Попробуйте ещё раз.');
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isManager) return;
    loadOrders();
  }, [isAuthenticated, isManager, loadOrders]);

  useEffect(() => {
    if (!isAuthenticated || isManager) return;
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

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (hasManagerRole && !isManager) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isManager) {
    return <ManagerAccountPage />;
  }

  if (!isCustomer) {
    return <Navigate to="/" replace />;
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
  const selectedOrder = useMemo(
    () => findAccountOrderById(orders, selectedOrderId),
    [orders, selectedOrderId]
  );
  const selectedOrderNotFound =
    activeSection === ACCOUNT_ORDERS_SECTION &&
    Boolean(selectedOrderId) &&
    !isOrdersLoading &&
    !ordersError &&
    orders.length > 0 &&
    !selectedOrder;

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
      }
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveStatus('error');
      setSaveMessage('Не удалось сохранить данные. Попробуйте ещё раз.');
    }
  };

  const handleSectionChange = (section, { orderId } = {}) => {
    navigate(buildAccountSectionPath(section, { orderId }), { replace: true });
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

  const getOrderDateLabel = (order, { withTime = false } = {}) => {
    const rawDate = order?.createdAt || order?.orderDate;
    if (!rawDate) return 'Дата уточняется';
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return 'Дата уточняется';
    return withTime
      ? date.toLocaleString('ru-RU')
      : date.toLocaleDateString('ru-RU');
  };

  const getOrderDeliveryLabel = (order) => {
    if (!order) return 'Уточним после подтверждения заказа';
    if (order.deliveryPickupPointName) return order.deliveryPickupPointName;
    if (order.deliveryAddress) return order.deliveryAddress;
    if (order.deliveryMethod) return order.deliveryMethod;
    return 'Уточним после подтверждения заказа';
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Card className="reveal-up" padding="lg">
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
              <NotificationBanner
                notification={{ type: 'info', message: 'Сохраняем изменения…' }}
                className="mb-5"
              />
            )}
            {saveStatus === 'saved' && (
              <NotificationBanner
                notification={{ type: 'success', message: 'Данные сохранены. Мы обновим информацию в вашем профиле.' }}
                className="mb-5"
              />
            )}
            {saveStatus === 'error' && (
              <NotificationBanner
                notification={{ type: 'error', message: saveMessage || 'Не удалось сохранить данные.' }}
                className="mb-5"
              />
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted block mb-1">Имя</label>
                  <Input
                    type="text"
                    value={profile.firstName}
                    onChange={handleProfileChange('firstName')}
                    placeholder="Ольга"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">Фамилия</label>
                  <Input
                    type="text"
                    value={profile.lastName}
                    onChange={handleProfileChange('lastName')}
                    placeholder="Павленко"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
                <div>
                  <label className="text-sm text-muted block mb-1">Телефон</label>
                  <div className="relative">
                    <Input
                      type="tel"
                      value={profile.phone}
                      onChange={handleProfileChange('phone')}
                      placeholder="+7 961 000-00-00"
                      className="pr-10"
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
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange('email')}
                    placeholder="email@example.ru"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1">Дата рождения</label>
                  <Input
                    type="date"
                    value={profile.birthDate}
                    onChange={handleProfileChange('birthDate')}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted block mb-2">Ваш пол</label>
                <Tabs
                  ariaLabel="Выбор пола"
                  kind="segmented"
                  value={profile.gender}
                  onChange={(value) => setProfile((prev) => ({ ...prev, gender: value }))}
                  items={[
                    { value: 'female', label: 'Женский' },
                    { value: 'male', label: 'Мужской' },
                  ]}
                  fullWidth
                  className="max-w-md"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={saveStatus === 'saving' || isProfileLoading}
                  aria-busy={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? 'Сохраняем…' : 'Сохранить данные'}
                </Button>
              </div>
            </form>
          </Card>
        );
      case 'addresses':
        return (
          <Card className="reveal-up" padding="lg">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Мои адреса</h2>
            <p className="text-sm text-muted">
              Сохраняйте любимые адреса, чтобы оформлять доставку быстрее.
            </p>
            <Button type="button" variant="secondary" className="mt-5">
              Добавить новый адрес
            </Button>
          </Card>
        );
      case 'events':
        return (
          <Card className="reveal-up" padding="lg">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Уютные события</h2>
            <p className="text-sm text-muted">
              Здесь появятся персональные приглашения, мастер-классы и закрытые распродажи.
            </p>
            <Card variant="quiet" padding="sm" className="mt-5 text-sm text-muted">
              Пока событий нет, но мы уже готовим подборки специально для вас.
            </Card>
          </Card>
        );
      case 'bonuses':
        return (
          <Card className="reveal-up" padding="lg">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Уютные бонусы</h2>
              <span className="text-xs uppercase tracking-[0.25em] text-primary">Баланс</span>
            </div>
            <p className="text-sm text-muted mb-3">Ваши бонусы доступны для списания на следующую покупку.</p>
            <div className="text-3xl font-semibold text-primary">{loyaltyPoints} баллов</div>
            <p className="text-xs text-muted mt-2">1 балл = 1 ₽. Бонусы действуют 365 дней.</p>
            <Button as={Link} to="/info/bonuses" variant="secondary" className="mt-5">
              Подробнее о программе
            </Button>
          </Card>
        );
      case 'promocodes':
        return (
          <Card className="reveal-up" padding="lg">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Мои промокоды</h2>
            <p className="text-sm text-muted">
              Здесь появятся все активные промокоды и персональные скидки.
            </p>
            <Card variant="quiet" padding="sm" className="mt-5 text-sm text-muted">
              Пока нет активных промокодов. Первый бонус появится здесь автоматически.
            </Card>
          </Card>
        );
      case 'referral':
        return (
          <Card className="reveal-up" padding="lg">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Приведи друга</h2>
            <p className="text-sm text-muted">
              Делитесь кодом с друзьями и получайте бонусы за их покупки.
            </p>
            <Card variant="quiet" padding="sm" className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl">
              <span className="text-sm font-semibold tracking-[0.2em] text-ink">{referralCode}</span>
              <Button
                type="button"
                onClick={handleCopyCode}
                variant="ghost"
                size="sm"
              >
                {copyStatus === 'copied' ? 'Скопировано' : 'Скопировать'}
              </Button>
              {copyStatus === 'error' && (
                <span className="text-xs text-red-500">Не удалось скопировать</span>
              )}
            </Card>
          </Card>
        );
      case 'orders':
        return (
          <Card className="reveal-up" padding="lg">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Мои заказы</h2>
              <span className="text-xs text-muted">{orders.length} заказов</span>
            </div>
            {isOrdersLoading ? (
              <p className="text-sm text-muted">Загружаем историю заказов…</p>
            ) : ordersError ? (
              <div className="space-y-3">
                <NotificationBanner notification={{ type: 'error', message: ordersError }} />
                <Button type="button" variant="secondary" onClick={loadOrders}>
                  Повторить загрузку
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted">
                У вас ещё нет заказов. Самое время подобрать уютный комплект.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedOrder ? (
                  <Card variant="quiet" padding="md" className="bg-sand/35">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted">Детали заказа</p>
                        <h3 className="mt-1 text-lg font-semibold">
                          Заказ {String(selectedOrder.id).slice(0, 8)}...
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                          {getOrderDateLabel(selectedOrder, { withTime: true })} · {formatOrderStatus(selectedOrder.status)}
                        </p>
                      </div>
                      {selectedOrder.publicToken ? (
                        <Button as={Link} to={buildAccountOrderPath(selectedOrder)} variant="secondary" size="sm">
                          Открыть страницу заказа
                        </Button>
                      ) : (
                        <span className="max-w-xs text-xs text-muted">
                          Для этого заказа нет публичной ссылки, поэтому актуальные детали доступны здесь, в личном кабинете.
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Card variant="tint" padding="sm" className="bg-white/90 shadow-none">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">Оплата и контакт</p>
                        <p className="mt-2 text-sm font-semibold">
                          {getOrderTotal(selectedOrder).toLocaleString('ru-RU')} ₽
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {selectedOrder.receiptEmail || 'Email для чека уточняется'}
                        </p>
                      </Card>
                      <Card variant="tint" padding="sm" className="bg-white/90 shadow-none">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">Доставка</p>
                        <p className="mt-2 text-sm font-semibold">{getOrderDeliveryLabel(selectedOrder)}</p>
                        <p className="mt-1 text-xs text-muted">
                          {selectedOrder.deliveryProvider
                            ? `${selectedOrder.deliveryProvider} · ${selectedOrder.deliveryMethod || 'способ уточняется'}`
                            : 'Способ доставки уточняется'}
                        </p>
                      </Card>
                    </div>

                    {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                      <div className="mt-4 border-t border-ink/10 pt-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">Состав заказа</p>
                        <div className="mt-3 space-y-2">
                          {selectedOrder.items.map((item, index) => {
                            const itemUnitPrice = moneyToNumber(item.unitPrice);
                            const itemTotal = itemUnitPrice * (item.quantity || 0);
                            const itemKey = item.id || `${item.variantId || 'item'}-${index}`;

                            return (
                              <div
                                key={itemKey}
                                className="flex items-start justify-between gap-3 rounded-2xl border border-ink/10 bg-white/85 px-3 py-3 text-sm"
                              >
                                <div>
                                  <p className="font-semibold">
                                    {item.productName || item.variantName || item.sku || 'Товар'}
                                  </p>
                                  <p className="mt-1 text-xs text-muted">
                                    {item.variantName || item.sku || 'Вариант уточняется'} · {item.quantity || 0} шт.
                                  </p>
                                </div>
                                <div className="text-right font-semibold">
                                  {itemTotal.toLocaleString('ru-RU')} ₽
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </Card>
                ) : selectedOrderNotFound ? (
                  <NotificationBanner
                    notification={{
                      type: 'warning',
                      title: 'Заказ из ссылки не найден',
                      message: 'Он уже может быть недоступен в вашем кабинете или был оформлен на другой аккаунт.'
                    }}
                  />
                ) : (
                  <Card variant="quiet" padding="sm" className="text-sm text-muted">
                    Выберите заказ из списка, чтобы открыть детали здесь. Если у заказа есть публичная ссылка, его можно открыть на отдельной странице.
                  </Card>
                )}

                <div className="space-y-3">
                {orders.map((order) => {
                  const dateStr = getOrderDateLabel(order);
                  const totalAmount = getOrderTotal(order);
                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-ink/10 bg-white/90 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">Заказ {String(order.id).slice(0, 8)}...</p>
                        <p className="text-xs text-muted">{dateStr} · {formatOrderStatus(order.status)}</p>
                      </div>
                      <div className="text-sm text-right">
                        <p className="font-semibold">{totalAmount.toLocaleString('ru-RU')} ₽</p>
                        <div className="mt-1 flex flex-col items-end gap-1">
                          <Button
                            as={Link}
                            to={buildAccountOrderPath(order)}
                            variant="ghost"
                            size="sm"
                            className="!min-h-0 !px-0 !py-0 text-xs text-primary"
                          >
                            {order.publicToken ? 'Открыть заказ' : 'Открыть детали'}
                          </Button>
                          {!order.publicToken ? (
                            <span className="text-[11px] text-muted">Детали доступны в кабинете</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </Card>
        );
      case 'purchases':
        return (
          <Card className="reveal-up" padding="lg">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">Купленные товары</h2>
            <p className="text-sm text-muted">
              Подборки с вашими покупками появятся после первого заказа.
            </p>
            <Card variant="quiet" padding="sm" className="mt-5 text-sm text-muted">
              Пока список покупок пуст. Мы сохраним здесь всё, что вы купили.
            </Card>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="account-page page-section">
      <Seo
        title="Личный кабинет"
        description="Профиль покупателя, история заказов, бонусы и персональные данные для быстрого повторного оформления."
        canonicalPath={
          activeSection === ACCOUNT_DEFAULT_SECTION
            ? '/account'
            : buildAccountSectionPath(activeSection, { orderId: selectedOrderId })
        }
        robots="noindex,nofollow"
      />
      <div className="page-shell">
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
            <Card className="reveal-up" padding="md">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Ваш профиль</p>
              <h2 className="text-xl font-semibold mt-2">{displayName}</h2>
              <p className="text-sm text-muted mt-1">{displayPhone}</p>
            </Card>

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

            <Card className="reveal-up lg:hidden" padding="sm">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Раздел</p>
              <Select
                value={activeSection}
                onChange={(event) => handleSectionChange(event.target.value)}
                className="mt-3"
              >
                {SECTION_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                onClick={handleLogout}
                block
                variant="secondary"
                className="mt-4"
              >
                Выйти
              </Button>
            </Card>

            <Card as="nav" className="reveal-up hidden lg:block" padding="sm">
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
            </Card>
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

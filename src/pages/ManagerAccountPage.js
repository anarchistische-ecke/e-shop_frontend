import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getManagerDashboard } from '../api';
import { moneyToNumber } from '../utils/product';
import { useAuth } from '../contexts/AuthContext';

const statusLabels = {
  PENDING: 'Ожидает оплаты',
  PAID: 'Оплачен',
  CANCELLED: 'Отменён'
};

const formatStatus = (status) => {
  if (!status) return 'В обработке';
  return statusLabels[status] || status;
};

function ManagerAccountPage() {
  const { tokenParsed, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);
    getManagerDashboard({ limit: 8 })
      .then((data) => {
        if (!mounted) return;
        setDashboard(data || null);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to load manager dashboard:', err);
        setError('Не удалось загрузить данные. Попробуйте позже.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    if (!tokenParsed) return 'Менеджер';
    const nameParts = [tokenParsed.given_name, tokenParsed.family_name].filter(Boolean);
    if (nameParts.length) return nameParts.join(' ');
    return tokenParsed.name || tokenParsed.preferred_username || tokenParsed.email || 'Менеджер';
  }, [tokenParsed]);

  const stats = dashboard?.stats || {};
  const recentOrders = Array.isArray(dashboard?.recentOrders) ? dashboard.recentOrders : [];

  const totalSales = moneyToNumber(stats.totalSales);
  const averageOrderValue = moneyToNumber(stats.averageOrderValue);

  const lastOrderDate = stats.lastOrderAt ? new Date(stats.lastOrderAt) : null;
  const lastOrderLabel = lastOrderDate ? lastOrderDate.toLocaleDateString('ru-RU') : 'Нет заказов';

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="manager-account-page py-10 sm:py-12">
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
              Кабинет менеджера
            </Link>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-3">Кабинет менеджера</h1>
          <p className="text-sm text-muted mt-2">
            Управляйте сделками, отслеживайте оплату и фиксируйте результаты продаж.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="soft-card p-5 reveal-up">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Профиль</p>
              <h2 className="text-xl font-semibold mt-2">{displayName}</h2>
              <p className="text-sm text-muted mt-1">Роль: менеджер</p>
              <p className="text-xs text-muted mt-2">Последний заказ: {lastOrderLabel}</p>
            </div>

            <div className="soft-card p-5 reveal-up">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Быстрые действия</p>
              <div className="mt-4 space-y-2">
                <Link to="/cart" className="button w-full">
                  Создать ссылку на оплату
                </Link>
                <Link to="/catalog" className="button-gray w-full">
                  Перейти в каталог
                </Link>
                <button type="button" onClick={handleLogout} className="button-ghost w-full">
                  Выйти из аккаунта
                </button>
              </div>
            </div>

            <div className="rounded-3xl p-5 text-white relative overflow-hidden reveal-up bg-gradient-to-br from-[#7aa59b] via-[#5e8f84] to-[#4c7a6f]">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,#ffffff,transparent_65%)]" />
              <div className="relative space-y-3">
                <p className="text-sm uppercase tracking-[0.25em] text-white/80">Совет</p>
                <p className="text-base font-semibold leading-snug">
                  Предлагайте клиенту оплату в течение 15 минут после формирования корзины — это повышает конверсию.
                </p>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div id="overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="soft-card p-5 reveal-up">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Выручка</p>
                <p className="text-2xl font-semibold mt-2">
                  {totalSales.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-xs text-muted mt-2">Все сделки за период работы</p>
              </div>
              <div className="soft-card p-5 reveal-up">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Заказы</p>
                <p className="text-2xl font-semibold mt-2">{stats.totalOrders ?? 0}</p>
                <p className="text-xs text-muted mt-2">Всего оформлено</p>
              </div>
              <div className="soft-card p-5 reveal-up">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Оплачено</p>
                <p className="text-2xl font-semibold mt-2">{stats.paidOrders ?? 0}</p>
                <p className="text-xs text-muted mt-2">Завершённые оплаты</p>
              </div>
              <div className="soft-card p-5 reveal-up">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Средний чек</p>
                <p className="text-2xl font-semibold mt-2">
                  {averageOrderValue.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-xs text-muted mt-2">Среднее значение заказов</p>
              </div>
            </div>

            <div id="orders" className="soft-card p-6 md:p-8 reveal-up">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold">Последние заказы</h2>
                  <p className="text-sm text-muted mt-1">
                    Отслеживайте оплаты и статус каждого клиента.
                  </p>
                </div>
                <span className="text-xs text-muted">{stats.pendingOrders ?? 0} ожидают оплату</span>
              </div>

              {isLoading ? (
                <p className="text-sm text-muted">Загружаем данные по заказам…</p>
              ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : recentOrders.length === 0 ? (
                <p className="text-sm text-muted">Заказы появятся после создания первой ссылки.</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => {
                    const orderDate = order.orderDate || order.createdAt;
                    const dateLabel = orderDate ? new Date(orderDate).toLocaleDateString('ru-RU') : 'Без даты';
                    const total = moneyToNumber(order.totalAmount || order.total);
                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-ink/10 bg-white/90 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">Заказ {String(order.id).slice(0, 8)}...</p>
                          <p className="text-xs text-muted">{dateLabel} · {formatStatus(order.status)}</p>
                        </div>
                        <div className="text-sm text-right">
                          <p className="font-semibold">{total.toLocaleString('ru-RU')} ₽</p>
                          <div className="mt-1 flex flex-col items-end gap-1">
                            {order.publicToken && (
                              <Link to={`/order/${order.publicToken}`} className="text-xs text-primary">
                                Открыть заказ
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div id="links" className="grid gap-4 md:grid-cols-2">
              <div className="soft-card p-6 reveal-up">
                <h3 className="text-lg font-semibold mb-2">Ссылки на оплату</h3>
                <p className="text-sm text-muted">
                  Создавайте ссылку в корзине и отправляйте клиенту удобным способом.
                </p>
                <Link to="/cart" className="button mt-4">
                  Перейти в корзину менеджера
                </Link>
              </div>
              <div className="soft-card p-6 reveal-up">
                <h3 className="text-lg font-semibold mb-2">Статус оплат</h3>
                <div className="space-y-2 text-sm text-muted">
                  <div className="flex items-center justify-between">
                    <span>Ожидают оплату</span>
                    <span className="font-semibold text-ink">{stats.pendingOrders ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Оплачены</span>
                    <span className="font-semibold text-ink">{stats.paidOrders ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Отменены</span>
                    <span className="font-semibold text-ink">{stats.cancelledOrders ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ManagerAccountPage;

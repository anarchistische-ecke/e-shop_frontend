import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getPublicOrder, payPublicOrder, refreshPublicOrderPayment } from '../api';
import NotificationBanner from '../components/NotificationBanner';
import { Button, Card, Input } from '../components/ui';
import { usePaymentConfig } from '../contexts/PaymentConfigContext';
import EmbeddedPaymentPanel from '../features/payment/EmbeddedPaymentPanel';
import { moneyToNumber } from '../utils/product';
import { useAuth } from '../contexts/AuthContext';
import { METRIKA_GOALS, trackMetrikaGoal } from '../utils/metrika';
import { createNotification } from '../utils/notifications';
import {
  hasEmbeddedPaymentSession,
  getOrderPaymentNotice,
  getPaymentSummaryLabel,
  normalizePaymentSession
} from '../utils/payment';
import { buildAbsoluteAppUrl } from '../utils/url';

const statusLabels = {
  PENDING: 'Ожидает оплаты',
  PROCESSING: 'В обработке',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
  PAID: 'Оплачен',
  REFUNDED: 'Возврат выполнен',
};

const timelineSteps = [
  { key: 'PENDING', title: 'Заказ создан' },
  { key: 'PROCESSING', title: 'Передан в обработку' },
  { key: 'PAID', title: 'Оплата подтверждена' },
  { key: 'DELIVERED', title: 'Доставлен' },
];

function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.6 2.6L16 9.7" />
    </svg>
  );
}

function OrderPage() {
  const location = useLocation();
  const { token } = useParams();
  const { tokenParsed } = useAuth();
  const { paymentConfig, isPaymentConfigLoaded } = usePaymentConfig();
  const initialPaymentSessionRef = useRef(
    normalizePaymentSession(location.state?.paymentSession, {
      returnUrl: token ? buildAbsoluteAppUrl(`/order/${token}`) : ''
    })
  );

  const [order, setOrder] = useState(null);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentSession, setPaymentSession] = useState(() =>
    hasEmbeddedPaymentSession(initialPaymentSessionRef.current)
      ? initialPaymentSessionRef.current
      : null
  );

  const refreshTimerRef = useRef(null);
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setStatus(null);

    getPublicOrder(token)
      .then((data) => {
        if (!mounted) return;
        setOrder(data);

        const fallbackEmail =
          data?.receiptEmail ||
          tokenParsed?.email ||
          tokenParsed?.preferred_username ||
          tokenParsed?.username ||
          '';
        setReceiptEmail(fallbackEmail);
      })
      .catch((err) => {
        console.error('Failed to load order:', err);
        if (!mounted) return;
        setStatus(createNotification({
          type: 'error',
          title: 'Не удалось загрузить заказ',
          message: 'Проверьте ссылку и попробуйте ещё раз.'
        }));
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token, tokenParsed]);

  const refreshPaymentStatus = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsRefreshing(true);
      setStatus(null);
    }

    try {
      const updated = await refreshPublicOrderPayment(token);
      if (updated) {
        setOrder(updated);
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to refresh payment status:', err);
        setStatus(createNotification({
          type: 'warning',
          title: 'Не удалось обновить статус оплаты',
          message: 'Попробуйте ещё раз или вернитесь к оплате позже.'
        }));
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!order) return undefined;
    const currentStatus = order.status || 'PENDING';
    const shouldPoll = currentStatus === 'PENDING' || currentStatus === 'PROCESSING';
    if (!shouldPoll) return undefined;

    let active = true;
    let attempts = 0;
    const maxAttempts = 18;

    const tick = async () => {
      if (!active) return;
      attempts += 1;
      await refreshPaymentStatus({ silent: true });
      if (attempts >= maxAttempts) {
        active = false;
        return;
      }
      refreshTimerRef.current = window.setTimeout(tick, 10000);
    };

    refreshTimerRef.current = window.setTimeout(tick, 6000);

    return () => {
      active = false;
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [order]);

  const total = useMemo(() => {
    if (!order) return 0;
    return moneyToNumber(order.totalAmount || order.total);
  }, [order]);
  const orderReturnUrl = useMemo(
    () => buildAbsoluteAppUrl(`/order/${token}`),
    [token]
  );

  useEffect(() => {
    if (!order || purchaseTrackedRef.current) return;
    const nextStatus = order.status || 'PENDING';
    if (nextStatus !== 'PAID' && nextStatus !== 'DELIVERED') return;

    trackMetrikaGoal(METRIKA_GOALS.PURCHASE, {
      order_id: order.id,
      total: Math.round(moneyToNumber(order.totalAmount || order.total)),
      items: Array.isArray(order.items) ? order.items.length : 0,
    });
    purchaseTrackedRef.current = true;
  }, [order]);

  useEffect(() => {
    if (!order) {
      return;
    }
    const nextStatus = order.status || 'PENDING';
    if (nextStatus !== 'PENDING' && nextStatus !== 'PROCESSING') {
      setPaymentSession(null);
    }
  }, [order]);

  const handlePay = async () => {
    if (!receiptEmail.trim()) {
      setStatus(createNotification({
        type: 'error',
        title: 'Укажите email для чека',
        message: 'Перед повторной оплатой нужен адрес для отправки чека.'
      }));
      return;
    }

    setIsPaying(true);
    setStatus(null);
    try {
      const response = await payPublicOrder({
        token,
        receiptEmail: receiptEmail.trim(),
        returnUrl: orderReturnUrl,
        confirmationMode: isPaymentConfigLoaded ? paymentConfig.confirmationMode : undefined,
      });

      const nextPaymentSession = normalizePaymentSession(response, {
        returnUrl: orderReturnUrl
      });
      if (hasEmbeddedPaymentSession(nextPaymentSession)) {
        setPaymentSession(nextPaymentSession);
        return;
      }

      if (nextPaymentSession.confirmationUrl) {
        setPaymentSession(null);
        window.location.href = nextPaymentSession.confirmationUrl;
        return;
      }

      setPaymentSession(null);
      setStatus(createNotification({
        type: 'warning',
        title: 'Платёжная ссылка не получена',
        message: 'Проверьте статус заказа или безопасно повторите попытку ещё раз.',
        action: {
          label: 'Проверить статус оплаты',
          onClick: () => refreshPaymentStatus()
        }
      }));
    } catch (err) {
      console.error('Payment creation failed:', err);
      setPaymentSession(null);
      setStatus(createNotification({
        type: 'error',
        title: 'Не удалось открыть оплату',
        message: 'Попробуйте ещё раз или сначала обновите статус заказа.',
        action: {
          label: 'Проверить статус оплаты',
          onClick: () => refreshPaymentStatus()
        }
      }));
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted">
        Загружаем заказ…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted mb-4">Заказ не найден.</p>
        <Button as={Link} to="/" variant="ghost">Вернуться на главную</Button>
      </div>
    );
  }

  const orderStatus = order.status || 'PENDING';
  const statusLabel = statusLabels[orderStatus] || orderStatus;
  const canPay = orderStatus === 'PENDING' || orderStatus === 'PROCESSING';
  const canRefresh = canPay;
  const paymentSummaryLabel = getPaymentSummaryLabel(paymentConfig);
  const showEmbeddedPayment = canPay && hasEmbeddedPaymentSession(paymentSession);
  const paymentNotice = canPay
    ? getOrderPaymentNotice(paymentConfig, orderStatus)
    : null;
  const paymentRecoveryNotice = canPay && !showEmbeddedPayment
    ? createNotification({
        type: paymentNotice.type,
        title: paymentNotice.title,
        message: paymentNotice.message
      })
    : null;

  const isConfirmed = orderStatus === 'PAID' || orderStatus === 'DELIVERED';
  const shipping = order.delivery || {};

  const deliveryType =
    shipping.deliveryType === 'PICKUP'
      ? 'Самовывоз'
      : shipping.deliveryType === 'COURIER'
      ? 'Курьер'
      : 'Уточняется';

  const deliveryAddress =
    shipping.address ||
    shipping.pickupPointName ||
    order.deliveryAddress ||
    order.address ||
    'Адрес уточняется';

  const deliveryEstimateDate = (() => {
    const candidate =
      shipping.intervalTo ||
      shipping.expectedAt ||
      order.estimatedDeliveryAt ||
      order.expectedDeliveryAt ||
      '';

    if (!candidate) return 'Дата уточняется';
    const parsed = new Date(candidate);
    if (Number.isNaN(parsed.getTime())) return 'Дата уточняется';
    return parsed.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    });
  })();

  const trackingNumber =
    shipping.trackingNumber ||
    shipping.tracking_number ||
    order.trackingNumber ||
    order.tracking_number ||
    '';

  const carrierName =
    shipping.carrierName ||
    shipping.carrier ||
    order.carrierName ||
    order.carrier ||
    'Перевозчик назначается';

  const statusRank = {
    PENDING: 0,
    PROCESSING: 1,
    PAID: 2,
    DELIVERED: 3,
    CANCELLED: 0,
    REFUNDED: 0,
  };

  const activeStage = statusRank[orderStatus] ?? 0;

  return (
    <div className="order-page py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Заказ</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Заказ №{String(order.id).slice(0, 8)}
            </h1>
            <p className="text-sm text-muted mt-1">{statusLabel}</p>
          </div>
          <Button as={Link} to="/" variant="ghost" size="sm">
            Продолжить покупки →
          </Button>
        </div>

        <Card variant="soft" padding="md" className="mb-6 border-primary/25">
          <div className="flex items-start gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-ink/75'}`}>
              <SuccessIcon />
            </span>
            <div>
              <p className="text-lg font-semibold">
                {isConfirmed ? 'Заказ подтверждён' : 'Заказ принят в обработку'}
              </p>
              <p className="text-sm text-muted mt-1">
                Номер заказа: <span className="font-semibold text-ink">{String(order.id).slice(0, 12)}</span>
              </p>
              <p className="text-sm text-muted mt-1">
                Ожидаемая дата доставки: <span className="text-ink">{deliveryEstimateDate}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Button type="button" block variant="secondary">Отслеживать заказ</Button>
            <Button as={Link} to="/usloviya-prodazhi#return" block variant="secondary">Оформить возврат</Button>
            <Button as={Link} to="/info/delivery" block variant="ghost">Связаться с поддержкой</Button>
          </div>
        </Card>

        {status ? <NotificationBanner notification={status} className="mb-6" /> : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card as="section" padding="lg">
              <h2 className="text-xl font-semibold mb-4">Статус доставки</h2>
              <ol className="space-y-3">
                {timelineSteps.map((step, index) => {
                  const isDone = index <= activeStage;
                  return (
                    <li key={step.key} className="grid grid-cols-[26px_minmax(0,1fr)] items-center gap-3">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isDone ? 'bg-primary text-white' : 'bg-secondary text-muted'}`}>
                        {isDone ? '✓' : index + 1}
                      </span>
                      <span className={isDone ? 'text-ink font-medium' : 'text-muted'}>{step.title}</span>
                    </li>
                  );
                })}
              </ol>

              <Card variant="quiet" padding="sm" className="mt-5 text-sm space-y-1">
                <p><span className="text-muted">Способ:</span> {deliveryType}</p>
                <p><span className="text-muted">Адрес/пункт:</span> {deliveryAddress}</p>
                <p><span className="text-muted">Перевозчик:</span> {carrierName}</p>
                <p><span className="text-muted">Трек-номер:</span> {trackingNumber || 'Появится после отгрузки'}</p>
              </Card>
            </Card>

            <Card as="section" padding="lg">
              <h2 className="text-xl font-semibold mb-4">Товары в заказе</h2>
              <div className="space-y-3">
                {(order.items || []).map((item) => {
                  const unitPrice = moneyToNumber(item.unitPrice || item.unit_price);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/90 px-4 py-3 text-sm"
                    >
                      <div>
                        <div className="font-semibold">{item.productName || 'Товар'}</div>
                        <div className="text-xs text-muted">{item.variantName || item.variantId}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{unitPrice.toLocaleString('ru-RU')} ₽</div>
                        <div className="text-xs text-muted">× {item.quantity}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] self-start">
            <Card padding="md">
              <h3 className="text-xl font-semibold mb-4">Итоги заказа</h3>
              <div className="flex justify-between mb-2 text-sm">
                <span>Товары ({order.items?.length || 0})</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Доставка</span>
                <span>{moneyToNumber(shipping.pricingTotal || shipping.pricing || 0).toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between mb-2 text-sm text-muted">
                <span>Оплата</span>
                <span>{paymentSummaryLabel}</span>
              </div>
              <hr className="my-3 border-ink/10" />
              <div className="flex justify-between font-semibold text-base mb-4">
                <span>Итого</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>

              {canPay ? (
                <div className="space-y-2">
                  {paymentRecoveryNotice ? (
                    <NotificationBanner notification={paymentRecoveryNotice} compact />
                  ) : null}
                  <label className="block text-sm">
                    <span className="text-muted">Email для чека</span>
                    <Input
                      type="email"
                      value={receiptEmail}
                      onChange={(event) => setReceiptEmail(event.target.value)}
                      placeholder="email@example.ru"
                      className="mt-2"
                    />
                  </label>

                  {showEmbeddedPayment ? (
                    <EmbeddedPaymentPanel
                      paymentConfig={paymentConfig}
                      paymentSession={paymentSession}
                      isStarting={isPaying}
                      onRequestNewSession={handlePay}
                      onRefreshStatus={() => refreshPaymentStatus()}
                    />
                  ) : (
                    <>
                      <Button block onClick={handlePay} disabled={isPaying}>
                        {isPaying
                          ? `Открываем ${paymentConfig.providerName}…`
                          : paymentNotice.ctaLabel}
                      </Button>
                      {canRefresh && (
                        <Button
                          type="button"
                          block
                          variant="secondary"
                          onClick={() => refreshPaymentStatus()}
                          disabled={isRefreshing}
                        >
                          {isRefreshing ? 'Проверяем оплату…' : 'Проверить статус оплаты'}
                        </Button>
                      )}
                    </>
                  )}
                  <p className="text-xs text-muted">
                    Пока заказ ожидает оплату, страница автоматически обновляет статус. После ответа банка подтверждение появится здесь.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Оплата получена. Спасибо за заказ!
                </div>
              )}
            </Card>

            <Card padding="sm" className="text-sm space-y-2">
              <p className="font-semibold">Спокойная доставка</p>
              <p className="text-muted">Следите за заказом на этой странице: статус, интервал и обновления по доставке собраны в одном месте.</p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default OrderPage;

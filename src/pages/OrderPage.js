import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicOrder, payPublicOrder, refreshPublicOrderPayment } from '../api';
import { moneyToNumber } from '../utils/product';
import { useAuth } from '../contexts/AuthContext';

const statusLabels = {
  PENDING: 'Ожидает оплаты',
  PROCESSING: 'В обработке',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
  PAID: 'Оплачен',
  REFUNDED: 'Возврат выполнен'
};

function OrderPage() {
  const { token } = useParams();
  const { tokenParsed } = useAuth();
  const [order, setOrder] = useState(null);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef(null);

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
        if (mounted) {
          setStatus({
            type: 'error',
            message: 'Не удалось загрузить заказ. Проверьте ссылку и попробуйте ещё раз.'
          });
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
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
        setStatus({
          type: 'error',
          message: 'Не удалось обновить статус оплаты. Попробуйте ещё раз.'
        });
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
  }, [order, token]);

  const total = useMemo(() => {
    if (!order) return 0;
    return moneyToNumber(order.totalAmount || order.total);
  }, [order]);

  const handlePay = async () => {
    if (!receiptEmail.trim()) {
      setStatus({
        type: 'error',
        message: 'Укажите email для отправки чека перед оплатой.'
      });
      return;
    }
    setIsPaying(true);
    setStatus(null);
    try {
      const response = await payPublicOrder({
        token,
        receiptEmail: receiptEmail.trim(),
        returnUrl: `${window.location.origin}/order/${token}`
      });
      if (response?.confirmationUrl) {
        window.location.href = response.confirmationUrl;
        return;
      }
      setStatus({
        type: 'error',
        message: 'Не удалось получить ссылку оплаты. Попробуйте ещё раз.'
      });
    } catch (err) {
      console.error('Payment creation failed:', err);
      setStatus({
        type: 'error',
        message: 'Не удалось создать платёж. Попробуйте ещё раз.'
      });
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
        <Link to="/" className="button-ghost">Вернуться на главную</Link>
      </div>
    );
  }

  const orderStatus = order.status || 'PENDING';
  const statusLabel = statusLabels[orderStatus] || orderStatus;
  const canPay = orderStatus !== 'PAID' && orderStatus !== 'DELIVERED' && orderStatus !== 'REFUNDED';
  const canRefresh = orderStatus !== 'PAID' && orderStatus !== 'DELIVERED' && orderStatus !== 'REFUNDED';

  return (
    <div className="order-page py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Заказ</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Заказ №{String(order.id).slice(0, 8)}…
            </h1>
            <p className="text-sm text-muted mt-1">{statusLabel}</p>
          </div>
          <Link to="/" className="button-ghost text-sm">
            Продолжить покупки →
          </Link>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
          <div className="soft-card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Товары</h2>
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
                        <div className="text-xs text-muted">
                          {item.variantName || item.variantId}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {unitPrice.toLocaleString('ru-RU')} ₽
                        </div>
                        <div className="text-xs text-muted">× {item.quantity}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white/90 p-4">
              <h3 className="text-lg font-semibold mb-3">Email для чека</h3>
              <input
                type="email"
                value={receiptEmail}
                onChange={(event) => setReceiptEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full"
              />
              <p className="text-xs text-muted mt-2">
                Мы пришлём чек и подтверждение оплаты на этот адрес.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="soft-card p-5">
              <h3 className="text-xl font-semibold mb-4">Итого</h3>
              <div className="flex justify-between mb-2 text-sm">
                <span>Товары ({order.items?.length || 0})</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Доставка</span>
                <span>0 ₽</span>
              </div>
              <hr className="my-3 border-ink/10" />
              <div className="flex justify-between font-semibold text-base mb-4">
                <span>Итого</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              {canPay ? (
                <div className="space-y-2">
                  <button className="button w-full" onClick={handlePay} disabled={isPaying}>
                    {isPaying ? 'Создаём платёж…' : 'Оплатить заказ'}
                  </button>
                  {canRefresh && (
                    <button
                      type="button"
                      className="button-gray w-full"
                      onClick={() => refreshPaymentStatus()}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? 'Проверяем оплату…' : 'Проверить оплату'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Оплата получена. Спасибо за заказ!
                </div>
              )}
            </div>
            <div className="soft-card p-4 text-sm space-y-2">
              <p className="font-semibold">Безопасная оплата</p>
              <p className="text-muted">
                Мы используем ЮKassa для защиты платежей и чеков.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderPage;

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { checkoutCart } from '../api';
import { moneyToNumber } from '../utils/product';
import { useAuth } from '../contexts/AuthContext';

function CheckoutPage() {
  const { items, cartId, clearCart } = useContext(CartContext);
  const { tokenParsed, isAuthenticated, hasRole } = useAuth();
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!email) {
      const fallbackEmail =
        tokenParsed?.email ||
        tokenParsed?.preferred_username ||
        tokenParsed?.username ||
        '';
      if (fallbackEmail) {
        setEmail(fallbackEmail);
      }
    }
  }, [email, tokenParsed]);

  if (isManager) {
    return <Navigate to="/cart" replace />;
  }

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity,
        0
      ),
    [items]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!items.length) {
      setStatus({
        type: 'error',
        message: 'Корзина пуста. Добавьте товары перед оформлением заказа.'
      });
      return;
    }

    if (!email.trim()) {
      setStatus({
        type: 'error',
        message: 'Укажите email для отправки чека и деталей заказа.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const id = cartId || localStorage.getItem('cartId');
      const response = await checkoutCart({
        cartId: id,
        receiptEmail: email.trim(),
        returnUrl: `${window.location.origin}/order/{token}`,
        orderPageUrl: `${window.location.origin}/order/{token}`
      });
      clearCart();
      const confirmationUrl = response?.payment?.confirmationUrl;
      if (confirmationUrl) {
        window.location.href = confirmationUrl;
        return;
      }
      setStatus({
        type: 'error',
        message: 'Не удалось получить ссылку оплаты. Попробуйте ещё раз.'
      });
    } catch (err) {
      console.error('Checkout failed:', err);
      setStatus({
        type: 'error',
        message: 'Не удалось оформить заказ. Попробуйте ещё раз.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Оплата заказа</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Подтвердите детали и перейдите к оплате</h1>
            <p className="text-sm text-muted mt-1">
              Мы отправим чек и детали заказа на вашу почту.
            </p>
          </div>
          <Link to="/cart" className="button-ghost text-sm">
            ← Вернуться в корзину
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
              <h2 className="text-xl font-semibold mb-2">Контакт для чека</h2>
              <p className="text-sm text-muted mb-4">
                Укажите email, чтобы получить чек и историю заказа.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm">
                  <span className="text-muted">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full"
                    required
                  />
                </label>
                <button type="submit" className="button" disabled={isSubmitting}>
                  {isSubmitting ? 'Готовим оплату…' : 'Перейти к оплате'}
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Состав заказа</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm shadow-sm"
                  >
                    <div>
                      <div className="font-semibold">
                        {item.productInfo?.name || 'Товар'}
                      </div>
                      <div className="text-xs text-muted">
                        {item.productInfo?.variantName || item.variantId}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {(item.unitPriceValue || moneyToNumber(item.unitPrice)).toLocaleString('ru-RU')} ₽
                      </div>
                      <div className="text-xs text-muted">× {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="soft-card p-5">
              <h3 className="text-xl font-semibold mb-4">Итого</h3>
              <div className="flex justify-between mb-2 text-sm">
                <span>Товары ({items.length})</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Доставка</span>
                <span>0 ₽</span>
              </div>
              <hr className="my-3 border-ink/10" />
              <div className="flex justify-between font-semibold text-base">
                <span>К оплате</span>
                <span>{total.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
            <div className="soft-card p-4 text-sm space-y-2">
              <p className="font-semibold">Оплата через ЮKassa</p>
              <p className="text-muted">
                Вы будете перенаправлены на защищённую страницу оплаты.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;

import React, { useContext, useState } from 'react';
import { CartContext } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { createManagerOrderLink } from '../api';
import { moneyToNumber } from '../utils/product';
import { useAuth } from '../contexts/AuthContext';
import { METRIKA_GOALS, trackMetrikaGoal } from '../utils/metrika';

function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuth();
  const [managerEmail, setManagerEmail] = useState('');
  const [managerLink, setManagerLink] = useState('');
  const [managerStatus, setManagerStatus] = useState(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);

  const total = items.reduce(
    (sum, item) => sum + (item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_CTA_CLICK, {
      cart_items: itemCount,
      cart_total: Math.round(total)
    });
    navigate('/checkout');
  };

  const handleCreateManagerLink = async ({ sendEmail, copyAfter = false } = {}) => {
    const email = managerEmail.trim();
    if (sendEmail && !email) {
      setManagerStatus({
        type: 'error',
        message: 'Укажите email клиента для отправки ссылки.'
      });
      return;
    }
    setIsCreatingLink(true);
    setManagerStatus(null);
    try {
      const cartId = localStorage.getItem('cartId');
      const response = await createManagerOrderLink({
        cartId,
        receiptEmail: email || null,
        orderPageUrl: `${window.location.origin}/order/{token}`,
        sendEmail: Boolean(sendEmail)
      });
      const link = `${window.location.origin}/order/${response.publicToken}`;
      setManagerLink(link);
      if (copyAfter && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        setManagerStatus({
          type: 'success',
          message: 'Ссылка создана и скопирована.'
        });
        return;
      }
      setManagerStatus({
        type: 'success',
        message: sendEmail ? 'Ссылка создана и отправлена клиенту.' : 'Ссылка создана.'
      });
    } catch (err) {
      console.error('Failed to create manager order link:', err);
      setManagerStatus({
        type: 'error',
        message: 'Не удалось создать ссылку. Попробуйте ещё раз.'
      });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!managerLink) return;
    try {
      await navigator.clipboard.writeText(managerLink);
      setManagerStatus({ type: 'success', message: 'Ссылка скопирована.' });
    } catch (err) {
      console.error('Failed to copy link:', err);
      setManagerStatus({ type: 'error', message: 'Не удалось скопировать ссылку.' });
    }
  };

  return (
    <div className="cart-page py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Корзина</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Ваши товары для уюта</h1>
            <p className="text-sm text-muted mt-1">Проверьте состав заказа и добавьте подарок к комплекту.</p>
          </div>
          <Link to="/category/popular" className="button-ghost text-sm">
            Продолжить покупки →
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="soft-card p-8 text-center">
            <p className="text-lg font-semibold mb-2">Корзина пока пуста</p>
            <p className="text-sm text-muted mb-4">
              Выберите товары в каталоге и добавьте их в корзину — мы подготовим всё к доставке.
            </p>
            <Link to="/category/popular" className="button">
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:flex-1 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[26px] border border-white/70 bg-white/85 p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[0_18px_40px_rgba(43,39,34,0.1)]"
                >
                  <div className="w-full sm:w-24 h-24 rounded-2xl overflow-hidden bg-sand/60 border border-white/70 flex-shrink-0">
                    {item.productInfo?.imageUrl ? (
                      <img src={item.productInfo.imageUrl} alt={item.productInfo?.name || 'Товар'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted px-2 text-center">
                        Нет фото
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold m-0">{item.productInfo?.name || 'Товар'}</h4>
                    <p className="text-xs text-muted mt-1">
                      {item.productInfo?.variantName ? `Вариант: ${item.productInfo.variantName}` : item.variantId}
                    </p>
                    <div className="text-accent font-semibold mt-2">
                      {(item.unitPriceValue || moneyToNumber(item.unitPrice)).toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                      <div className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-white/85 px-3 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-lg leading-none"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-lg leading-none"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-xs text-primary"
                      >
                        Добавить ещё одну
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-muted hover:text-primary"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full lg:max-w-sm space-y-4">
              <div className="soft-card p-5">
                <h3 className="text-xl font-semibold mb-4">Сводка заказа</h3>
                <div className="flex justify-between mb-2 text-sm">
                  <span>Товары ({itemCount})</span>
                  <span>{total.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span>Доставка</span>
                  <span>Рассчитаем на следующем шаге</span>
                </div>
                <div className="flex justify-between mb-2 text-sm text-muted">
                  <span>Оплата</span>
                  <span>ЮKassa (карта / SberPay)</span>
                </div>
                <hr className="my-3 border-ink/10" />
                <div className="flex justify-between font-semibold text-base mb-4">
                  <span>Итого</span>
                  <span>{total.toLocaleString('ru-RU')} ₽</span>
                </div>
                {!isManager && (
                  <>
                    <button className="button w-full mb-2" onClick={handleCheckout}>
                      Оформить заказ
                    </button>
                    {!isAuthenticated && (
                      <div className="mb-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-ink/90">
                        Оформление без регистрации уже включено. Для постоянных клиентов доступен вход в аккаунт на шаге оформления.
                      </div>
                    )}
                  </>
                )}
                <button className="button-gray w-full" onClick={clearCart}>
                  Очистить корзину
                </button>
              </div>
              {isManager && (
                <div className="soft-card p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-accent">Инструменты менеджера</p>
                    <h3 className="text-lg font-semibold mt-2">Ссылка на оплату для клиента</h3>
                    <p className="text-sm text-muted mt-1">
                      Сформируйте заказ и отправьте клиенту ссылку на оплату и страницу заказа.
                    </p>
                  </div>
                  <label className="text-sm">
                    <span className="text-muted">Email клиента (для отправки)</span>
                    <input
                      type="email"
                      className="mt-2 w-full"
                      placeholder="client@example.com"
                      value={managerEmail}
                      onChange={(event) => setManagerEmail(event.target.value)}
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      className="button w-full"
                      onClick={() => handleCreateManagerLink({ sendEmail: true })}
                      disabled={isCreatingLink}
                    >
                      {isCreatingLink ? 'Создаём ссылку…' : 'Отправить ссылку'}
                    </button>
                    <button
                      type="button"
                      className="button-gray w-full"
                      onClick={() => handleCreateManagerLink({ sendEmail: false, copyAfter: true })}
                      disabled={isCreatingLink}
                    >
                      {isCreatingLink ? 'Готовим…' : 'Создать и скопировать'}
                    </button>
                  </div>
                  {managerLink && (
                    <div className="rounded-2xl border border-white/70 bg-white/85 p-3 text-xs break-all shadow-sm">
                      <div className="text-muted mb-2">Ссылка для клиента</div>
                      <div className="font-semibold">{managerLink}</div>
                      <button type="button" className="button-ghost text-xs mt-2" onClick={handleCopyLink}>
                        Скопировать ссылку
                      </button>
                    </div>
                  )}
                  {managerStatus && (
                    <div
                      className={`rounded-2xl border px-3 py-2 text-xs ${
                        managerStatus.type === 'error'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-green-200 bg-green-50 text-green-700'
                      }`}
                    >
                      {managerStatus.message}
                    </div>
                  )}
                </div>
              )}
              <div className="soft-card p-4 text-sm space-y-2">
                <p className="font-semibold">Почему с нами спокойно</p>
                <p className="text-muted">Доставка Яндекс и пункты выдачи: сначала видите стоимость и интервал, потом оплачиваете.</p>
                <p className="text-muted">Оплата через защищённую страницу ЮKassa. Поддержка ежедневно с 9:00 до 21:00.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;

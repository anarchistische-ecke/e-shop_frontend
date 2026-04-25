import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui';

function CheckoutPageHeader({ isSubmitting, onDisabledNavigation }) {
  const disabledLinkClass = isSubmitting ? ' pointer-events-none opacity-60' : '';

  return (
    <div className="section-header mb-5">
      <div className="section-header__copy">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">
          Оформление заказа
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Быстрое оформление без лишних шагов
        </h1>
        <p className="mt-1 text-sm text-muted">
          Укажите контакты и домашний адрес. Товары оплачиваются онлайн, а доставку после заказа согласует менеджер.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          as={Link}
          to="/info/delivery"
          variant="ghost"
          size="sm"
          className={disabledLinkClass}
          aria-disabled={isSubmitting}
          onClick={onDisabledNavigation}
        >
          Условия доставки
        </Button>
        <Button
          as={Link}
          to="/cart"
          variant="ghost"
          size="sm"
          className={disabledLinkClass}
          aria-disabled={isSubmitting}
          onClick={onDisabledNavigation}
        >
          ← Вернуться в корзину
        </Button>
      </div>
    </div>
  );
}

export default CheckoutPageHeader;

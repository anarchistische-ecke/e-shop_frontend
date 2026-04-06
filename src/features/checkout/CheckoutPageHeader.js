import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui';

function CheckoutPageHeader({ isSubmitting, onDisabledNavigation }) {
  const disabledLinkClass = isSubmitting ? ' pointer-events-none opacity-60' : '';

  return (
    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">
          Оформление заказа
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Быстрое оформление без лишних шагов
        </h1>
        <p className="mt-1 text-sm text-muted">
          Вы выбираете доставку и полную стоимость до оплаты. Регистрация не обязательна.
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
          Поддержка и доставка
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

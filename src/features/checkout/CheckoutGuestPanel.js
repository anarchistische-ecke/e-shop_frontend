import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { buildLoginRedirectPath, CART_SESSION_STRATEGY } from '../../utils/account';

function CheckoutGuestPanel({
  isSubmitting,
  onDisabledNavigation,
  onGuestCheckout
}) {
  const location = useLocation();
  const disabledLinkClass = isSubmitting ? ' pointer-events-none opacity-60' : '';
  const redirectTo = buildLoginRedirectPath(location, '/checkout');

  return (
    <Card
      variant="tint"
      padding="sm"
      className="mb-5 bg-white/90 shadow-[0_18px_36px_rgba(43,39,34,0.08)]"
    >
      <p className="text-sm font-semibold text-ink">Оформление как гость</p>
      <p className="mt-1 text-xs text-muted leading-relaxed">
        Достаточно email и контакта получателя. Аккаунт нужен только если вы хотите сохранить данные для следующего заказа и видеть историю покупок.
      </p>
      <p className="mt-2 text-xs font-medium text-ink/80">
        {CART_SESSION_STRATEGY.title}. {CART_SESSION_STRATEGY.summary}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          block
          className="justify-start text-left !py-2.5"
          onClick={onGuestCheckout}
          disabled={isSubmitting}
        >
          Оформить как гость
        </Button>
        <Button
          as={Link}
          to="/login"
          state={{ from: redirectTo }}
          variant="ghost"
          block
          className={`justify-start text-left !py-2.5${disabledLinkClass}`}
          aria-disabled={isSubmitting}
          onClick={onDisabledNavigation}
        >
          Войти и сохранить данные
        </Button>
      </div>
    </Card>
  );
}

export default CheckoutGuestPanel;

import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui';

function CheckoutGuestPanel({
  isSubmitting,
  onDisabledNavigation,
  onGuestCheckout
}) {
  const disabledLinkClass = isSubmitting ? ' pointer-events-none opacity-60' : '';

  return (
    <Card
      variant="tint"
      padding="sm"
      className="mb-5 bg-white/90 shadow-[0_18px_36px_rgba(43,39,34,0.08)]"
    >
      <p className="text-sm font-semibold text-ink">Оформление как гость</p>
      <p className="mt-1 text-xs text-muted">
        Достаточно email и контакта получателя. Аккаунт можно использовать только если вам так удобнее.
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
          variant="ghost"
          block
          className={`justify-start text-left !py-2.5${disabledLinkClass}`}
          aria-disabled={isSubmitting}
          onClick={onDisabledNavigation}
        >
          Войти в аккаунт
        </Button>
      </div>
    </Card>
  );
}

export default CheckoutGuestPanel;

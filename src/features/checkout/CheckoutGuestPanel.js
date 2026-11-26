import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { buildLoginRedirectPath } from '../../utils/account';

function CheckoutGuestPanel({ disabled }) {
  const location = useLocation();
  const redirectTo = buildLoginRedirectPath(location, '/checkout');

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 border-y border-ink/10 py-1 text-sm">
      <p className="py-1 font-medium text-ink">Оформление без аккаунта</p>
      <Link
        to="/login"
        state={{ from: redirectTo }}
        className="inline-flex min-h-11 items-center font-medium text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary aria-disabled:pointer-events-none aria-disabled:opacity-60"
        aria-disabled={disabled}
        onClick={disabled ? (event) => event.preventDefault() : undefined}
      >
        Войти в аккаунт
      </Link>
    </div>
  );
}

export default CheckoutGuestPanel;

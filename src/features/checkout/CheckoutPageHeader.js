import React from 'react';
import { Link } from 'react-router-dom';

function CheckoutPageHeader({ isSubmitting, onDisabledNavigation }) {
  return (
    <header className="mb-5 sm:mb-7">
      <Link
        to="/cart"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-60"
        aria-disabled={isSubmitting}
        onClick={onDisabledNavigation}
      >
        <span aria-hidden="true">←</span> В корзину
      </Link>
      <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">Оформление заказа</h1>
    </header>
  );
}

export default CheckoutPageHeader;

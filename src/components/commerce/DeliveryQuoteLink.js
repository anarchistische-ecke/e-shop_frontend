import React from 'react';
import { Link } from 'react-router-dom';

function DeliveryQuoteLink({ className = '', disabled = false, onClick }) {
  return (
    <Link
      to="/info/delivery#delivery-contact"
      className={`inline-flex min-h-11 max-w-full items-center font-semibold leading-snug text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary aria-disabled:pointer-events-none aria-disabled:opacity-60 ${className}`}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={disabled ? (event) => event.preventDefault() : onClick}
    >
      Уточнить доставку до оплаты
    </Link>
  );
}

export default DeliveryQuoteLink;

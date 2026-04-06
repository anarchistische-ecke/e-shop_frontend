import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';
import { CartIcon } from './icons';

function CartButton({ totalItems }) {
  return (
    <Button
      as={Link}
      to="/cart"
      aria-label="Корзина"
      variant="secondary"
      size="sm"
      className="relative px-3"
    >
      <CartIcon className="h-5 w-5" />
      <span className="hidden text-sm font-medium sm:inline">Корзина</span>
      {totalItems > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] leading-none text-white">
          {totalItems}
        </span>
      ) : null}
    </Button>
  );
}

export default CartButton;

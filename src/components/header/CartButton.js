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
      variant="ghost"
      size="icon"
      className="relative text-primary"
    >
      <CartIcon className="h-5 w-5" />
      {totalItems > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] leading-none text-white">
          {totalItems}
        </span>
      ) : null}
    </Button>
  );
}

export default CartButton;

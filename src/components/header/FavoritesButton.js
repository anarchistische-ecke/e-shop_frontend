import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';
import { HeartIcon } from './icons';

function FavoritesButton({ totalItems = 0 }) {
  return (
    <Button
      as={Link}
      to="/favorites"
      aria-label="Избранное"
      variant="secondary"
      size="sm"
      className="relative px-3"
    >
      <HeartIcon className="h-5 w-5" filled={totalItems > 0} />
      <span className="hidden text-sm font-medium sm:inline">Избранное</span>
      {totalItems > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] leading-none text-white">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      ) : null}
    </Button>
  );
}

export default FavoritesButton;

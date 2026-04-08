import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';

function HeaderBrand({ isMenuOpen, onMenuToggle, wayfindingLabel }) {
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="lg:hidden"
        onClick={onMenuToggle}
        aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? '✕' : '☰'}
      </Button>

      <div className="min-w-0">
        <Link
          to="/"
          className="block truncate font-display text-lg font-semibold leading-none tracking-tight text-ink transition hover:text-primary sm:text-2xl lg:text-3xl"
        >
          Постельное Белье-ЮГ
        </Link>
        <p className="mt-0.5 hidden truncate text-[11px] uppercase tracking-[0.18em] text-muted sm:block">
          Раздел: {wayfindingLabel}
        </p>
      </div>
    </div>
  );
}

export default HeaderBrand;

import React from 'react';
import { Link } from 'react-router-dom';

function HeaderBrand({ wayfindingLabel }) {
  return (
    <div className="min-w-0">
      <Link
        to="/"
        className="touch-link focus-ring-soft block rounded-xl truncate font-display text-base font-semibold leading-none tracking-tight text-ink transition hover:text-primary sm:text-2xl lg:text-3xl"
      >
        Постельное Белье-ЮГ
      </Link>
      <p className="mt-0.5 hidden truncate text-[11px] uppercase tracking-[0.18em] text-muted sm:block">
        Раздел: {wayfindingLabel}
      </p>
    </div>
  );
}

export default HeaderBrand;

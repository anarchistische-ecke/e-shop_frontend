import React from 'react';
import { Link } from 'react-router-dom';

function HeaderBrand({ siteName, wayfindingLabel }) {
  return (
    <div className="min-w-0 lg:relative lg:h-11 lg:self-center">
      <Link
        to="/"
        className="touch-link focus-ring-soft flex min-h-[28px] items-center truncate rounded-xl font-display text-base font-semibold leading-none tracking-tight text-ink transition hover:text-primary sm:text-2xl lg:h-11 lg:min-h-11 lg:text-3xl"
      >
        {siteName}
      </Link>
      <p className="mt-0.5 hidden truncate text-[11px] uppercase tracking-[0.18em] text-muted sm:block lg:absolute lg:left-0 lg:top-[calc(100%-0.4rem)] lg:mt-0 lg:max-w-full">
        Раздел: {wayfindingLabel}
      </p>
    </div>
  );
}

export default HeaderBrand;

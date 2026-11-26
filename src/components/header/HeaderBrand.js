import React from 'react';
import { Link } from 'react-router-dom';

function HeaderBrand({ siteName }) {
  return (
    <Link
      to="/"
      className="focus-ring-soft inline-flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg font-display text-[1.125rem] font-semibold tracking-tight text-primary lg:gap-3 lg:text-[1.45rem]"
    >
      <span aria-hidden="true" className="relative grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-md border border-current lg:h-7 lg:w-7">
        <span className="absolute h-5 w-px rotate-45 bg-current" />
        <span className="absolute h-5 w-px -rotate-45 bg-current" />
        <span className="absolute h-1.5 w-1.5 rotate-45 border border-current bg-white" />
      </span>
      <span className="truncate">{siteName}</span>
    </Link>
  );
}

export default HeaderBrand;

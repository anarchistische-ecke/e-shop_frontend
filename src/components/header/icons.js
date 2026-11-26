import React from 'react';

function LineIcon({ className = 'h-5 w-5', fill = 'none', children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function MenuIcon({ className }) {
  return <LineIcon className={className}><path d="M4 6h16M4 12h16M4 18h16" /></LineIcon>;
}

export function GridIcon({ className }) {
  return (
    <LineIcon className={className}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </LineIcon>
  );
}

export function ListIcon({ className }) {
  return (
    <LineIcon className={className}>
      <path d="M4 6h1m4 0h11M4 12h1m4 0h11M4 18h1m4 0h11" />
    </LineIcon>
  );
}

export function CloseIcon({ className }) {
  return <LineIcon className={className}><path d="m6 6 12 12M18 6 6 18" /></LineIcon>;
}

export function ArrowRightIcon({ className }) {
  return <LineIcon className={className}><path d="M4.5 12h14m-6-6 6 6-6 6" /></LineIcon>;
}

export function CheckIcon({ className }) {
  return <LineIcon className={className}><path d="m5 12 4.5 4.5L19 7" /></LineIcon>;
}

export function TruckIcon({ className }) {
  return (
    <LineIcon className={className}>
      <path d="M2.5 17V5h12v12m0-8h4l3 3v5h-2M8 17h8M2.5 17H4" />
      <circle cx="6" cy="17" r="2" /><circle cx="17.5" cy="17" r="2" />
    </LineIcon>
  );
}

export function ShieldIcon({ className }) {
  return (
    <LineIcon className={className}>
      <path d="M12 3.5 20 7v5c0 3.5-2.8 6.8-8 8.5-5.2-1.7-8-5-8-8.5V7Z" />
      <path d="m8.5 12 2.25 2.25L15.5 9.5" />
    </LineIcon>
  );
}

export function ReturnIcon({ className }) {
  return (
    <LineIcon className={className}>
      <path d="M4.5 10h10a5 5 0 0 1 0 10h-3M9 5.5 4.5 10 9 14.5" />
    </LineIcon>
  );
}

export function TrashIcon({ className }) {
  return (
    <LineIcon className={className}>
      <path d="M4 6h16M9 6V3.5h6V6M6 6l.8 14h10.4L18 6m-8 4v6m4-6v6" />
    </LineIcon>
  );
}

export function ChatIcon({ className }) {
  return (
    <LineIcon className={className}>
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.5-3a7.5 7.5 0 1 1 13.5-4.5Z" />
      <path d="M9 11h7m-7 3h4" />
    </LineIcon>
  );
}

export function HomeIcon({ className }) {
  return (
    <LineIcon className={className}>
      <path d="m3.5 10.5 8.5-6.5 8.5 6.5M6.5 9.5V20h11V9.5M10 20v-5.5h4V20" />
    </LineIcon>
  );
}

export function SearchIcon({ className }) {
  return (
    <LineIcon className={className}>
      <circle cx="10.75" cy="10.75" r="6.75" />
      <path d="m20.5 20.5-5-5" />
    </LineIcon>
  );
}

export const CatalogIcon = GridIcon;

export function ChevronIcon({ className = 'h-4 w-4', isOpen = false }) {
  return (
    <LineIcon className={`${className} transition-transform ${isOpen ? 'rotate-180' : ''}`}>
      <path d="m6 9 6 6 6-6" />
    </LineIcon>
  );
}

export function CartIcon({ className }) {
  return (
    <LineIcon className={className}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M3 4h2l2.5 10.5a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L21 7H7" />
    </LineIcon>
  );
}

export function HeartIcon({ className, filled = false }) {
  return (
    <LineIcon className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M20.5 5.8a5.2 5.2 0 0 0-7.4 0L12 6.9l-1.1-1.1a5.2 5.2 0 0 0-7.4 7.4L12 21l8.5-7.8a5.2 5.2 0 0 0 0-7.4z" />
    </LineIcon>
  );
}

export function UserIcon({ className }) {
  return (
    <LineIcon className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </LineIcon>
  );
}

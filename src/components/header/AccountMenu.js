import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';
import { UserIcon } from './icons';

function LoggedOutAccountButton() {
  return (
    <Button
      as={Link}
      to="/login"
      aria-label="Войти"
      variant="secondary"
      size="sm"
      className="gap-2 px-3"
    >
      <UserIcon className="h-5 w-5" />
      <span className="hidden text-sm sm:inline">Войти</span>
    </Button>
  );
}

function LoggedInAccountMenu({
  accountLinks,
  accountMenuRef,
  displayName,
  displayPhone,
  isAccountMenuOpen,
  onAccountNav,
  onAccountTrigger,
  onLogout
}) {
  return (
    <>
      <Button
        as={Link}
        to="/account"
        aria-label="Личный кабинет"
        variant="secondary"
        size="icon"
        className="md:hidden"
      >
        <UserIcon className="h-5 w-5" />
      </Button>

      <div ref={accountMenuRef} className="relative hidden md:block">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Личный кабинет"
          className="gap-2 px-3"
          onClick={onAccountTrigger}
          aria-expanded={isAccountMenuOpen}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sand/70 text-accent">
            <UserIcon className="h-4 w-4" />
          </span>
          <span className="hidden text-sm font-medium lg:inline">Мой кабинет</span>
        </Button>

        <div
          className={`absolute right-0 top-full mt-3 w-72 transition-all duration-200 ${
            isAccountMenuOpen
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-2 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-[24px] border border-ink/10 bg-white shadow-[0_24px_60px_rgba(43,39,34,0.18)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-ink/10 bg-sand/40 px-4 py-4">
              <div>
                <p className="text-base font-semibold leading-tight">{displayName}</p>
                <p className="mt-1 text-xs text-muted">{displayPhone}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onLogout}
                aria-label="Выйти"
              >
                ↗
              </Button>
            </div>
            <div className="py-2">
              {accountLinks.map((entry) => (
                <Link
                  key={entry.to}
                  to={entry.to}
                  onClick={onAccountNav}
                  className="block px-4 py-2.5 text-sm text-ink transition hover:bg-sand/45"
                >
                  {entry.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AccountMenu(props) {
  if (!props.isAuthenticated) {
    return <LoggedOutAccountButton />;
  }

  return <LoggedInAccountMenu {...props} />;
}

export default AccountMenu;

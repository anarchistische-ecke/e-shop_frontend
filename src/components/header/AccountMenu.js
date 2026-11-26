import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui';
import { UserIcon } from './icons';
import { buildLoginRedirectPath } from '../../utils/account';

function LoggedOutAccountButton() {
  const location = useLocation();
  const redirectTo = buildLoginRedirectPath(location);

  return (
    <Button
      as={Link}
      to="/login"
      state={{ from: redirectTo }}
      aria-label="Войти"
      variant="ghost"
      size="icon"
      className="text-primary"
    >
      <UserIcon className="h-5 w-5" />
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
        variant="ghost"
        size="icon"
        className="md:hidden"
      >
        <UserIcon className="h-5 w-5" />
      </Button>

      <div ref={accountMenuRef} className="relative hidden md:block">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Личный кабинет"
          className="text-primary"
          onClick={onAccountTrigger}
          aria-expanded={isAccountMenuOpen}
        >
          <UserIcon className="h-5 w-5" />
        </Button>

        <div
          className={`absolute right-0 top-full mt-3 w-72 transition-all duration-200 ${
            isAccountMenuOpen
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-2 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-[0_24px_60px_rgba(43,39,34,0.18)]">
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
                  className="touch-link block px-4 py-2.5 text-sm text-ink transition hover:bg-primary/5"
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

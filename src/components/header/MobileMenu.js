import React from 'react';
import { Link } from 'react-router-dom';
import TrustLinksPanel from '../TrustLinksPanel';
import { MOBILE_TRUST_LINK_IDS } from '../../data/trustLinks';
import { Input } from '../ui';
import { resolveCategoryToken } from '../../utils/header';
import { SearchIcon } from './icons';

function MobileMenu({
  activeMobileParent,
  childrenByParent,
  isOpen,
  mobileCategories,
  mobilePath,
  mobileTitle,
  onClose,
  onOpenCategory,
  onSearchChange,
  onSearchFocus,
  onSearchSubmit,
  onStepBack,
  searchTerm
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[70] bg-black/40 lg:hidden"
        onClick={onClose}
        aria-label="Закрыть меню"
      />

      <aside className="fixed inset-y-0 left-0 z-[80] flex w-[min(88vw,360px)] flex-col border-r border-ink/10 bg-white/98 shadow-[0_24px_60px_rgba(43,39,34,0.25)] lg:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-ink/10 px-4 pb-4 pt-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Навигация</p>
            <p className="mt-1 text-sm font-semibold">{mobileTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {mobilePath.length > 0 ? (
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-2xl border border-ink/10 px-3 text-xs text-ink hover:border-primary/35 hover:text-primary"
                onClick={onStepBack}
              >
                ← Назад
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 text-ink hover:border-primary/35 hover:text-primary"
              onClick={onClose}
              aria-label="Закрыть меню"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="border-b border-ink/10 px-4 py-4">
          <form onSubmit={onSearchSubmit} className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
            <Input
              type="text"
              value={searchTerm}
              onChange={onSearchChange}
              onFocus={onSearchFocus}
              placeholder="Поиск по каталогу"
              className="bg-white pl-10 pr-3"
              aria-label="Поиск по каталогу"
            />
          </form>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              to="/catalog"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ink/10 bg-white text-sm font-medium text-ink"
            >
              Каталог
            </Link>
            <Link
              to="/category/popular"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ink/10 bg-white text-sm font-medium text-ink"
            >
              Лучшее
            </Link>
          </div>
        </div>

        <div className="border-b border-ink/10 px-4 py-4">
          <TrustLinksPanel
            title="Почему нам доверяют"
            description="Оплата, доставка, производство и документы доступны прямо из меню."
            linkIds={MOBILE_TRUST_LINK_IDS}
            compact
            onNavigate={onClose}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeMobileParent ? (
            <Link
              to={`/category/${resolveCategoryToken(activeMobileParent)}`}
              onClick={onClose}
              className="mb-3 inline-flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
            >
              <span>Смотреть всё: {activeMobileParent.name}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}

          <ul className="space-y-1.5">
            {mobileCategories.map((category) => {
              const token = resolveCategoryToken(category);
              const nested = childrenByParent[String(category.id)] || [];
              const hasNested = nested.length > 0;

              if (hasNested) {
                return (
                  <li key={token}>
                    <button
                      type="button"
                      className="grid min-h-[44px] w-full grid-cols-[minmax(0,1fr)_auto] items-center rounded-2xl border border-ink/10 bg-white px-3 py-2 text-left text-sm text-ink"
                      onClick={() => onOpenCategory(token)}
                    >
                      <span>{category.name}</span>
                      <span className="text-ink/45" aria-hidden="true">
                        ›
                      </span>
                    </button>
                  </li>
                );
              }

              return (
                <li key={token}>
                  <Link
                    to={`/category/${token}`}
                    className="grid min-h-[44px] w-full grid-cols-[minmax(0,1fr)_auto] items-center rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
                    onClick={onClose}
                  >
                    <span>{category.name}</span>
                    <span className="text-ink/45" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}

            {mobileCategories.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-ink/20 bg-white px-3 py-3 text-sm text-muted">
                Категории появятся после заполнения каталога.
              </li>
            ) : null}
          </ul>
        </div>
      </aside>
    </>
  );
}

export default MobileMenu;

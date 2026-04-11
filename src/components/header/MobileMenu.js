import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TrustLinksPanel from '../TrustLinksPanel';
import { MOBILE_TRUST_LINK_IDS } from '../../data/trustLinks';
import { Button, Input } from '../ui';
import CategoryGlyph from '../navigation/CategoryGlyph';
import { resolveCategoryToken } from '../../utils/header';
import { focusFirstElement, trapFocusEvent } from '../../utils/a11y';
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
  onTrackCategoryClick,
  searchTerm
}) {
  const panelRef = useRef(null);
  const searchInputRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const [isMounted, setIsMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      return undefined;
    }

    const closeTimer = window.setTimeout(() => {
      setIsMounted(false);
    }, 220);

    return () => window.clearTimeout(closeTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.requestAnimationFrame(() => {
      if (searchInputRef.current instanceof HTMLElement) {
        searchInputRef.current.focus();
        return;
      }
      focusFirstElement(panelRef.current, panelRef.current);
    });

    const handleKeyDown = (event) => {
      trapFocusEvent(event, panelRef.current);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);

      if (lastFocusedRef.current instanceof HTMLElement && lastFocusedRef.current.isConnected) {
        window.requestAnimationFrame(() => {
          lastFocusedRef.current?.focus();
        });
      }
    };
  }, [isOpen, onClose]);

  if (!isMounted) {
    return null;
  }

  return (
    <aside
      id="mobile-nav-panel"
      ref={panelRef}
      data-testid="mobile-nav-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Меню каталога"
      aria-hidden={!isOpen}
      tabIndex={-1}
      className={`viewport-fixed-screen fixed inset-0 z-[130] flex flex-col bg-[#fbf7f1]/98 backdrop-blur-xl transition duration-200 lg:hidden ${
        isOpen
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="sticky top-0 z-10 border-b border-ink/10 bg-[#fbf7f1]/96 pb-4 pt-5 shadow-[0_16px_32px_rgba(43,39,34,0.08)]">
          <div className="page-shell">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Навигация</p>
                <div className="mt-1 min-w-0">
                  <Link
                    to="/"
                    onClick={onClose}
                    className="block truncate font-display text-xl font-semibold leading-none tracking-tight text-ink"
                  >
                    Постельное Белье-ЮГ
                  </Link>
                  <p className="mt-1 text-sm font-semibold text-ink">{mobileTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {mobilePath.length > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onStepBack}
                  >
                    ← Назад
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={onClose}
                  aria-label="Закрыть меню"
                >
                  ✕
                </Button>
              </div>
            </div>

            <form onSubmit={onSearchSubmit} className="relative mt-4">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
              <Input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={onSearchChange}
                onFocus={onSearchFocus}
                placeholder="Поиск в каталоге"
                className="bg-white pl-10 pr-3"
                aria-label="Поиск по каталогу"
                enterKeyHint="search"
              />
            </form>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                to="/catalog"
                onClick={() => {
                  onTrackCategoryClick('catalog', 'mobile_menu');
                  onClose();
                }}
                className="focus-ring-soft inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-medium text-ink shadow-[0_10px_24px_rgba(43,39,34,0.08)]"
              >
                Весь каталог
              </Link>
              <Link
                to="/category/new"
                onClick={() => {
                  onTrackCategoryClick('new', 'mobile_menu');
                  onClose();
                }}
                className="focus-ring-soft inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-medium text-ink shadow-[0_10px_24px_rgba(43,39,34,0.08)]"
              >
                Новинки
              </Link>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/category/popular"
                onClick={() => {
                  onTrackCategoryClick('popular', 'mobile_menu');
                  onClose();
                }}
                className="focus-ring-soft inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-medium text-ink"
              >
                Лучшее
              </Link>
              <Link
                to="/info/delivery"
                onClick={onClose}
                className="focus-ring-soft inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-medium text-ink"
              >
                Доставка
              </Link>
            </div>
          </div>
        </div>

        <div className="page-shell space-y-5 py-4">
          {activeMobileParent ? (
            <Link
              to={`/category/${resolveCategoryToken(activeMobileParent)}`}
              onClick={() => {
                onTrackCategoryClick(resolveCategoryToken(activeMobileParent), 'mobile_menu_parent');
                onClose();
              }}
              className="focus-ring-soft inline-flex min-h-[48px] w-full items-center justify-between rounded-[24px] border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
            >
              <span>Смотреть всё: {activeMobileParent.name}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Каталог</p>
                <p className="mt-1 text-sm text-ink/75">
                  Выберите раздел и перейдите к товарам без скрытых свайпов.
                </p>
              </div>
            </div>

            <nav aria-label="Разделы каталога">
              <ul className="space-y-2">
              {mobileCategories.map((category) => {
              const token = resolveCategoryToken(category);
              const nested = childrenByParent[String(category.id)] || [];
              const hasNested = nested.length > 0;

              if (hasNested) {
                return (
                  <li key={token}>
                    <button
                      type="button"
                      className="focus-ring-soft grid min-h-[58px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[24px] border border-ink/10 bg-white px-4 py-3 text-left text-sm text-ink shadow-[0_10px_24px_rgba(43,39,34,0.08)]"
                      onClick={() => onOpenCategory(token)}
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 bg-sand/35 text-ink/80">
                        <CategoryGlyph category={category} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{category.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {(childrenByParent[String(category.id)] || []).length} подкатегорий
                        </span>
                      </span>
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
                    className="focus-ring-soft grid min-h-[58px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[24px] border border-ink/10 bg-white px-4 py-3 text-sm text-ink shadow-[0_10px_24px_rgba(43,39,34,0.08)]"
                    onClick={() => {
                      onTrackCategoryClick(token, 'mobile_menu_category');
                      onClose();
                    }}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 bg-sand/35 text-ink/80">
                      <CategoryGlyph category={category} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{category.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {category.description || 'Открыть подборку товаров'}
                      </span>
                    </span>
                    <span className="text-ink/45" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}

            {mobileCategories.length === 0 ? (
              <li className="rounded-[24px] border border-dashed border-ink/20 bg-white px-4 py-4 text-sm text-muted">
                Категории появятся после заполнения каталога.
              </li>
            ) : null}
              </ul>
            </nav>
          </section>

          <section className="rounded-[28px] border border-ink/10 bg-white/90 p-4 shadow-[0_14px_30px_rgba(43,39,34,0.08)]">
            <TrustLinksPanel
              title="Почему нам доверяют"
              description="Оплата, доставка, производство и документы доступны прямо из меню."
              linkIds={MOBILE_TRUST_LINK_IDS}
              compact
              onNavigate={onClose}
            />
          </section>
        </div>
      </div>
    </aside>
  );
}

export default MobileMenu;

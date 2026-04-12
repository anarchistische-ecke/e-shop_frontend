import React, { useEffect, useRef, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { Link } from 'react-router-dom';
import TrustLinksPanel from '../TrustLinksPanel';
import { MOBILE_TRUST_LINK_IDS } from '../../data/trustLinks';
import { Button } from '../ui';
import CategoryGlyph from '../navigation/CategoryGlyph';
import { buildSearchHref } from '../../features/product-list/url';
import { resolveCategoryToken } from '../../utils/header';

function isInternalUrl(url) {
  return typeof url === 'string' && url.startsWith('/');
}

function MobileUtilityLink({ item, onClose }) {
  if (!item?.label || !item?.url) {
    return null;
  }

  const className =
    'focus-ring-soft inline-flex min-h-[42px] items-center rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-medium text-ink shadow-[0_10px_24px_rgba(43,39,34,0.08)]';

  if (isInternalUrl(item.url)) {
    return (
      <Link to={item.url} onClick={onClose} className={className}>
        {item.label}
      </Link>
    );
  }

  return (
    <a
      href={item.url}
      onClick={onClose}
      className={className}
      rel={item.openInNewTab ? 'noreferrer' : undefined}
      target={item.openInNewTab ? '_blank' : undefined}
    >
      {item.label}
    </a>
  );
}

function MobileMenu({
  activeMobileParent,
  childrenByParent,
  isOpen,
  mobileCategories,
  mobilePath,
  mobileTitle,
  onClose,
  onOpenCategory,
  onStepBack,
  onTrackCategoryClick,
  searchTerm,
  siteName,
  utilityNavigation = []
}) {
  const panelRef = useRef(null);
  const backButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
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

  if (!isMounted) {
    return null;
  }

  return (
    <FocusTrap
      active={isOpen}
      focusTrapOptions={{
        initialFocus: () =>
          backButtonRef.current || closeButtonRef.current || panelRef.current,
        fallbackFocus: () => panelRef.current,
        escapeDeactivates: false,
        clickOutsideDeactivates: false,
        returnFocusOnDeactivate: true
      }}
    >
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
            <div className="page-shell space-y-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Навигация</p>
                  <Link
                    to="/"
                    onClick={onClose}
                    className="mt-1 block truncate font-display text-xl font-semibold leading-none tracking-tight text-ink"
                  >
                    {siteName}
                  </Link>
                  <p className="mt-1 text-sm font-semibold text-ink">{mobileTitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  {mobilePath.length > 0 ? (
                    <Button
                      ref={backButtonRef}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={onStepBack}
                    >
                      Назад
                    </Button>
                  ) : null}
                  <Button
                    ref={closeButtonRef}
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

              <Link
                to={buildSearchHref({ query: searchTerm.trim() })}
                onClick={onClose}
                className="focus-ring-soft flex min-h-[52px] items-center justify-between gap-3 rounded-[24px] border border-ink/10 bg-white px-4 py-3 text-sm font-medium text-ink shadow-[0_10px_24px_rgba(43,39,34,0.08)]"
              >
                <span className="truncate">
                  {searchTerm.trim() || 'Перейти к поиску товаров и категорий'}
                </span>
                <span className="text-ink/45" aria-hidden="true">
                  →
                </span>
              </Link>

              <div className="grid grid-cols-2 gap-2">
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

              {utilityNavigation.length > 0 ? (
                <section className="rounded-[24px] border border-ink/10 bg-white/90 p-3 shadow-[0_10px_24px_rgba(43,39,34,0.08)]">
                  <div className="space-y-3">
                    {utilityNavigation.map((group) => (
                      <div key={group.key || group.title} className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
                          {group.title}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(group.items || []).map((item) => (
                            <MobileUtilityLink
                              key={`${group.key || group.title}:${item.label}:${item.url}`}
                              item={item}
                              onClose={onClose}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
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
              <div className="mb-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Каталог</p>
                <p className="mt-1 text-sm text-ink/75">
                  Разделы каталога открываются списком, без скрытых свайпов и мелких попаданий.
                </p>
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
                                {nested.length} подкатегорий
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
    </FocusTrap>
  );
}

export default MobileMenu;

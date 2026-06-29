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
    'focus-ring-soft inline-flex min-h-[42px] items-center rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-medium text-ink shadow-[0_8px_18px_rgba(43,39,34,0.08)]';

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

function MobileCategoryItem({
  category,
  childrenByParent,
  onClose,
  onTrackCategoryClick
}) {
  const token = resolveCategoryToken(category);
  const nestedCategories = childrenByParent[String(category.id)] || [];

  return (
    <li className="min-w-0">
      <article className="rounded-[22px] border border-ink/10 bg-white shadow-[0_10px_22px_rgba(43,39,34,0.08)]">
        <Link
          to={`/category/${token}`}
          className="focus-ring-soft grid min-h-[64px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[22px] px-4 py-3 text-sm text-ink"
          onClick={() => {
            onTrackCategoryClick(token, 'mobile_menu_category');
            onClose();
          }}
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 bg-sand/35 text-ink/80">
            <CategoryGlyph category={category} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{category.name}</span>
            <span className="block truncate text-xs text-muted">
              {nestedCategories.length > 0
                ? `${nestedCategories.length} подкатегорий`
                : category.description || 'Открыть раздел'}
            </span>
          </span>
          <span className="text-ink/45" aria-hidden="true">→</span>
        </Link>

        {nestedCategories.length > 0 ? (
          <div className="grid gap-2 border-t border-ink/10 px-4 pb-4 pt-3">
            {nestedCategories.map((subCategory) => {
              const childToken = resolveCategoryToken(subCategory);

              return (
                <Link
                  key={childToken}
                  to={`/category/${childToken}`}
                  className="focus-ring-soft inline-flex min-h-[44px] items-center justify-between rounded-2xl border border-ink/10 bg-sand/25 px-3 py-2 text-sm font-medium text-ink"
                  onClick={() => {
                    onTrackCategoryClick(childToken, 'mobile_menu_subcategory');
                    onClose();
                  }}
                >
                  <span className="truncate">{subCategory.name}</span>
                  <span className="text-ink/45" aria-hidden="true">→</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </article>
    </li>
  );
}

function MobileMenu({
  childrenByParent,
  isOpen,
  mobileCategories,
  onClose,
  onTrackCategoryClick,
  searchTerm,
  siteName,
  utilityNavigation = [],
  wishlistCount = 0
}) {
  const panelRef = useRef(null);
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
        initialFocus: () => closeButtonRef.current || panelRef.current,
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
        <header className="shrink-0 border-b border-ink/10 bg-[#fbf7f1] shadow-[0_12px_24px_rgba(43,39,34,0.08)]">
          <div className="page-shell grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Навигация</p>
              <Link
                to="/"
                onClick={onClose}
                className="mt-1 block truncate font-display text-xl font-semibold leading-none text-ink"
              >
                {siteName}
              </Link>
              <p className="mt-1 text-sm font-semibold text-ink">Каталог</p>
            </div>

            <Button
              ref={closeButtonRef}
              type="button"
              variant="secondary"
              size="icon"
              onClick={onClose}
              aria-label="Закрыть меню"
            >
              ×
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="page-shell space-y-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-4">
            <nav aria-label="Быстрые действия" className="space-y-3">
              <Link
                to={buildSearchHref({ query: searchTerm.trim() })}
                onClick={onClose}
                className="focus-ring-soft flex min-h-[52px] items-center justify-between gap-3 rounded-[22px] border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-[0_10px_22px_rgba(43,39,34,0.08)]"
              >
                <span className="truncate">
                  {searchTerm.trim() || 'Перейти к поиску товаров и категорий'}
                </span>
                <span className="text-ink/45" aria-hidden="true">→</span>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/catalog"
                  onClick={() => {
                    onTrackCategoryClick('catalog', 'mobile_menu');
                    onClose();
                  }}
                  className="focus-ring-soft inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 px-3 text-sm font-semibold text-primary"
                >
                  Весь каталог
                </Link>
                <Link
                  to="/category/new"
                  onClick={() => {
                    onTrackCategoryClick('new', 'mobile_menu');
                    onClose();
                  }}
                  className="focus-ring-soft inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-ink/10 bg-white px-3 text-sm font-semibold text-ink"
                >
                  Новинки
                </Link>
                <Link
                  to="/favorites"
                  onClick={onClose}
                  className="focus-ring-soft inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-ink/10 bg-white px-3 text-sm font-semibold text-ink"
                >
                  Избранное{wishlistCount > 0 ? ` · ${wishlistCount}` : ''}
                </Link>
              </div>
            </nav>

            <section>
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted">Каталог</p>
              <nav aria-label="Разделы каталога">
                <ul className="space-y-2">
                  {mobileCategories.map((category) => (
                    <MobileCategoryItem
                      key={resolveCategoryToken(category)}
                      category={category}
                      childrenByParent={childrenByParent}
                      onClose={onClose}
                      onTrackCategoryClick={onTrackCategoryClick}
                    />
                  ))}

                  {mobileCategories.length === 0 ? (
                    <li className="rounded-[22px] border border-dashed border-ink/20 bg-white px-4 py-4 text-sm text-muted">
                      Категории появятся после заполнения каталога.
                    </li>
                  ) : null}
                </ul>
              </nav>
            </section>

            {utilityNavigation.length > 0 ? (
              <section>
                <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted">
                  Полезное
                </p>
                <div className="flex flex-wrap gap-2">
                  {utilityNavigation.flatMap((group) =>
                    (group.items || []).map((item) => (
                      <MobileUtilityLink
                        key={`${group.key || group.title}:${item.label}:${item.url}`}
                        item={item}
                        onClose={onClose}
                      />
                    ))
                  )}
                </div>
              </section>
            ) : null}

            <section className="rounded-[22px] border border-ink/10 bg-white p-4 shadow-[0_10px_22px_rgba(43,39,34,0.08)]">
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

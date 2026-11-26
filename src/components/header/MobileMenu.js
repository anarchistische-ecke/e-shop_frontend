import React, { useEffect, useRef, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { Link } from 'react-router-dom';
import TrustLinksPanel from '../TrustLinksPanel';
import { MOBILE_TRUST_LINK_IDS } from '../../data/trustLinks';
import { Button } from '../ui';
import CategoryGlyph from '../navigation/CategoryGlyph';
import { buildSearchHref } from '../../features/product-list/url';
import { resolveCategoryToken } from '../../utils/header';
import { ArrowRightIcon, CloseIcon } from './icons';

function isInternalUrl(url) {
  return typeof url === 'string' && url.startsWith('/');
}

function MobileUtilityLink({ item, onClose }) {
  if (!item?.label || !item?.url) {
    return null;
  }

  const className =
    'focus-ring-soft inline-flex min-h-11 items-center rounded-md border border-line bg-white px-3 py-1.5 text-sm font-medium text-primary';

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
      <article className="border-b border-line">
        <Link
          to={`/category/${token}`}
          className="focus-ring-soft grid min-h-[52px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2.5 py-2 text-sm text-ink hover:bg-primary/5"
          onClick={() => {
            onTrackCategoryClick(token, 'mobile_menu_category');
            onClose();
          }}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center text-primary">
            <CategoryGlyph category={category} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{category.name}</span>
          </span>
          <ArrowRightIcon className="h-4 w-4 text-primary" />
        </Link>

        {nestedCategories.length > 0 ? (
          <div className="flex flex-wrap gap-x-3 pl-[3.25rem]">
            {nestedCategories.map((subCategory) => {
              const childToken = resolveCategoryToken(subCategory);

              return (
                <Link
                  key={childToken}
                  to={`/category/${childToken}`}
                  className="focus-ring-soft inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted hover:text-primary"
                  onClick={() => {
                    onTrackCategoryClick(childToken, 'mobile_menu_subcategory');
                    onClose();
                  }}
                >
                  <span className="truncate">{subCategory.name}</span>
                  <ArrowRightIcon className="h-4 w-4 text-primary" />
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
        className={`viewport-fixed-screen fixed inset-0 z-[130] flex flex-col bg-canvas transition duration-200 lg:hidden ${
          isOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <header className="shrink-0 border-b border-line bg-white">
          <div className="page-shell grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pb-2 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]">
            <div className="min-w-0">
              <Link
                to="/"
                onClick={onClose}
                className="focus-ring-soft flex min-h-11 items-center rounded-md font-display text-xl font-semibold leading-none text-primary"
              >
                {siteName}
              </Link>
            </div>

            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Закрыть меню"
            >
              <CloseIcon className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="page-shell space-y-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-4">
            <nav aria-label="Быстрые действия" className="space-y-3">
              <Link
                to={buildSearchHref({ query: searchTerm.trim() })}
                onClick={onClose}
                className="focus-ring-soft flex min-h-[48px] items-center justify-between gap-3 rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink"
              >
                <span className="truncate">
                  {searchTerm.trim() || 'Перейти к поиску товаров и категорий'}
                </span>
                <ArrowRightIcon className="h-4 w-4 text-primary" />
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/catalog"
                  onClick={() => {
                    onTrackCategoryClick('catalog', 'mobile_menu');
                    onClose();
                  }}
                  className="focus-ring-soft inline-flex min-h-[46px] items-center justify-center rounded-lg border border-primary/25 bg-primary/10 px-3 text-sm font-semibold text-primary"
                >
                  Весь каталог
                </Link>
                <Link
                  to="/category/new"
                  onClick={() => {
                    onTrackCategoryClick('new', 'mobile_menu');
                    onClose();
                  }}
                  className="focus-ring-soft inline-flex min-h-[46px] items-center justify-center rounded-lg border border-ink/10 bg-white px-3 text-sm font-semibold text-ink"
                >
                  Новинки
                </Link>
                <Link
                  to="/favorites"
                  onClick={onClose}
                  className="focus-ring-soft inline-flex min-h-[46px] items-center justify-center rounded-lg border border-ink/10 bg-white px-3 text-sm font-semibold text-ink"
                >
                  Избранное{wishlistCount > 0 ? ` · ${wishlistCount}` : ''}
                </Link>
              </div>
            </nav>

            <section>
              <h2 className="mb-1 font-display text-xl">Категории</h2>
              <nav aria-label="Разделы каталога">
                <ul>
                  {mobileCategories.slice(0, 7).map((category) => (
                    <MobileCategoryItem
                      key={resolveCategoryToken(category)}
                      category={category}
                      childrenByParent={childrenByParent}
                      onClose={onClose}
                      onTrackCategoryClick={onTrackCategoryClick}
                    />
                  ))}

                  {mobileCategories.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-ink/20 bg-white px-4 py-4 text-sm text-muted">
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

            <section className="border-t border-line pt-3">
              <TrustLinksPanel
                title="Почему нам доверяют"
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

import React from 'react';
import { Link } from 'react-router-dom';
import CategoryGlyph from '../navigation/CategoryGlyph';
import { resolveCategoryToken } from '../../utils/header';

function QuickLink({
  children,
  onClick,
  to,
  variant = 'default'
}) {
  const isPrimary = variant === 'primary';

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`focus-ring-soft inline-flex min-h-[44px] items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
        isPrimary
          ? 'border-primary/25 bg-primary/10 text-primary hover:bg-primary/15'
          : 'border-ink/10 bg-white text-ink hover:border-primary/35 hover:text-primary'
      }`}
    >
      {children}
    </Link>
  );
}

function CategoryCard({
  category,
  childrenByParent,
  onCloseMega,
  onTrackCategoryClick
}) {
  const token = resolveCategoryToken(category);
  const nestedCategories = childrenByParent[String(category.id)] || [];

  return (
    <article className="rounded-[22px] border border-ink/10 bg-white p-3 shadow-[0_12px_24px_rgba(43,39,34,0.08)]">
      <Link
        to={`/category/${token}`}
        onClick={() => {
          onTrackCategoryClick(token, 'header_catalog_category');
          onCloseMega();
        }}
        className="focus-ring-soft grid min-h-[60px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-sand/40 hover:text-primary"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 bg-sand/35 text-ink/80">
          <CategoryGlyph category={category} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{category.name}</span>
          <span className="block truncate text-xs text-muted">
            {nestedCategories.length > 0
              ? `${nestedCategories.length} подкатегорий`
              : category.description || 'Открыть раздел'}
          </span>
        </span>
        <span className="text-ink/35" aria-hidden="true">→</span>
      </Link>

      {nestedCategories.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2 border-t border-ink/10 pt-3">
          {nestedCategories.map((subCategory) => {
            const childToken = resolveCategoryToken(subCategory);

            return (
              <Link
                key={childToken}
                to={`/category/${childToken}`}
                onClick={() => {
                  onTrackCategoryClick(childToken, 'header_catalog_subcategory');
                  onCloseMega();
                }}
                className="focus-ring-soft inline-flex min-h-[38px] items-center rounded-full border border-ink/10 bg-sand/25 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-primary/35 hover:text-primary"
              >
                {subCategory.name}
              </Link>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

function DesktopMegaMenu({
  childrenByParent,
  isOpen,
  navCategories,
  onCloseMega,
  onTrackCategoryClick
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-x-0 top-full z-[85] hidden lg:block">
      <div className="border-b border-ink/10 bg-[#fbf7f1]/96 shadow-[0_18px_38px_rgba(43,39,34,0.12)] backdrop-blur-xl">
        <div className="page-shell py-4">
          <section
            role="dialog"
            aria-label="Каталог"
            className="max-h-[calc(var(--viewport-block)-var(--site-header-height)-1rem)] overflow-y-auto overscroll-contain rounded-[26px] border border-ink/10 bg-white/95 p-4 shadow-[0_16px_34px_rgba(43,39,34,0.1)]"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Каталог</p>
                <h2 className="mt-1 font-display text-3xl font-semibold leading-tight text-ink">
                  Разделы каталога
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <QuickLink
                  to="/catalog"
                  variant="primary"
                  onClick={() => {
                    onTrackCategoryClick('catalog', 'header_catalog_menu');
                    onCloseMega();
                  }}
                >
                  Весь каталог
                </QuickLink>
                <QuickLink
                  to="/category/popular"
                  onClick={() => {
                    onTrackCategoryClick('popular', 'header_catalog_menu');
                    onCloseMega();
                  }}
                >
                  Лучшее
                </QuickLink>
                <QuickLink
                  to="/category/new"
                  onClick={() => {
                    onTrackCategoryClick('new', 'header_catalog_menu');
                    onCloseMega();
                  }}
                >
                  Новинки
                </QuickLink>
                <button
                  type="button"
                  onClick={onCloseMega}
                  className="focus-ring-soft inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 bg-white text-xl leading-none text-ink transition hover:border-primary/35 hover:text-primary"
                  aria-label="Закрыть каталог"
                >
                  ×
                </button>
              </div>
            </div>

            <nav aria-label="Разделы каталога" className="mt-4">
              <ul className="grid gap-3 lg:grid-cols-3 2xl:grid-cols-4">
                {navCategories.map((category) => (
                  <li key={resolveCategoryToken(category)} className="min-w-0">
                    <CategoryCard
                      category={category}
                      childrenByParent={childrenByParent}
                      onCloseMega={onCloseMega}
                      onTrackCategoryClick={onTrackCategoryClick}
                    />
                  </li>
                ))}

                {navCategories.length === 0 ? (
                  <li className="rounded-[22px] border border-dashed border-ink/15 bg-sand/20 p-4 text-sm text-muted">
                    Категории появятся после заполнения каталога.
                  </li>
                ) : null}
              </ul>
            </nav>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DesktopMegaMenu;

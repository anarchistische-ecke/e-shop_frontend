import React from 'react';
import { Link } from 'react-router-dom';
import CategoryGlyph from '../navigation/CategoryGlyph';
import { resolveCategoryToken } from '../../utils/header';
import { ArrowRightIcon, CloseIcon } from './icons';

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
      className={`focus-ring-soft inline-flex min-h-[44px] items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition ${
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
    <article className="border-b border-line pb-2">
      <Link
        to={`/category/${token}`}
        onClick={() => {
          onTrackCategoryClick(token, 'header_catalog_category');
          onCloseMega();
        }}
        className="focus-ring-soft grid min-h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-primary/5 hover:text-primary"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center text-primary">
          <CategoryGlyph category={category} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{category.name}</span>
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
                onClick={() => {
                  onTrackCategoryClick(childToken, 'header_catalog_subcategory');
                  onCloseMega();
                }}
                className="focus-ring-soft inline-flex min-h-10 items-center rounded-md text-xs font-medium text-muted transition hover:border-primary/35 hover:text-primary"
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
      <div className="border-b border-line bg-white shadow-md">
        <div className="page-shell py-4">
          <section
            role="dialog"
            aria-label="Каталог"
            className="max-h-[calc(var(--viewport-block)-var(--site-header-height)-1rem)] overflow-y-auto overscroll-contain py-1"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-medium leading-tight text-ink">
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
                  className="focus-ring-soft inline-flex h-11 w-11 items-center justify-center rounded-lg border border-ink/10 bg-white text-xl leading-none text-ink transition hover:border-primary/35 hover:text-primary"
                  aria-label="Закрыть каталог"
                >
                  <CloseIcon className="h-5 w-5" />
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
                  <li className="rounded-lg border border-dashed border-ink/15 bg-sand/20 p-4 text-sm text-muted">
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

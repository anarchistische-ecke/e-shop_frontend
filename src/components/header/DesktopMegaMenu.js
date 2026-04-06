import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronIcon } from './icons';
import { resolveCategoryToken } from '../../utils/header';

function DesktopMegaMenu({
  activeMegaCategory,
  activeMegaCategoryData,
  childrenByParent,
  megaChildren,
  navCategories,
  onCloseMega,
  onCloseMegaWithDelay,
  onOpenMega,
  onToggleMega
}) {
  return (
    <div
      className="relative z-30 hidden border-b border-ink/10 bg-white/95 backdrop-blur lg:block"
      onMouseLeave={onCloseMegaWithDelay}
    >
      <div className="container mx-auto px-4">
        <ul className="flex items-center gap-2 overflow-x-auto py-3 text-sm scrollbar-hide">
          <li>
            <Link
              to="/category/popular"
              className="inline-flex items-center rounded-xl border border-ink/10 bg-white/90 px-3 py-2 transition hover:border-primary/45 hover:text-primary"
            >
              Лучшее
            </Link>
          </li>
          <li>
            <Link
              to="/category/new"
              className="inline-flex items-center rounded-xl border border-ink/10 bg-white/90 px-3 py-2 transition hover:border-primary/45 hover:text-primary"
            >
              Новинки
            </Link>
          </li>
          {navCategories.map((category) => {
            const token = resolveCategoryToken(category);
            const children = childrenByParent[String(category.id)] || [];
            const hasChildren = children.length > 0;
            const isActive = activeMegaCategory === token;

            return (
              <li
                key={token}
                onMouseEnter={() => {
                  if (hasChildren) {
                    onOpenMega(token);
                  } else {
                    onCloseMega();
                  }
                }}
                onFocus={() => {
                  if (hasChildren) {
                    onOpenMega(token);
                  }
                }}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 transition ${
                      isActive
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-ink/10 bg-white/90 text-ink hover:border-primary/45 hover:text-primary'
                    }`}
                    onClick={() => onToggleMega(token)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        onCloseMega();
                      }
                    }}
                    aria-expanded={isActive}
                  >
                    <span>{category.name}</span>
                    <ChevronIcon className="h-4 w-4" isOpen={isActive} />
                  </button>
                ) : (
                  <Link
                    to={`/category/${token}`}
                    className="inline-flex items-center rounded-xl border border-ink/10 bg-white/90 px-3 py-2 transition hover:border-primary/45 hover:text-primary"
                  >
                    {category.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {activeMegaCategoryData && megaChildren.length > 0 ? (
          <div className="pb-4" onMouseEnter={() => onOpenMega(activeMegaCategory)}>
            <div className="rounded-[24px] border border-ink/10 bg-white p-5 shadow-[0_20px_48px_rgba(43,39,34,0.14)]">
              <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {activeMegaCategoryData.name}
                </p>
                <Link
                  to={`/category/${resolveCategoryToken(activeMegaCategoryData)}`}
                  className="text-sm text-primary"
                >
                  Смотреть всё
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {megaChildren.map((subCategory) => {
                  const nested = childrenByParent[String(subCategory.id)] || [];
                  return (
                    <div
                      key={resolveCategoryToken(subCategory)}
                      className="space-y-2"
                    >
                      <Link
                        to={`/category/${resolveCategoryToken(subCategory)}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-primary"
                      >
                        {subCategory.name}
                      </Link>
                      <div className="space-y-1">
                        {nested.slice(0, 6).map((nestedCategory) => (
                          <Link
                            key={resolveCategoryToken(nestedCategory)}
                            to={`/category/${resolveCategoryToken(nestedCategory)}`}
                            className="block rounded-xl px-2 py-1.5 text-sm text-muted transition hover:bg-secondary/40 hover:text-primary"
                          >
                            {nestedCategory.name}
                          </Link>
                        ))}
                        {nested.length === 0 ? (
                          <p className="text-xs text-muted">
                            Подкатегории появятся позже.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default DesktopMegaMenu;

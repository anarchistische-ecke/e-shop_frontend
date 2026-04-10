import React from 'react';
import { Link } from 'react-router-dom';
import CategoryGlyph from '../navigation/CategoryGlyph';
import { resolveCategoryToken } from '../../utils/header';

function DesktopMegaMenu({
  activeMegaCategory,
  activeMegaCategoryData,
  childrenByParent,
  isOpen,
  megaChildren,
  navCategories,
  onCloseMega,
  onCloseMegaWithDelay,
  onOpenMega,
  onTrackCategoryClick,
  onToggleMega
}) {
  if (!isOpen) {
    return null;
  }

  const featuredCategories = navCategories.slice(0, 8);
  const featuredChildren = megaChildren.slice(0, 8);

  return (
    <div
      className="absolute inset-x-0 top-full z-[85] hidden lg:block"
      onMouseLeave={onCloseMegaWithDelay}
    >
      <div className="border-b border-ink/10 bg-white/96 shadow-[0_24px_48px_rgba(43,39,34,0.14)] backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4" onMouseEnter={() => onOpenMega(activeMegaCategory)}>
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-3">
              <div className="rounded-[26px] border border-ink/10 bg-sand/35 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Каталог</p>
                <p className="mt-2 text-sm text-ink/80">
                  Откройте основные разделы, а затем перейдите к нужной подкатегории без лишнего поиска.
                </p>
                <div className="mt-4 grid gap-2">
                  <Link
                    to="/catalog"
                    onClick={() => {
                      onTrackCategoryClick('catalog', 'header_catalog_menu');
                      onCloseMega();
                    }}
                    className="focus-ring-soft inline-flex min-h-[44px] items-center justify-between rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-primary/35 hover:text-primary"
                  >
                    <span>Весь каталог</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/category/popular"
                      onClick={() => {
                        onTrackCategoryClick('popular', 'header_catalog_menu');
                        onCloseMega();
                      }}
                      className="focus-ring-soft inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink transition hover:border-primary/35 hover:text-primary"
                    >
                      Лучшее
                    </Link>
                    <Link
                      to="/category/new"
                      onClick={() => {
                        onTrackCategoryClick('new', 'header_catalog_menu');
                        onCloseMega();
                      }}
                      className="focus-ring-soft inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink transition hover:border-primary/35 hover:text-primary"
                    >
                      Новинки
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-ink/10 bg-white p-3">
                <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.22em] text-muted">
                  Главные категории
                </p>
                <ul className="space-y-1.5">
                  {featuredCategories.map((category) => {
                    const token = resolveCategoryToken(category);
                    const childCount = (childrenByParent[String(category.id)] || []).length;
                    const isActive = activeMegaCategory === token;

                    return (
                      <li key={token}>
                        <button
                          type="button"
                          className={`focus-ring-soft grid min-h-[52px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'bg-white text-ink hover:bg-sand/45 hover:text-primary'
                          }`}
                          onClick={() => onToggleMega(token)}
                          onMouseEnter={() => onOpenMega(token)}
                          onFocus={() => onOpenMega(token)}
                          aria-pressed={isActive}
                        >
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 bg-white/85 text-ink/80">
                            <CategoryGlyph category={category} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{category.name}</span>
                            <span className="block truncate text-xs text-muted">
                              {childCount > 0 ? `${childCount} подкатегорий` : 'Открыть раздел'}
                            </span>
                          </span>
                          <span className="text-ink/35" aria-hidden="true">›</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>

            <section className="rounded-[30px] border border-ink/10 bg-white p-5">
              {activeMegaCategoryData ? (
                <>
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Раздел каталога</p>
                      <h2 className="mt-2 text-2xl font-semibold text-ink">{activeMegaCategoryData.name}</h2>
                      <p className="mt-2 max-w-2xl text-sm text-muted">
                        {activeMegaCategoryData.description ||
                          'Подберите нужную категорию или сразу откройте весь раздел.'}
                      </p>
                    </div>
                    <Link
                      to={`/category/${resolveCategoryToken(activeMegaCategoryData)}`}
                      onClick={() => {
                        onTrackCategoryClick(
                          resolveCategoryToken(activeMegaCategoryData),
                          'header_catalog_section'
                        );
                        onCloseMega();
                      }}
                      className="focus-ring-soft inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
                    >
                      Смотреть весь раздел
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3 xl:grid-cols-2">
                    {featuredChildren.length > 0 ? (
                      featuredChildren.map((subCategory) => {
                        const token = resolveCategoryToken(subCategory);
                        const nested = (childrenByParent[String(subCategory.id)] || []).slice(0, 5);

                        return (
                          <div
                            key={token}
                            className="rounded-[24px] border border-ink/10 bg-sand/25 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <Link
                                  to={`/category/${token}`}
                                  onClick={() => {
                                    onTrackCategoryClick(token, 'header_catalog_subcategory');
                                    onCloseMega();
                                  }}
                                  className="focus-ring-soft inline-flex items-center gap-2 rounded-xl text-base font-semibold text-ink transition hover:text-primary"
                                >
                                  <CategoryGlyph category={subCategory} className="h-4 w-4" />
                                  <span className="truncate">{subCategory.name}</span>
                                </Link>
                                <p className="mt-1 text-sm text-muted">
                                  {subCategory.description || 'Откройте подборку и перейдите к нужным товарам.'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {nested.length > 0 ? (
                                nested.map((nestedCategory) => (
                                  <Link
                                    key={resolveCategoryToken(nestedCategory)}
                                    to={`/category/${resolveCategoryToken(nestedCategory)}`}
                                    onClick={() => {
                                      onTrackCategoryClick(
                                        resolveCategoryToken(nestedCategory),
                                        'header_catalog_nested'
                                      );
                                      onCloseMega();
                                    }}
                                    className="focus-ring-soft inline-flex min-h-[44px] items-center rounded-full border border-ink/10 bg-white px-3 py-1.5 text-sm text-ink transition hover:border-primary/35 hover:text-primary"
                                  >
                                    {nestedCategory.name}
                                  </Link>
                                ))
                              ) : (
                                <span className="text-sm text-muted">Подкатегории появятся позже.</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-ink/15 bg-sand/20 p-5 text-sm text-muted">
                        Для этого раздела пока нет подкатегорий. Откройте его целиком, чтобы увидеть все товары.
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesktopMegaMenu;

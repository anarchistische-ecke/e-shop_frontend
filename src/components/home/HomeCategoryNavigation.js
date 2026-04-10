import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import CategoryGlyph from '../navigation/CategoryGlyph';
import { Button, Card } from '../ui';
import {
  buildCategoryCollections,
  resolveCategoryToken,
  resolveProductCategoryToken
} from '../../features/product-list/selectors';
import { METRIKA_GOALS, trackMetrikaGoal } from '../../utils/metrika';
import { getPrimaryImageUrl, resolveImageUrl } from '../../utils/product';
import { normalizeSearchText } from '../../utils/search';

function formatProductCount(count) {
  const value = Number(count) || 0;
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return `${value} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${value} товара`;
  return `${value} товаров`;
}

function buildDescendantTokenSet(category, childrenByParent) {
  const tokens = new Set();
  const queue = [category];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const token = normalizeSearchText(resolveCategoryToken(current));
    const idToken = normalizeSearchText(String(current.id || ''));
    if (token) tokens.add(token);
    if (idToken) tokens.add(idToken);
    const children = childrenByParent[String(current.id)] || [];
    queue.push(...children);
  }

  return tokens;
}

function buildCategoryCards(categories = [], products = []) {
  const { navCategories, childrenByParent } = buildCategoryCollections(categories);
  const featuredCategories = navCategories.slice(0, 6);

  return {
    cards: featuredCategories.map((category) => {
      const childCategories = childrenByParent[String(category.id)] || [];
      const tokenSet = buildDescendantTokenSet(category, childrenByParent);
      const matchingProducts = products.filter((product) => {
        const categoryToken = normalizeSearchText(resolveProductCategoryToken(product));
        return categoryToken && tokenSet.has(categoryToken);
      });
      const previewProduct = matchingProducts[0] || null;
      const previewImage = resolveImageUrl(
        category.imageUrl ||
          category.image ||
          category.image_url ||
          category.thumbnail ||
          getPrimaryImageUrl(previewProduct) ||
          ''
      );
      const productCount = matchingProducts.length;
      const helperLine = [
        childCategories.length > 0 ? `${childCategories.length} подкатегорий` : '',
        productCount > 0 ? formatProductCount(productCount) : ''
      ]
        .filter(Boolean)
        .join(' · ');

      return {
        category,
        token: resolveCategoryToken(category),
        childCategories,
        previewImage,
        helperLine: helperLine || 'Открыть раздел каталога',
        summary:
          category.description ||
          (childCategories.length > 0
            ? childCategories.slice(0, 3).map((item) => item.name).join(', ')
            : 'Подборка товаров для дома и спальни.')
      };
    }),
    totalTopCategories: navCategories.length
  };
}

function trackCategoryClick(token, source) {
  trackMetrikaGoal(METRIKA_GOALS.CATEGORY_NAV_CLICK, {
    category: token,
    source
  });
}

function DesktopCategoryCard({ card }) {
  return (
    <Card
      as={Link}
      to={`/category/${card.token}`}
      onClick={() => trackCategoryClick(card.token, 'home_grid')}
      variant="quiet"
      padding="sm"
      interactive
      className="group h-full rounded-[28px] border border-white/75 bg-gradient-to-br from-white via-sand/30 to-[#ece4d8]"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-ink/10 bg-white/90 text-ink/80 shadow-[0_8px_18px_rgba(43,39,34,0.08)]">
            <CategoryGlyph category={card.category} className="h-5 w-5" />
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-muted">Раздел</span>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white/80">
          <div className="relative pt-[66%]">
            {card.previewImage ? (
              <img
                src={card.previewImage}
                alt={card.category.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
                Фото появится позже
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-ink">{card.category.name}</h3>
              <p className="mt-1 text-xs text-muted">{card.helperLine}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-primary shadow-sm transition group-hover:translate-x-1">
              →
            </span>
          </div>
          <p className="text-sm text-muted">{card.summary}</p>
        </div>

        {card.childCategories.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {card.childCategories.slice(0, 3).map((childCategory) => (
              <span
                key={resolveCategoryToken(childCategory)}
                className="inline-flex min-h-[32px] items-center rounded-full border border-ink/10 bg-white/85 px-3 py-1 text-xs text-ink/80"
              >
                {childCategory.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function MobileCategoryListItem({ card }) {
  return (
    <Card
      as={Link}
      to={`/category/${card.token}`}
      onClick={() => trackCategoryClick(card.token, 'home_list')}
      variant="quiet"
      padding="sm"
      interactive
      className="rounded-[24px] border border-white/80 bg-white/85"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-ink/10 bg-sand/40 text-ink/80">
          <CategoryGlyph category={card.category} className="h-5 w-5" />
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{card.category.name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">{card.helperLine}</span>
        </span>

        {card.previewImage ? (
          <span className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/80 bg-white/90">
            <img
              src={card.previewImage}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </span>
        ) : (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 bg-white/90 text-primary">
            →
          </span>
        )}
      </div>
    </Card>
  );
}

function HomeCategoryNavigation({ categories = [], products = [] }) {
  const { cards, totalTopCategories } = useMemo(
    () => buildCategoryCards(categories, products),
    [categories, products]
  );

  return (
    <section className="page-shell page-section--tight">
      <div className="ambient-panel relative overflow-hidden rounded-[28px] border border-white/70 bg-white/70 px-4 py-6 shadow-[0_24px_60px_rgba(43,39,34,0.12)] backdrop-blur-lg sm:px-6 md:px-10 md:py-10">
        <div className="absolute -top-16 right-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-6 h-32 w-32 rounded-full bg-sky/60 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.32em] text-accent">Категории</p>
            <h2 className="text-2xl font-semibold md:text-3xl">Разделы каталога без скрытых свайпов</h2>
            <p className="mt-2 text-sm text-muted">
              Главные категории всегда на виду: на большом экране в виде карточек, на мобильном в понятном вертикальном списке.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              as={Link}
              to="/catalog"
              onClick={() => trackCategoryClick('catalog', 'home_catalog_cta')}
            >
              Весь каталог
            </Button>
            <Button
              as={Link}
              to="/category/new"
              variant="secondary"
              onClick={() => trackCategoryClick('new', 'home_catalog_cta')}
            >
              Новинки
            </Button>
          </div>
        </div>

        {cards.length > 0 ? (
          <>
            <div className="relative z-10 mt-6 space-y-3 md:hidden">
              {cards.map((card) => (
                <MobileCategoryListItem key={card.token} card={card} />
              ))}
            </div>

            <div className="relative z-10 mt-6 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <DesktopCategoryCard key={card.token} card={card} />
              ))}
            </div>
          </>
        ) : (
          <div className="relative z-10 mt-6 rounded-[24px] border border-dashed border-ink/15 bg-white/65 px-4 py-5 text-sm text-muted">
            Категории появятся здесь после заполнения каталога.
          </div>
        )}

        {totalTopCategories > cards.length ? (
          <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-dashed border-ink/15 bg-white/65 px-4 py-3">
            <p className="text-sm text-muted">
              Показали главные разделы. Остальные категории доступны в каталоге и в меню шапки.
            </p>
            <Button
              as={Link}
              to="/catalog"
              variant="ghost"
              size="sm"
              onClick={() => trackCategoryClick('catalog', 'home_catalog_more')}
            >
              Показать все разделы →
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default HomeCategoryNavigation;

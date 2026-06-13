import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCmsCollection } from '../../contexts/CmsContentContext';
import ResponsiveImage from '../media/ResponsiveImage';
import { Card } from '../ui';
import { moneyToNumber, resolveImageUrl } from '../../utils/product';
import { getCmsLayoutVariant } from './cmsBlockShared';
import { METRIKA_GOALS, trackEcommerce, trackGoal } from '../../utils/metrika';

function formatPrice(price) {
  const value = moneyToNumber(price);
  return value > 0 ? `${value.toLocaleString('ru-RU')} ₽` : '';
}

function CollectionProductCard({ entry, promotion }) {
  const imageUrl = resolveImageUrl(entry?.image?.url || '');
  const title = entry?.presentation?.marketingTitle || entry?.title || 'Товар';
  const summary = entry?.presentation?.introBody || entry?.summary || '';
  const badge = entry?.presentation?.badgeText || '';
  const price = formatPrice(entry?.price);

  return (
    <Card
      as={Link}
      to={entry?.href || '/category/popular'}
      variant="quiet"
      padding="sm"
      interactive
      className="group block h-full rounded-[24px]"
      onClick={() => {
        trackEcommerce('promoClick', { promotions: [promotion] });
        trackGoal(METRIKA_GOALS.PROMO_CLICK, {
          promo_id: promotion.id,
          promo_name: promotion.name,
          position: promotion.position
        });
      }}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="relative overflow-hidden rounded-[20px] border border-ink/10 bg-sand/40">
          <div className="relative pt-[74%]">
            {imageUrl ? (
              <ResponsiveImage
                media={entry?.image?.media}
                src={imageUrl}
                alt={entry?.image?.alt || title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(min-width: 1024px) 22rem, (min-width: 640px) 46vw, 92vw"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                Фото появится позже
              </div>
            )}
          </div>
          {badge ? (
            <span className="absolute left-3 top-3 rounded-full border border-primary/20 bg-white/90 px-3 py-1 text-[11px] font-medium text-primary">
              {badge}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {summary ? <p className="line-clamp-3 text-sm text-muted">{summary}</p> : null}
          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <span className="text-sm text-primary">Открыть →</span>
            {price ? <span className="text-base font-semibold text-accent">{price}</span> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CollectionCategoryCard({ entry, promotion }) {
  const imageUrl = resolveImageUrl(entry?.image?.url || '');
  const title = entry?.presentation?.marketingTitle || entry?.title || 'Категория';
  const summary = entry?.presentation?.introBody || entry?.summary || '';
  const helper = entry?.presentation?.badgeText || 'Категория';

  return (
    <Card
      as={Link}
      to={entry?.href || '/category/popular'}
      variant="quiet"
      padding="sm"
      interactive
      className="group block h-full rounded-[24px]"
      onClick={() => {
        trackEcommerce('promoClick', { promotions: [promotion] });
        trackGoal(METRIKA_GOALS.PROMO_CLICK, {
          promo_id: promotion.id,
          promo_name: promotion.name,
          position: promotion.position
        });
      }}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="relative overflow-hidden rounded-[20px] border border-ink/10 bg-sand/35">
          <div className="relative pt-[70%]">
            {imageUrl ? (
              <ResponsiveImage
                media={entry?.image?.media}
                src={imageUrl}
                alt={entry?.image?.alt || title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(min-width: 1024px) 22rem, (min-width: 640px) 46vw, 92vw"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                Фото раздела появится позже
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-primary/85">{helper}</p>
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {summary ? <p className="line-clamp-3 text-sm text-muted">{summary}</p> : null}
          <span className="mt-auto text-sm font-medium text-primary">Открыть раздел →</span>
        </div>
      </div>
    </Card>
  );
}

export function CollectionEntryCard({ entry, promotion }) {
  return entry?.entityKind === 'category'
    ? <CollectionCategoryCard entry={entry} promotion={promotion} />
    : <CollectionProductCard entry={entry} promotion={promotion} />;
}

function collectionLayoutClass(layoutVariant) {
  if (getCmsLayoutVariant(layoutVariant) === 'rail') {
    return 'flex gap-4 overflow-x-auto pb-2 pr-4 snap-x snap-mandatory';
  }
  if (getCmsLayoutVariant(layoutVariant) === 'full') {
    return 'grid gap-4 md:grid-cols-2 xl:grid-cols-4';
  }
  return 'grid gap-4 md:grid-cols-2 xl:grid-cols-3';
}

function collectionItemClass(layoutVariant) {
  return getCmsLayoutVariant(layoutVariant) === 'rail'
    ? 'w-[82vw] max-w-[20rem] flex-none snap-start sm:w-[18rem]'
    : '';
}

function CmsCollectionRailSection({ collectionKey, layoutVariant = 'cards' }) {
  const { collection, isCollectionLoading, collectionError } = useCmsCollection(collectionKey);
  const collectionItems = Array.isArray(collection?.items) ? collection.items : [];
  const hero = collection?.hero || null;
  const title = hero?.title || collection?.title || 'Подборка';
  const description = hero?.body || collection?.description || '';
  const promotions = useMemo(
    () =>
      collectionItems.map((entry, index) => ({
        id: `${collection?.key || collectionKey}:${entry.entityKind}:${entry.entityKey}`,
        name: entry?.presentation?.marketingTitle || entry?.title || title,
        creative: resolveImageUrl(entry?.image?.url || ''),
        position: index + 1
      })),
    [collection?.key, collectionItems, collectionKey, title]
  );

  useEffect(() => {
    if (!promotions.length) return;
    trackEcommerce('promoView', { promotions });
    trackGoal(METRIKA_GOALS.PROMO_VIEW, {
      promo_collection: collection?.key || collectionKey,
      promo_count: promotions.length
    });
  }, [collection?.key, collectionKey, promotions]);

  if (collection && collectionItems.length > 0) {
    return (
      <section className="space-y-4">
        <div className="space-y-2">
          {hero?.eyebrow ? (
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.28em] text-primary/85">
              {hero.eyebrow}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
              {description ? <p className="max-w-3xl text-sm leading-7 text-muted">{description}</p> : null}
            </div>
            {collection?.primaryCtaLabel && collection?.primaryCtaUrl ? (
              <Link to={collection.primaryCtaUrl} className="inline-flex min-h-11 items-center text-sm font-medium text-primary">
                {collection.primaryCtaLabel} →
              </Link>
            ) : null}
          </div>
        </div>

        <div className={collectionLayoutClass(layoutVariant)}>
          {collectionItems.map((entry, index) => (
            <div key={`${collection.key}-${entry.entityKind}-${entry.entityKey}`} className={collectionItemClass(layoutVariant)}>
              <CollectionEntryCard entry={entry} promotion={promotions[index]} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isCollectionLoading) {
    return (
      <Card padding="lg" className="rounded-[24px] border border-dashed border-ink/10 bg-white/60 text-sm text-muted">
        Загружаем подборку…
      </Card>
    );
  }

  if (collectionError) {
    return (
      <Card padding="lg" className="rounded-[24px] border border-dashed border-ink/10 bg-white/60 text-sm text-muted">
        Подборка временно недоступна.
      </Card>
    );
  }

  return null;
}

function CmsStorefrontCollectionRail({ collectionKeys = [], className = '', layoutVariant = 'cards' }) {
  const normalizedKeys = useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(collectionKeys) ? collectionKeys : [])
            .map((entry) => String(entry || '').trim())
            .filter(Boolean)
        )
      ),
    [collectionKeys]
  );

  if (!normalizedKeys.length) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-6 sm:space-y-8">
        {normalizedKeys.map((key) => (
          <CmsCollectionRailSection key={key} collectionKey={key} layoutVariant={layoutVariant} />
        ))}
      </div>
    </div>
  );
}

export default CmsStorefrontCollectionRail;

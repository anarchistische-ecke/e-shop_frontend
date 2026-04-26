import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCmsCollection } from '../../contexts/CmsContentContext';
import { Card } from '../ui';
import { moneyToNumber, resolveImageUrl } from '../../utils/product';

function formatPrice(price) {
  const value = moneyToNumber(price);
  return value > 0 ? `${value.toLocaleString('ru-RU')} ₽` : '';
}

function CollectionProductCard({ entry }) {
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
      className="group h-full rounded-[24px]"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="relative overflow-hidden rounded-[20px] border border-ink/10 bg-sand/40">
          <div className="relative pt-[74%]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={entry?.image?.alt || title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
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

function CollectionCategoryCard({ entry }) {
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
      className="group h-full rounded-[24px]"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="relative overflow-hidden rounded-[20px] border border-ink/10 bg-sand/35">
          <div className="relative pt-[70%]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={entry?.image?.alt || title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
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

export function CollectionEntryCard({ entry }) {
  return entry?.entityKind === 'category'
    ? <CollectionCategoryCard entry={entry} />
    : <CollectionProductCard entry={entry} />;
}

function CmsCollectionRailSection({ collectionKey }) {
  const { collection, isCollectionLoading, collectionError } = useCmsCollection(collectionKey);

  if (collection && Array.isArray(collection.items) && collection.items.length > 0) {
    const hero = collection?.hero || null;
    const title = hero?.title || collection?.title || 'Подборка';
    const description = hero?.body || collection?.description || '';

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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collection.items.map((entry) => (
            <CollectionEntryCard key={`${collection.key}-${entry.entityKind}-${entry.entityKey}`} entry={entry} />
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

function CmsStorefrontCollectionRail({ collectionKeys = [], className = '' }) {
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
          <CmsCollectionRailSection key={key} collectionKey={key} />
        ))}
      </div>
    </div>
  );
}

export default CmsStorefrontCollectionRail;

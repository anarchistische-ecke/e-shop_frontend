import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../ui';
import {
  CmsAction,
  CmsRichText,
  CmsSectionActions,
  resolveMediaUrl,
  getCmsLayoutVariant,
  getSurfaceToneClass,
  isSafeCmsUrl,
} from '../cmsBlockShared';
import CmsImage from '../CmsImage';
import HeroBanner from '../../home/HeroBanner';
import { useProductDirectoryData } from '../../../features/product-list/data';
import {
  getProductPrice,
} from '../../../utils/product';
import { buildProductPath } from '../../../utils/url';

function HeroHighlights({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <Card
          as={item.url?.startsWith('/') ? Link : 'div'}
          to={item.url?.startsWith('/') ? item.url : undefined}
          key={`${item.title || item.label || 'hero-item'}-${index}`}
          variant="quiet"
          padding="sm"
          className="rounded-[22px] border border-white/75 bg-white/75"
        >
          {item.label ? (
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              {item.label}
            </p>
          ) : null}
          {item.title ? <p className="mt-1 text-base font-semibold text-ink">{item.title}</p> : null}
          {item.description ? <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p> : null}
        </Card>
      ))}
    </div>
  );
}

function normalizeReferenceKind(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');
}

function normalizeLookupValue(value = '') {
  return String(value || '').trim().toLowerCase();
}

function findProductByReference(products = [], referenceKey = '', referenceKind = '') {
  const normalizedKey = normalizeLookupValue(referenceKey);
  if (!normalizedKey) {
    return null;
  }

  return products.find((product) => {
    const productId = normalizeLookupValue(product?.id);
    const productSlug = normalizeLookupValue(product?.slug);

    if (referenceKind === 'product_id') {
      return productId === normalizedKey;
    }
    if (referenceKind === 'product_slug') {
      return productSlug === normalizedKey;
    }

    return productId === normalizedKey || productSlug === normalizedKey;
  }) || null;
}

function readHeroFeaturedProductReference(items = []) {
  return (items || []).find((item) => {
    const kind = normalizeReferenceKind(item?.referenceKind || item?.reference_kind);
    const key = item?.referenceKey || item?.reference_key;
    return key && ['product', 'product_id', 'product_slug'].includes(kind);
  }) || null;
}

function HomeHeroBlock({ page, section }) {
  const { products } = useProductDirectoryData();
  const reference = readHeroFeaturedProductReference(section.items || []);
  const featuredProduct = reference ? findProductByReference(
    products,
    reference.referenceKey || reference.reference_key,
    normalizeReferenceKind(reference.referenceKind || reference.reference_kind)
  ) : null;
  const price = featuredProduct ? getProductPrice(featuredProduct) : 0;
  const image = resolveMediaUrl(section.image) ? section.image : section.imageUrl;
  const mobileImage = resolveMediaUrl(section.mobileImage) ? section.mobileImage : section.mobileImageUrl;
  const hasEditorialMedia = Boolean(resolveMediaUrl(image) || resolveMediaUrl(mobileImage));
  const hasPrimaryAction = section.primaryCtaLabel && isSafeCmsUrl(section.primaryCtaUrl);
  const primaryLabel = hasPrimaryAction ? section.primaryCtaLabel : 'Смотреть каталог';
  const primaryUrl = hasPrimaryAction ? section.primaryCtaUrl : '/catalog';

  return (
    <HeroBanner
      anchorId={section.anchorId}
      title={section.title || page.title}
      accent={section.accent}
      description={section.body ? <CmsRichText html={section.body} /> : null}
      visual={hasEditorialMedia ? (
        <CmsImage
          media={image}
          mobileMedia={mobileImage}
          alt={section.imageAlt || section.title || page.title}
          frameClassName="absolute inset-0"
          sizes="(min-width: 768px) 55vw, 100vw"
          priority
          preserveAspectRatio={false}
        />
      ) : null}
      actions={(
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CmsAction label={primaryLabel} url={primaryUrl} className="max-sm:!px-3" />
          <CmsAction
            label={section.secondaryCtaLabel}
            url={section.secondaryCtaUrl}
            variant="ghost"
            className="justify-start !px-0 text-primary underline decoration-primary/25 underline-offset-4 max-sm:!text-xs"
          />
        </div>
      )}
      featuredProduct={featuredProduct ? {
        name: featuredProduct.name,
        link: buildProductPath(featuredProduct),
        priceLabel: price ? `${price.toLocaleString('ru-RU')} ₽` : ''
      } : null}
      highlights={(section.items || [])
        .filter((item) => item !== reference && (item.title || item.label))
        .map((item) => ({ title: item.title || item.label, link: item.url }))}
    />
  );
}

function HeroMedia({ section, page, priority = false }) {
  const hasMedia = section.image || section.imageUrl || section.mobileImage || section.mobileImageUrl;

  if (!hasMedia) {
    return null;
  }

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/55 shadow-[0_20px_42px_rgba(43,39,34,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/32 via-transparent to-white/70" />
        <div className="relative aspect-[16/10] sm:aspect-[1.05/1]">
          <CmsImage
            media={section.image || section.imageUrl}
            mobileMedia={section.mobileImage || section.mobileImageUrl}
            alt={section.title || page.title}
            frameClassName="absolute inset-0"
            sizes="(min-width: 1024px) 24rem, (min-width: 640px) 42vw, 92vw"
            priority={priority}
            preserveAspectRatio={false}
            placeholderLabel="Добавьте изображение для этого hero-блока"
          />
        </div>
      </div>
    </div>
  );
}

function HeroBlock({ page, section, index = 0 }) {
  if ((page?.template === 'home' || page?.slug === 'home') && index === 0) {
    return <HomeHeroBlock page={page} section={section} />;
  }

  const Heading = page?.secondaryHeading ? 'h2' : 'h1';
  const accent = section.accent ? <span className="text-primary">{section.accent}</span> : null;
  const layoutVariant = getCmsLayoutVariant(section.layoutVariant);
  const mediaFirst = layoutVariant === 'media_left';
  const shellClass = layoutVariant === 'full'
    ? 'overflow-hidden rounded-[2rem] px-5 py-7 sm:px-8 sm:py-9 lg:px-10'
    : 'overflow-hidden rounded-[2rem] px-5 py-7 sm:px-8 sm:py-9';
  const gridClass = mediaFirst
    ? 'grid gap-6 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1.15fr)] lg:items-center'
    : 'grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,24rem)] lg:items-center';

  return (
    <section
      id={section.anchorId || undefined}
      data-testid={page?.template === 'home' && index === 0 ? 'home-hero' : undefined}
      className={`${shellClass} ${getSurfaceToneClass(section.styleVariant)}`}
    >
      <div className={gridClass}>
        <div className={`space-y-5 ${mediaFirst ? 'lg:order-2' : ''}`.trim()}>
          <div className="space-y-3">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              {section.eyebrow || page.navLabel || page.title}
            </p>
            <Heading className="font-display text-3xl font-semibold text-ink sm:text-4xl lg:text-[3.2rem] lg:leading-[1]">
              {section.title || page.title} {accent}
            </Heading>
            <CmsRichText html={section.body} className="max-w-2xl text-base" />
          </div>

          <CmsSectionActions section={section} className="pt-1" />
          <HeroHighlights items={section.items || []} />
        </div>

        <HeroMedia section={section} page={page} priority={index === 0} />
      </div>
    </section>
  );
}

export default HeroBlock;

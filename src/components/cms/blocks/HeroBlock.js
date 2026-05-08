import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../ui';
import {
  CmsRichText,
  CmsSectionActions,
  getCmsLayoutVariant,
  getSurfaceToneClass,
} from '../cmsBlockShared';
import CmsImage from '../CmsImage';
import ResponsiveImage from '../../media/ResponsiveImage';
import { useProductDirectoryData } from '../../../features/product-list/data';
import {
  getPrimaryImageMedia,
  getPrimaryImageUrl,
  getProductPrice,
  resolveImageUrl,
} from '../../../utils/product';
import { buildProductPath } from '../../../utils/url';

const HOME_HERO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=82';

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

function findHeroProduct(products = []) {
  return [...products]
    .filter((product) => product?.isActive !== false)
    .sort((left, right) => {
      const leftScore =
        (Number(left.rating) || 0) * 100 + (Number(left.reviewCount || left.reviewsCount) || 0);
      const rightScore =
        (Number(right.rating) || 0) * 100 + (Number(right.reviewCount || right.reviewsCount) || 0);
      return rightScore - leftScore;
    })[0] || null;
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

function getHeroProofItems(items = []) {
  return (items || []).filter((item) => item !== readHeroFeaturedProductReference(items));
}

function FeaturedProductLink({ product }) {
  if (!product) {
    return null;
  }

  const productHref = buildProductPath(product);
  const productPrice = getProductPrice(product);

  return (
    <Link
      to={productHref}
      className="focus-ring-soft mt-3 flex min-h-[48px] items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink shadow-[0_10px_22px_rgba(43,39,34,0.08)]"
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold">Выбор недели: {product.name}</span>
        {productPrice > 0 ? (
          <span className="block text-xs text-muted">от {productPrice.toLocaleString('ru-RU')} ₽</span>
        ) : null}
      </span>
      <span className="shrink-0 text-primary" aria-hidden="true">→</span>
    </Link>
  );
}

function HomeHeroVisual({ section, page, fallbackProduct, proofItems = [] }) {
  const hasCmsMedia = section.image || section.imageUrl || section.mobileImage || section.mobileImageUrl;
  const fallbackImage = resolveImageUrl(getPrimaryImageUrl(fallbackProduct)) || HOME_HERO_FALLBACK_IMAGE;
  const fallbackMedia = getPrimaryImageMedia(fallbackProduct);

  return (
    <div className="relative min-h-[220px] overflow-hidden bg-sky/35 sm:min-h-[300px] lg:min-h-[30rem]">
      {hasCmsMedia ? (
        <CmsImage
          media={section.image || section.imageUrl}
          mobileMedia={section.mobileImage || section.mobileImageUrl}
          alt={section.imageAlt || section.title || page.title}
          frameClassName="absolute inset-0"
          sizes="(min-width: 1024px) 52vw, 100vw"
          priority
          preserveAspectRatio={false}
          placeholderLabel="Добавьте изображение для главного hero-блока"
        />
      ) : (
        <ResponsiveImage
          media={fallbackMedia}
          src={fallbackImage}
          alt={section.title || page.title || 'Постельное белье в спальне'}
          className="absolute inset-0 h-full w-full object-cover"
          sizes="(min-width: 1024px) 52vw, 100vw"
          priority
          loading="eager"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/32 via-transparent to-white/10" />
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
        {proofItems.slice(0, 2).map((item, index) => (
          <span
            key={`${item.title || item.label || 'home-hero-chip'}-${index}`}
            className="rounded-full border border-white/45 bg-white/88 px-3 py-1.5 text-xs font-semibold text-ink shadow-[0_10px_22px_rgba(43,39,34,0.14)] backdrop-blur"
          >
            {item.title || item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HomeHeroBlock({ page, section }) {
  const { products } = useProductDirectoryData();
  const featuredProductReference = readHeroFeaturedProductReference(section.items || []);
  const featuredProduct = featuredProductReference
    ? findProductByReference(
        products,
        featuredProductReference.referenceKey || featuredProductReference.reference_key,
        normalizeReferenceKind(featuredProductReference.referenceKind || featuredProductReference.reference_kind)
      )
    : null;
  const fallbackProduct = featuredProduct || findHeroProduct(products);
  const proofItems = getHeroProofItems(section.items || []);
  const accent = section.accent ? <span className="text-primary">{section.accent}</span> : null;

  return (
    <section
      id={section.anchorId || undefined}
      data-testid="home-hero"
      className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_22px_54px_rgba(43,39,34,0.14)] sm:rounded-[32px] lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
    >
      <div className="lg:order-2">
        <HomeHeroVisual
          section={section}
          page={page}
          fallbackProduct={fallbackProduct}
          proofItems={proofItems}
        />
        <FeaturedProductLink product={fallbackProduct} />
      </div>

      <div className="flex flex-col justify-center gap-4 px-4 py-5 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <div className="space-y-3">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
            {section.eyebrow || page.navLabel || page.title}
          </p>
          <h1 className="font-display text-[2rem] font-semibold leading-[1.02] text-ink sm:text-4xl lg:text-[3.4rem]">
            {section.title || page.title} {accent}
          </h1>
          <CmsRichText html={section.body} className="max-w-2xl text-sm leading-6 sm:text-base sm:leading-7" />
        </div>

        <CmsSectionActions section={section} className="pt-1" />

        {proofItems.length > 0 ? (
          <div className="hidden grid-cols-1 gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {proofItems.slice(0, 3).map((item, index) => (
              <div
                key={`${item.title || item.label || 'home-hero-proof'}-${index}`}
                className="rounded-2xl border border-ink/10 bg-[#f6f8f3] px-3 py-2.5"
              >
                {item.label ? (
                  <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {item.label}
                  </p>
                ) : null}
                <p className="m-0 text-sm font-semibold leading-5 text-ink">
                  {item.title || item.description}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
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
  if (page?.template === 'home' && index === 0) {
    return <HomeHeroBlock page={page} section={section} />;
  }

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
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl lg:text-[3.2rem] lg:leading-[1]">
              {section.title || page.title} {accent}
            </h1>
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

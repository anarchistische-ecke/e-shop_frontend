import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../ProductCard';
import ShopTheLook from '../../home/ShopTheLook';
import ResponsiveImage from '../../media/ResponsiveImage';
import CmsStorefrontCollectionRail from '../CmsStorefrontCollectionRail';
import FeatureListBlock from './FeatureListBlock';
import { Card } from '../../ui';
import {
  CmsAction,
  CmsSectionHeading,
  getCmsLayoutVariant,
  resolveMediaUrl,
  getSurfaceToneClass,
} from '../cmsBlockShared';
import { useProductDirectoryData } from '../../../features/product-list/data';
import { buildCategoryListingHref } from '../../../features/product-list/url';
import { getPrimaryImageMedia, getPrimaryImageUrl, resolveImageUrl } from '../../../utils/product';

const COLLECTION_REFERENCE_KINDS = new Set([
  'collection',
  'collection_key',
  'cms_collection',
  'storefront_collection',
]);
const PRODUCT_REFERENCE_KINDS = new Set(['product', 'product_id', 'product_slug']);
const CATEGORY_REFERENCE_KINDS = new Set(['category', 'category_id', 'category_slug']);

function normalizeReferenceKind(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');
}

function readReferenceKind(item = {}) {
  return normalizeReferenceKind(item.referenceKind || item.reference_kind);
}

function readReferenceKey(item = {}) {
  return String(
    item.referenceKey ||
      item.reference_key ||
      item.collectionKey ||
      item.collection_key ||
      item.entityKey ||
      item.entity_key ||
      item.key ||
      ''
  ).trim();
}

function normalizeItems(section = {}) {
  return Array.isArray(section.items) ? section.items : [];
}

function readCollectionKeys(section = {}) {
  const keys = new Set();
  const addKey = (value) => {
    const key = String(value || '').trim();
    if (key) {
      keys.add(key);
    }
  };

  addKey(section.collectionKey || section.collection_key);
  if (Array.isArray(section.collectionKeys)) {
    section.collectionKeys.forEach(addKey);
  }
  if (Array.isArray(section.collection_keys)) {
    section.collection_keys.forEach(addKey);
  }

  normalizeItems(section).forEach((item) => {
    const kind = readReferenceKind(item);
    const key = readReferenceKey(item);
    if (COLLECTION_REFERENCE_KINDS.has(kind) || (!kind && key)) {
      addKey(key);
    }
  });

  return Array.from(keys);
}

function normalizeLookupValue(value = '') {
  return String(value || '').trim().toLowerCase();
}

function findProduct(products, referenceKey, referenceKind) {
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

function findCategory(categories, referenceKey, referenceKind) {
  const normalizedKey = normalizeLookupValue(referenceKey);
  if (!normalizedKey) {
    return null;
  }

  return categories.find((category) => {
    const categoryId = normalizeLookupValue(category?.id);
    const categorySlug = normalizeLookupValue(category?.slug);

    if (referenceKind === 'category_id') {
      return categoryId === normalizedKey;
    }
    if (referenceKind === 'category_slug') {
      return categorySlug === normalizedKey;
    }

    return categoryId === normalizedKey || categorySlug === normalizedKey;
  }) || null;
}

function buildCategoryImage(category, products) {
  const directImage = resolveImageUrl(
    category?.media?.url ||
    category?.image?.url ||
      category?.imageUrl ||
      category?.coverImage?.url ||
      category?.coverImageUrl ||
      ''
  );

  if (directImage) {
    return directImage;
  }

  const slug = String(category?.slug || category?.id || '').trim();
  const product = products.find((candidate) => candidate?.category === slug);
  return resolveImageUrl(getPrimaryImageUrl(product));
}

function stripHtml(value = '') {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function CategoryReferenceCard({ category, products, item }) {
  const title = item?.title || category?.name || 'Категория';
  const description = item?.description || category?.description || category?.summary || '';
  const imageUrl = buildCategoryImage(category, products);
  const imageMedia = category?.media || getPrimaryImageMedia(products.find((candidate) => candidate?.category === String(category?.slug || category?.id || '').trim()));
  const href = item?.url || buildCategoryListingHref(category?.slug || category?.id || '');

  return (
    <Card
      as={Link}
      to={href}
      variant="outline"
      padding="none"
      interactive
      className="group block h-full overflow-hidden rounded-[24px] border-0 bg-transparent shadow-none"
    >
      <div className="flex h-full flex-col">
        <div className="relative overflow-hidden border-b border-ink/10 bg-sand/45">
          <div className="relative pt-[68%]">
            {imageUrl ? (
              <ResponsiveImage
                media={imageMedia}
                src={imageUrl}
                alt={category?.image?.alt || title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(min-width: 1024px) 22rem, (min-width: 640px) 46vw, 92vw"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-muted">
                Фото раздела появится позже
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4">
          {item?.label ? (
            <p className="m-0 text-[11px] font-medium uppercase tracking-[0.18em] text-primary/85">
              {item.label}
            </p>
          ) : null}
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {description ? <p className="line-clamp-3 text-sm leading-6 text-muted">{description}</p> : null}
          <span className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary">
            Открыть раздел →
          </span>
        </div>
      </div>
    </Card>
  );
}

function CommerceSectionShell({ section, children, testId }) {
  const hasHeading = section?.eyebrow || section?.title || section?.body;

  return (
    <section id={section.anchorId || undefined} data-testid={testId} className="space-y-4">
      {hasHeading ? (
        <div className={`rounded-[24px] p-5 sm:p-6 ${getSurfaceToneClass(section.styleVariant)}`}>
          <CmsSectionHeading
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.body}
          />
          {(section.primaryCtaLabel || section.secondaryCtaLabel) ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <CmsAction label={section.primaryCtaLabel} url={section.primaryCtaUrl} />
              <CmsAction
                label={section.secondaryCtaLabel}
                url={section.secondaryCtaUrl}
                variant="secondary"
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function getReferenceListClass(section, referenceType = 'generic') {
  const layoutVariant = getCmsLayoutVariant(section?.layoutVariant);
  if (layoutVariant === 'rail') {
    return 'flex gap-4 overflow-x-auto pb-2 pr-4 snap-x snap-mandatory';
  }
  if (referenceType === 'product') {
    if (layoutVariant === 'full') {
      return 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4';
    }
    return 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4';
  }
  if (layoutVariant === 'full') {
    return 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4';
  }
  return 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';
}

function getReferenceItemClass(section) {
  return getCmsLayoutVariant(section?.layoutVariant) === 'rail'
    ? 'w-[82vw] max-w-[20rem] flex-none snap-start sm:w-[18rem]'
    : '';
}

function ProductReferenceList({ section, page }) {
  const { products, loading } = useProductDirectoryData();
  const references = normalizeItems(section)
    .map((item) => ({
      item,
      kind: readReferenceKind(item),
      key: readReferenceKey(item),
    }))
    .filter(({ kind, key }) => key && (!kind || PRODUCT_REFERENCE_KINDS.has(kind)));

  const resolvedProducts = useMemo(
    () =>
      references
        .map(({ key, kind }) => findProduct(products, key, kind))
        .filter(Boolean),
    [products, references]
  );

  if (!resolvedProducts.length && !loading) {
    return <FeatureListBlock section={section} />;
  }

  if (section?.layoutVariant === 'shop_the_look') {
    const imageUrl =
      resolveMediaUrl(section.image || section.imageUrl) ||
      resolveImageUrl(getPrimaryImageUrl(resolvedProducts[0]));

    return (
        <ShopTheLook
          title={section.title || 'Готовый образ'}
          description={stripHtml(section.body || section.description || '')}
          imageUrl={imageUrl}
          imageMedia={resolveMediaUrl(section.image || section.imageUrl) ? null : getPrimaryImageMedia(resolvedProducts[0])}
          products={resolvedProducts}
        />
    );
  }

  return (
    <CommerceSectionShell section={section}>
      {resolvedProducts.length ? (
        <div className={getReferenceListClass(section, 'product')}>
          {resolvedProducts.map((product) => (
            <div key={product.id || product.slug} className={getReferenceItemClass(section)}>
              <ProductCard
                product={product}
                deferThumbnails={page?.template === 'home'}
                imageSizes="(max-width: 767px) 48vw, (min-width: 1024px) 22rem, 46vw"
              />
            </div>
          ))}
        </div>
      ) : (
        <Card padding="lg" className="rounded-[24px] border border-dashed border-ink/10 bg-white/66 text-sm text-muted">
          Загружаем товары…
        </Card>
      )}
    </CommerceSectionShell>
  );
}

function CategoryReferenceList({ section, page }) {
  const { categories, products, loading } = useProductDirectoryData();
  const references = normalizeItems(section)
    .map((item) => ({
      item,
      kind: readReferenceKind(item),
      key: readReferenceKey(item),
    }))
    .filter(({ kind, key }) => key && (!kind || CATEGORY_REFERENCE_KINDS.has(kind)));

  const resolvedCategories = useMemo(
    () =>
      references
        .map(({ item, key, kind }) => {
          const category = findCategory(categories, key, kind);
          return category ? { category, item } : null;
        })
        .filter(Boolean),
    [categories, references]
  );

  if (!resolvedCategories.length && !loading) {
    return <FeatureListBlock section={section} />;
  }

  return (
    <CommerceSectionShell
      section={section}
      testId={page?.template === 'home' ? 'home-category-grid' : undefined}
    >
      {resolvedCategories.length ? (
        <div className={getReferenceListClass(section, 'category')}>
          {resolvedCategories.map(({ category, item }) => (
            <div key={category.id || category.slug} className={getReferenceItemClass(section)}>
              <CategoryReferenceCard
                category={category}
                products={products}
                item={item}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card padding="lg" className="rounded-[24px] border border-dashed border-ink/10 bg-white/66 text-sm text-muted">
          Загружаем разделы…
        </Card>
      )}
    </CommerceSectionShell>
  );
}

function CollectionTeaser({ section }) {
  const collectionKeys = readCollectionKeys(section);

  if (!collectionKeys.length) {
    return <FeatureListBlock section={section} />;
  }

  return (
    <CommerceSectionShell section={section}>
      <CmsStorefrontCollectionRail collectionKeys={collectionKeys} layoutVariant={section.layoutVariant} />
    </CommerceSectionShell>
  );
}

function CommerceReferenceBlock({ page, section }) {
  if (section?.sectionType === 'collection_teaser') {
    return <CollectionTeaser section={section} />;
  }
  if (section?.sectionType === 'category_reference_list') {
    return <CategoryReferenceList page={page} section={section} />;
  }
  if (section?.sectionType === 'product_reference_list') {
    return <ProductReferenceList page={page} section={section} />;
  }

  return <FeatureListBlock section={section} />;
}

export default CommerceReferenceBlock;

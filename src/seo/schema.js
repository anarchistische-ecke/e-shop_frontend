import { legalTokens } from '../data/legal/constants';
import {
  getPrimaryImageUrl,
  getPrimaryVariant,
  getProductPrice,
  moneyToNumber,
  normalizeProductImages,
  toArray
} from '../utils/product';
import { buildProductPath } from '../utils/url';

const DEFAULT_ORIGIN = legalTokens.SITE_URL;
const DEFAULT_CURRENCY = 'RUB';
const IN_STOCK_URL = 'https://schema.org/InStock';
const OUT_OF_STOCK_URL = 'https://schema.org/OutOfStock';
const NEW_CONDITION_URL = 'https://schema.org/NewCondition';

function normalizeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeNumber(value, fallback = 0) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function stripHtml(value = '') {
  return normalizeText(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

function absoluteUrl(path = '/', origin = DEFAULT_ORIGIN) {
  const rawPath = normalizeText(path, '/');
  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  let normalizedOrigin = DEFAULT_ORIGIN;
  try {
    normalizedOrigin = new URL(origin || DEFAULT_ORIGIN).origin;
  } catch (error) {
    normalizedOrigin = DEFAULT_ORIGIN;
  }

  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

function normalizeCurrency(value = DEFAULT_CURRENCY) {
  return normalizeText(value, DEFAULT_CURRENCY).toUpperCase();
}

function getStockCount(product, variant = null) {
  if (variant) {
    return normalizeNumber(variant.stock ?? variant.stockQuantity, 0);
  }
  if (!product) return 0;
  if (product.stock !== undefined || product.stockQuantity !== undefined) {
    return normalizeNumber(product.stock ?? product.stockQuantity, 0);
  }
  return toArray(product.variants).reduce(
    (sum, item) => sum + normalizeNumber(item?.stock ?? item?.stockQuantity, 0),
    0
  );
}

function getBrandName(product) {
  if (!product) return '';
  if (typeof product.brand === 'string') return normalizeText(product.brand);
  return normalizeText(product.brand?.name || product.brandName || product.brand_name);
}

function getProductImage(product, image = '', origin = DEFAULT_ORIGIN) {
  const explicitImage = normalizeText(image);
  if (explicitImage) {
    return absoluteUrl(explicitImage, origin);
  }
  const primaryImage = getPrimaryImageUrl(product);
  return primaryImage ? absoluteUrl(primaryImage, origin) : '';
}

function getProductDescription(product, fallback = '') {
  return (
    stripHtml(product?.description) ||
    stripHtml(product?.summary) ||
    stripHtml(product?.presentation?.seoDescription) ||
    normalizeText(fallback)
  );
}

function getProductDisplayName(product, fallback = '') {
  return normalizeText(
    product?.presentation?.marketingTitle || product?.marketingTitle || product?.name,
    fallback
  );
}

function shouldKeepValue(value) {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

export function pruneStructuredData(value) {
  if (Array.isArray(value)) {
    return value.map(pruneStructuredData).filter(shouldKeepValue);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, entryValue]) => {
    const normalizedValue = pruneStructuredData(entryValue);
    if (!shouldKeepValue(normalizedValue)) {
      return acc;
    }
    acc[key] = normalizedValue;
    return acc;
  }, {});
}

export function buildJsonLdGraph(nodes = []) {
  const graph = (Array.isArray(nodes) ? nodes : [nodes])
    .filter(Boolean)
    .map((node) => {
      const { '@context': _context, ...rest } = node;
      return pruneStructuredData(rest);
    })
    .filter(shouldKeepValue);

  if (!graph.length) {
    return null;
  }

  return pruneStructuredData({
    '@context': 'https://schema.org',
    '@graph': graph
  });
}

export function buildOrganizationJsonLd({ siteSettings = {}, origin = DEFAULT_ORIGIN } = {}) {
  const siteUrl = absoluteUrl('/', origin);
  const organizationId = `${siteUrl.replace(/\/$/, '')}/#organization`;
  const address = normalizeText(siteSettings.legalAddress || legalTokens.LEGAL_ADDRESS);

  return pruneStructuredData({
    '@type': 'Organization',
    '@id': organizationId,
    name: normalizeText(siteSettings.siteName || legalTokens.SITE_NAME),
    legalName: normalizeText(siteSettings.legalEntityFull || legalTokens.LEGAL_ENTITY_LONG),
    url: siteUrl,
    email: normalizeText(siteSettings.supportEmail || legalTokens.LEGAL_EMAIL),
    telephone: normalizeText(siteSettings.supportPhone || legalTokens.LEGAL_PHONE),
    address: address
      ? {
          '@type': 'PostalAddress',
          streetAddress: address,
          addressCountry: 'RU'
        }
      : null,
    identifier: [
      siteSettings.legalInn || legalTokens.LEGAL_INN
        ? {
            '@type': 'PropertyValue',
            propertyID: 'INN',
            value: siteSettings.legalInn || legalTokens.LEGAL_INN
          }
        : null,
      siteSettings.legalOgrnip || legalTokens.LEGAL_OGRNIP
        ? {
            '@type': 'PropertyValue',
            propertyID: 'OGRNIP',
            value: siteSettings.legalOgrnip || legalTokens.LEGAL_OGRNIP
          }
        : null
    ]
  });
}

export function buildWebSiteJsonLd({ siteSettings = {}, origin = DEFAULT_ORIGIN } = {}) {
  const siteUrl = absoluteUrl('/', origin);
  const baseUrl = siteUrl.replace(/\/$/, '');

  return pruneStructuredData({
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: siteUrl,
    name: normalizeText(siteSettings.siteName || legalTokens.SITE_NAME),
    description: normalizeText(siteSettings.defaultSeoDescription || siteSettings.brandDescription),
    inLanguage: 'ru-RU',
    publisher: { '@id': `${baseUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?query={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  });
}

export function buildBreadcrumbJsonLd(items = [], { origin = DEFAULT_ORIGIN } = {}) {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      name: normalizeText(item?.name || item?.label || item?.title),
      url: absoluteUrl(item?.url || item?.path || '/', origin)
    }))
    .filter((item) => item.name && item.url);

  if (normalizedItems.length < 2) {
    return null;
  }

  const lastUrl = normalizedItems[normalizedItems.length - 1].url;
  return pruneStructuredData({
    '@type': 'BreadcrumbList',
    '@id': `${lastUrl.replace(/\/$/, '')}/#breadcrumb`,
    itemListElement: normalizedItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  });
}

export function buildWebPageJsonLd({
  title = '',
  description = '',
  path = '/',
  image = '',
  breadcrumbs = null,
  siteSettings = {},
  origin = DEFAULT_ORIGIN,
  type = 'WebPage'
} = {}) {
  const pageUrl = absoluteUrl(path, origin);
  const baseUrl = absoluteUrl('/', origin).replace(/\/$/, '');
  const imageUrl = image ? absoluteUrl(image, origin) : '';

  return pruneStructuredData({
    '@type': type,
    '@id': `${pageUrl.replace(/\/$/, '') || baseUrl}/#webpage`,
    url: pageUrl,
    name: normalizeText(title),
    description: normalizeText(description),
    inLanguage: 'ru-RU',
    isPartOf: { '@id': `${baseUrl}/#website` },
    publisher: { '@id': `${baseUrl}/#organization` },
    breadcrumb: breadcrumbs?.['@id'] ? { '@id': breadcrumbs['@id'] } : undefined,
    primaryImageOfPage: imageUrl
      ? {
          '@type': 'ImageObject',
          url: imageUrl
        }
      : null,
    about: normalizeText(siteSettings.siteName || legalTokens.SITE_NAME)
  });
}

export function buildProductOfferData({
  product,
  variant = null,
  price,
  stock,
  url = '',
  origin = DEFAULT_ORIGIN
} = {}) {
  if (!product) return null;
  const resolvedVariant = variant || getPrimaryVariant(product);
  const resolvedPrice =
    price !== undefined && price !== null
      ? moneyToNumber(price)
      : resolvedVariant?.price !== undefined && resolvedVariant?.price !== null
      ? moneyToNumber(resolvedVariant.price)
      : getProductPrice(product);
  const resolvedStock =
    stock !== undefined && stock !== null ? normalizeNumber(stock, 0) : getStockCount(product, resolvedVariant);

  if (!Number.isFinite(resolvedPrice) || resolvedPrice <= 0) {
    return null;
  }

  return pruneStructuredData({
    '@type': 'Offer',
    price: resolvedPrice.toFixed(2),
    priceCurrency: normalizeCurrency(resolvedVariant?.priceCurrency || product.priceCurrency),
    availability: resolvedStock > 0 ? IN_STOCK_URL : OUT_OF_STOCK_URL,
    itemCondition: NEW_CONDITION_URL,
    url: absoluteUrl(url || buildProductPath(product), origin),
    sku: normalizeText(resolvedVariant?.sku || product.sku || resolvedVariant?.id || product.id)
  });
}

export function buildProductJsonLd({
  product,
  variant = null,
  categoryName = '',
  title = '',
  description = '',
  path = '',
  image = '',
  price,
  stock,
  origin = DEFAULT_ORIGIN
} = {}) {
  if (!product?.name) {
    return null;
  }
  const productUrl = absoluteUrl(path || buildProductPath(product), origin);
  const resolvedDescription = normalizeText(description) || getProductDescription(product);
  const offer = buildProductOfferData({
    product,
    variant,
    price,
    stock,
    url: productUrl,
    origin
  });
  const brandName = getBrandName(product);
  const imageUrl = getProductImage(product, image, origin);
  const ratingValue = normalizeNumber(product.rating, 0);
  const reviewCount = normalizeNumber(product.reviewCount || product.review_count, 0);

  if (!resolvedDescription || !offer) {
    return null;
  }

  return pruneStructuredData({
    '@type': 'Product',
    '@id': `${productUrl.replace(/\/$/, '')}/#product`,
    name: normalizeText(title) || getProductDisplayName(product),
    description: resolvedDescription,
    url: productUrl,
    sku: normalizeText(variant?.sku || product.sku || variant?.id || product.id),
    category: normalizeText(categoryName),
    image: imageUrl ? [imageUrl] : undefined,
    brand: brandName
      ? {
          '@type': 'Brand',
          name: brandName
        }
      : undefined,
    aggregateRating:
      ratingValue > 0 && reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue,
            reviewCount
          }
        : undefined,
    offers: offer
  });
}

export function buildOfferCatalogItem(product, {
  origin = DEFAULT_ORIGIN,
  position,
  url = '',
  image = ''
} = {}) {
  if (!product?.name) {
    return null;
  }
  const productUrl = absoluteUrl(url || buildProductPath(product), origin);
  const description = getProductDescription(product);
  const imageUrl = getProductImage(product, image, origin);
  const offer = buildProductOfferData({
    product,
    url: productUrl,
    origin
  });

  if (!description || !imageUrl || !offer) {
    return null;
  }

  return pruneStructuredData({
    '@type': 'Offer',
    position,
    name: product.name,
    description,
    url: productUrl,
    image: imageUrl,
    availability: offer.availability,
    price: offer.price,
    priceCurrency: offer.priceCurrency
  });
}

export function buildOfferCatalogJsonLd({
  name = '',
  description = '',
  image = '',
  products = [],
  origin = DEFAULT_ORIGIN
} = {}) {
  const items = (Array.isArray(products) ? products : [])
    .map((product, index) => buildOfferCatalogItem(product, { origin, position: index + 1 }))
    .filter(Boolean);
  const catalogImage =
    image && absoluteUrl(image, origin)
      ? absoluteUrl(image, origin)
      : items.find((item) => item.image)?.image || '';

  if (!normalizeText(name) || !normalizeText(description) || !catalogImage || !items.length) {
    return null;
  }

  return pruneStructuredData({
    '@type': 'OfferCatalog',
    name,
    description,
    image: catalogImage,
    itemListElement: items
  });
}

export function buildFaqPageJsonLd(page, { origin = DEFAULT_ORIGIN } = {}) {
  const sections = Array.isArray(page?.sections) ? page.sections : [];
  const questions = sections
    .filter((section) => String(section?.sectionType || '').trim() === 'faq_list')
    .flatMap((section) => (Array.isArray(section.items) ? section.items : []))
    .map((item) => {
      const question = normalizeText(item?.title || item?.label);
      const answer = stripHtml(item?.description || item?.body || item?.answer);
      if (!question || !answer) {
        return null;
      }
      return {
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer
        }
      };
    })
    .filter(Boolean);

  if (!questions.length) {
    return null;
  }

  return pruneStructuredData({
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(page?.path || '/', origin).replace(/\/$/, '')}/#faq`,
    mainEntity: questions
  });
}

export function buildProductMicrodata(product, options = {}) {
  const productNode = buildProductJsonLd({ product, ...options });
  if (!productNode) {
    return null;
  }

  return {
    name: productNode.name,
    description: productNode.description,
    image: Array.isArray(productNode.image) ? productNode.image[0] : '',
    sku: productNode.sku,
    brand: productNode.brand?.name || '',
    offer: productNode.offers
  };
}

export function buildOfferMicrodata(product, options = {}) {
  return buildOfferCatalogItem(product, options);
}

export function getNormalizedProductImages(product) {
  return normalizeProductImages(product?.images || []);
}

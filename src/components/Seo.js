import React from 'react';
import { Helmet } from 'react-helmet-async';
import { legalTokens } from '../data/legal/constants';
import { getCanonicalUrl } from '../utils/url';

const DEFAULT_DESCRIPTION =
  'Постельное белье, пледы, полотенца и домашний текстиль с доставкой по России. Натуральные ткани, безопасная оплата и понятные условия покупки.';
const DEFAULT_ROBOTS = 'index,follow';
const JSON_LD_SCRIPT_ID = 'cozyhome-seo-jsonld';

function normalizeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function buildTitle(title) {
  const pageTitle = normalizeText(title);
  return pageTitle ? `${pageTitle} | ${legalTokens.SITE_NAME}` : legalTokens.SITE_NAME;
}

function escapeJsonLdString(value) {
  return value
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function stringifyJsonLd(payload) {
  return escapeJsonLdString(JSON.stringify(payload));
}

function normalizeImageUrl(image) {
  const rawImageUrl = normalizeText(image);
  if (!rawImageUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(rawImageUrl) || rawImageUrl.startsWith('data:')) {
    return rawImageUrl;
  }

  return getCanonicalUrl(rawImageUrl, { origin: legalTokens.SITE_URL }) || rawImageUrl;
}

function buildJsonLdNodes(jsonLd) {
  const payload = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : [];
  if (payload.length === 0) {
    return null;
  }

  const serializedPayload = stringifyJsonLd(payload.length === 1 ? payload[0] : payload);

  return (
    <script id={JSON_LD_SCRIPT_ID} type="application/ld+json">
      {serializedPayload}
    </script>
  );
}

function Seo({
  title = '',
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '/',
  image = '',
  type = 'website',
  robots = DEFAULT_ROBOTS,
  jsonLd = null
}) {
  const pageTitle = buildTitle(title);
  const pageDescription = normalizeText(description, DEFAULT_DESCRIPTION);
  const canonicalUrl = getCanonicalUrl(canonicalPath, { origin: legalTokens.SITE_URL });
  const imageUrl = normalizeImageUrl(image);
  const twitterCard = imageUrl ? 'summary_large_image' : 'summary';

  return (
    <Helmet htmlAttributes={{ lang: 'ru' }}>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={normalizeText(robots, DEFAULT_ROBOTS)} />
      <meta property="og:site_name" content={legalTokens.SITE_NAME} />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      <meta property="og:type" content={normalizeText(type, 'website')} />
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
      {buildJsonLdNodes(jsonLd)}
    </Helmet>
  );
}

export default Seo;

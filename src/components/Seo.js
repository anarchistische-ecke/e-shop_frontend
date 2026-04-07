import { useLayoutEffect } from 'react';
import { legalTokens } from '../data/legal/constants';
import { buildAbsoluteAppUrl, buildAppPath } from '../utils/url';

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

function buildAbsoluteUrl(path = '/') {
  const runtimeUrl = buildAbsoluteAppUrl(path);
  if (runtimeUrl) return runtimeUrl;
  return `${legalTokens.SITE_URL.replace(/\/$/, '')}${buildAppPath(path)}`;
}

function upsertMeta({ name, property, content }) {
  if (typeof document === 'undefined') return;
  const key = name ? 'name' : 'property';
  const value = name || property;
  if (!value) return;

  let node = document.head.querySelector(`meta[${key}="${value}"]`);
  if (!content) {
    if (node) {
      node.remove();
    }
    return;
  }
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(key, value);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (typeof document === 'undefined' || !rel) return;
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!href) {
    if (node) {
      node.remove();
    }
    return;
  }
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
}

function upsertJsonLd(jsonLd) {
  if (typeof document === 'undefined') return;
  const payload = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : [];
  const existing = document.getElementById(JSON_LD_SCRIPT_ID);

  if (payload.length === 0) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  const node = existing || document.createElement('script');
  node.id = JSON_LD_SCRIPT_ID;
  node.type = 'application/ld+json';
  node.textContent = JSON.stringify(payload.length === 1 ? payload[0] : payload);
  if (!existing) {
    document.head.appendChild(node);
  }
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
  useLayoutEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const pageTitle = buildTitle(title);
    const pageDescription = normalizeText(description, DEFAULT_DESCRIPTION);
    const canonicalUrl = buildAbsoluteUrl(canonicalPath);
    const rawImageUrl = normalizeText(image);
    const imageUrl =
      rawImageUrl && !/^https?:\/\//i.test(rawImageUrl) && !rawImageUrl.startsWith('data:')
        ? buildAbsoluteUrl(rawImageUrl)
        : rawImageUrl;
    const twitterCard = imageUrl ? 'summary_large_image' : 'summary';

    document.title = pageTitle;
    document.documentElement.lang = 'ru';

    upsertMeta({ name: 'description', content: pageDescription });
    upsertMeta({ name: 'robots', content: normalizeText(robots, DEFAULT_ROBOTS) });
    upsertMeta({ property: 'og:site_name', content: legalTokens.SITE_NAME });
    upsertMeta({ property: 'og:locale', content: 'ru_RU' });
    upsertMeta({ property: 'og:title', content: pageTitle });
    upsertMeta({ property: 'og:description', content: pageDescription });
    upsertMeta({ property: 'og:url', content: canonicalUrl });
    upsertMeta({ property: 'og:type', content: normalizeText(type, 'website') });
    upsertMeta({ name: 'twitter:card', content: twitterCard });
    upsertMeta({ name: 'twitter:title', content: pageTitle });
    upsertMeta({ name: 'twitter:description', content: pageDescription });

    if (imageUrl) {
      upsertMeta({ property: 'og:image', content: imageUrl });
      upsertMeta({ name: 'twitter:image', content: imageUrl });
    }

    upsertLink('canonical', canonicalUrl);
    upsertJsonLd(jsonLd);
  }, [canonicalPath, description, image, jsonLd, robots, title, type]);

  return null;
}

export default Seo;

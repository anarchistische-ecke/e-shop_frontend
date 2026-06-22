import { getCategories, getProducts } from '../src/api/index.js';
import { legalTokens } from '../src/data/legal/constants.js';
import { readEnv } from '../src/config/runtime.js';
import { buildProductPath } from '../src/utils/url.js';

const DEFAULT_CACHE_TTL_MS = 0;
const TRACKING_CLEAN_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'yclid',
  'ymclid',
  'gclid',
  'fbclid',
  'ref'
];

const CORE_PUBLIC_PATHS = [
  '/',
  '/catalog',
  '/category/popular',
  '/category/new',
  '/about',
  '/info/delivery',
  '/info/payment',
  '/info/production',
  '/info/legal',
  '/konfidentsialnost-i-zashchita-informatsii',
  '/polzovatelskoe-soglashenie',
  '/soglasie-na-poluchenie-reklamy',
  '/usloviya-prodazhi',
  '/kuki',
  '/soglasie-na-obrabotku-pd'
];

function normalizeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeOrigin(origin = '') {
  const fallbackOrigin = legalTokens.SITE_URL;
  try {
    return new URL(origin || fallbackOrigin).origin.replace(/\/$/, '');
  } catch (error) {
    return fallbackOrigin;
  }
}

function normalizePath(path = '/') {
  const rawPath = normalizeText(path, '/');
  if (rawPath === '/') return '/';
  const withoutQuery = rawPath.split('?')[0].split('#')[0];
  const normalizedPath = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return normalizedPath.replace(/\/+$/, '') || '/';
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveCategoryToken(category) {
  return normalizeText(category?.slug || category?.id || category?.name);
}

function buildAbsoluteUrl(path, origin) {
  return `${normalizeOrigin(origin)}${normalizePath(path)}`;
}

export function buildSitemapEntries({ products = [], categories = [], origin = legalTokens.SITE_URL } = {}) {
  const urls = new Set();
  CORE_PUBLIC_PATHS.forEach((path) => urls.add(buildAbsoluteUrl(path, origin)));

  (Array.isArray(categories) ? categories : [])
    .filter((category) => category && category.isActive !== false)
    .forEach((category) => {
      const token = resolveCategoryToken(category);
      if (token) {
        urls.add(buildAbsoluteUrl(`/category/${encodeURIComponent(token)}`, origin));
      }
    });

  (Array.isArray(products) ? products : [])
    .filter((product) => product && product.isActive !== false)
    .forEach((product) => {
      const path = buildProductPath(product);
      if (path && path !== '/catalog') {
        urls.add(buildAbsoluteUrl(path, origin));
      }
    });

  return Array.from(urls)
    .sort((left, right) => left.localeCompare(right))
    .map((loc) => ({ loc }));
}

export function renderSitemapXml(entries = []) {
  const urls = (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry?.loc)
    .map((entry) => `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobotsTxt({ origin = legalTokens.SITE_URL } = {}) {
  const sitemapUrl = `${normalizeOrigin(origin)}/sitemap.xml`;
  const cleanParamRule = TRACKING_CLEAN_PARAMS.join('&');

  return [
    'User-agent: Yandex',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /manager',
    'Disallow: /manager/',
    `Clean-param: ${cleanParamRule}`,
    `Sitemap: ${sitemapUrl}`,
    '',
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /manager',
    'Disallow: /manager/',
    `Sitemap: ${sitemapUrl}`,
    ''
  ].join('\n');
}

async function loadSitemapEntries(origin) {
  const [productsResult, categoriesResult] = await Promise.allSettled([
    getProducts(),
    getCategories()
  ]);

  return buildSitemapEntries({
    origin,
    products: productsResult.status === 'fulfilled' ? productsResult.value : [],
    categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
  });
}

export function createSeoAssetsHandlers({ origin = legalTokens.SITE_URL } = {}) {
  const canonicalOrigin = normalizeOrigin(origin);
  const ttlMs = parsePositiveNumber(readEnv('SEO_ASSET_CACHE_TTL_MS'), DEFAULT_CACHE_TTL_MS);
  let sitemapCache = null;

  async function getSitemapXml() {
    const now = Date.now();
    if (ttlMs > 0 && sitemapCache && sitemapCache.expiresAt > now) {
      return sitemapCache.xml;
    }

    try {
      const entries = await loadSitemapEntries(canonicalOrigin);
      const xml = renderSitemapXml(entries);
      sitemapCache = ttlMs > 0
        ? { xml, expiresAt: now + ttlMs }
        : null;
      return xml;
    } catch (error) {
      if (sitemapCache?.xml) {
        return sitemapCache.xml;
      }
      return renderSitemapXml(buildSitemapEntries({ origin: canonicalOrigin }));
    }
  }

  async function sitemapHandler(_req, res, next) {
    try {
      const xml = await getSitemapXml();
      res
        .status(200)
        .setHeader('Content-Type', 'application/xml; charset=utf-8')
        .setHeader('Cache-Control', 'no-store')
        .end(xml);
    } catch (error) {
      next(error);
    }
  }

  function robotsHandler(_req, res) {
    res
      .status(200)
      .setHeader('Content-Type', 'text/plain; charset=utf-8')
      .setHeader('Cache-Control', 'public, max-age=300')
      .end(buildRobotsTxt({ origin: canonicalOrigin }));
  }

  function indexNowKeyHandler(req, res, next) {
    const key = normalizeText(readEnv('INDEXNOW_KEY'));
    if (!key || req.path !== `/${key}.txt`) {
      next();
      return;
    }
    res
      .status(200)
      .setHeader('Content-Type', 'text/plain; charset=utf-8')
      .setHeader('Cache-Control', 'public, max-age=300')
      .end(key);
  }

  return {
    sitemapHandler,
    robotsHandler,
    indexNowKeyHandler,
    getSitemapXml
  };
}

const { expect } = require('@playwright/test');

const rawAppBaseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const rawApiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL || new URL(rawAppBaseUrl).origin;

function trimTrailingSlash(value = '') {
  return String(value || '').replace(/\/+$/, '');
}

function ensureTrailingSlash(value = '') {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizeApiPath(path = '') {
  if (!path) {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeAppPath(path = '/') {
  const rawPath = String(path || '/').trim();
  if (!rawPath || rawPath === '/') {
    return '';
  }

  return rawPath.replace(/^\/+/, '');
}

function buildAppUrl(path = '/') {
  return new URL(normalizeAppPath(path), ensureTrailingSlash(rawAppBaseUrl)).toString();
}

function buildApiUrl(path = '/') {
  return `${trimTrailingSlash(rawApiBaseUrl)}${normalizeApiPath(path)}`;
}

function hasLiveCmsBaseUrl() {
  return Boolean(process.env.PLAYWRIGHT_BASE_URL);
}

function getCmsNavigationPlacement() {
  return process.env.PLAYWRIGHT_CMS_NAV_PLACEMENT || 'footer';
}

function getCmsPageSlug() {
  return process.env.PLAYWRIGHT_CMS_PAGE_SLUG || 'about';
}

function stripHtml(value = '') {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickNavigationItem(groups = []) {
  const items = groups.flatMap((group) => group?.items || []);
  return (
    items.find((item) => typeof item?.url === 'string' && item.url.startsWith('/') && item.label) ||
    items.find((item) => item?.url && item?.label) ||
    null
  );
}

function pickExpectedPageText(pagePayload = {}) {
  const sections = Array.isArray(pagePayload.sections) ? pagePayload.sections : [];
  const firstRichSection = sections.find((section) => stripHtml(section?.title) || stripHtml(section?.body));

  return (
    stripHtml(firstRichSection?.title) ||
    stripHtml(pagePayload.title) ||
    stripHtml(pagePayload.summary) ||
    stripHtml(firstRichSection?.body) ||
    ''
  );
}

async function fetchCmsNavigation(request, placement = getCmsNavigationPlacement()) {
  const response = await request.get(
    buildApiUrl(`/content/navigation?placement=${encodeURIComponent(placement)}`)
  );

  expect(response.ok(), `Expected CMS navigation request to succeed for placement "${placement}"`).toBeTruthy();
  return response.json();
}

async function fetchCmsPage(request, slug = getCmsPageSlug()) {
  const response = await request.get(buildApiUrl(`/content/pages/${encodeURIComponent(slug)}`));

  expect(response.ok(), `Expected CMS page request to succeed for slug "${slug}"`).toBeTruthy();
  return response.json();
}

function normalizeComparablePath(url) {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

module.exports = {
  buildAppUrl,
  buildApiUrl,
  fetchCmsNavigation,
  fetchCmsPage,
  getCmsNavigationPlacement,
  getCmsPageSlug,
  hasLiveCmsBaseUrl,
  normalizeComparablePath,
  pickExpectedPageText,
  pickNavigationItem,
};

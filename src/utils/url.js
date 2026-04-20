import { getRuntimeConfig, readEnv } from '../config/runtime.js';

const APP_ROOT_PATH = '/';

function isAbsoluteHttpUrl(value = '') {
  return /^https?:\/\//i.test(String(value).trim());
}

function normalizeOrigin(rawOrigin = '') {
  if (!rawOrigin) return '';

  try {
    const parsed = new URL(rawOrigin);
    return parsed.origin;
  } catch (err) {
    return '';
  }
}

function normalizeBasePath(rawPath = '') {
  if (!rawPath) return '';

  if (/^https?:\/\//i.test(rawPath)) {
    try {
      const parsedPath = new URL(rawPath).pathname.replace(/\/$/, '');
      return parsedPath === '/' ? '' : parsedPath;
    } catch (err) {
      return '';
    }
  }

  const normalizedPath = rawPath.replace(/\/$/, '');
  if (!normalizedPath || normalizedPath === '/') {
    return '';
  }

  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
}

function normalizeAppPath(path = APP_ROOT_PATH) {
  if (typeof path !== 'string' || !path.trim()) {
    return APP_ROOT_PATH;
  }

  if (path === APP_ROOT_PATH) {
    return APP_ROOT_PATH;
  }

  if (path.startsWith('//')) {
    return `/${path.replace(/^\/+/, '')}`;
  }

  return path.startsWith('/') ? path : `/${path}`;
}

function normalizePathSegment(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const normalized = String(value).trim();
  if (!normalized) {
    return '';
  }
  return encodeURIComponent(normalized);
}

export function resolveAppBasePath() {
  const runtimeConfig = getRuntimeConfig();
  return normalizeBasePath(
    runtimeConfig.basePath ||
      readEnv('REACT_APP_BASENAME') ||
      readEnv('PUBLIC_URL') ||
      ''
  );
}

export function buildAppPath(path = APP_ROOT_PATH) {
  const basePath = resolveAppBasePath();
  const normalizedPath = normalizeAppPath(path);

  if (normalizedPath === APP_ROOT_PATH) {
    return basePath ? `${basePath}/` : APP_ROOT_PATH;
  }

  return `${basePath}${normalizedPath}`;
}

export function buildAbsoluteAppUrl(path = APP_ROOT_PATH) {
  if (typeof window === 'undefined' || !window.location) {
    const runtimeOrigin = normalizeOrigin(getRuntimeConfig().siteUrl);
    if (!runtimeOrigin) {
      return undefined;
    }
    return `${runtimeOrigin}${buildAppPath(path)}`;
  }

  return `${window.location.origin}${buildAppPath(path)}`;
}

export function getCanonicalUrl(path = APP_ROOT_PATH, options = {}) {
  if (isAbsoluteHttpUrl(path)) {
    return String(path).trim();
  }

  const runtimeUrl = buildAbsoluteAppUrl(path);
  if (runtimeUrl) {
    return runtimeUrl;
  }

  const fallbackOrigin = normalizeOrigin(
    options.origin ||
      getRuntimeConfig().siteUrl ||
      readEnv('REACT_APP_SITE_URL') ||
      readEnv('REACT_APP_CANONICAL_ORIGIN') ||
      ''
  );

  if (!fallbackOrigin) {
    return undefined;
  }

  return `${fallbackOrigin}${buildAppPath(path)}`;
}

export function buildProductPath(product) {
  const productId = normalizePathSegment(product?.id);
  if (!productId) {
    return '/catalog';
  }

  const productSlug = normalizePathSegment(product?.slug);
  if (!productSlug) {
    return `/product/${productId}`;
  }

  return `/product/${productId}/${productSlug}`;
}

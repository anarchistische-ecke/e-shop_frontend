import {
  getCmsNavigation as getCmsNavigationRequest,
  getCmsPage as getCmsPageRequest,
  getCmsSiteSettings as getCmsSiteSettingsRequest,
  isApiRequestError,
} from './index';

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_RETRY_COUNT = 1;
const BASE_RETRY_DELAY_MS = 350;

const cmsCache = new Map();

function parseCacheTtlMs(value, fallback = DEFAULT_CACHE_TTL_MS) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const CLIENT_CACHE_TTL_MS = parseCacheTtlMs(
  process.env.REACT_APP_CMS_CACHE_TTL_MS,
  DEFAULT_CACHE_TTL_MS
);

function wait(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function shouldRetry(error, attempt, maxRetries) {
  if (attempt >= maxRetries) {
    return false;
  }

  if (!isApiRequestError(error)) {
    return true;
  }

  return error.status === 408 || error.status === 429 || error.status >= 500;
}

async function loadWithRetry(loader, { maxRetries = DEFAULT_RETRY_COUNT, signal } = {}) {
  let attempt = 0;

  while (true) {
    try {
      return await loader();
    } catch (error) {
      if (signal?.aborted || !shouldRetry(error, attempt, maxRetries)) {
        throw error;
      }

      attempt += 1;
      await wait(BASE_RETRY_DELAY_MS * attempt);
    }
  }
}

function readCachedEntry(cacheKey) {
  if (!cacheKey) {
    return null;
  }

  const entry = cmsCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cmsCache.delete(cacheKey);
    return null;
  }

  return entry;
}

function readCmsResource(cacheKey, loader, { cacheTtlMs = CLIENT_CACHE_TTL_MS, force = false, signal, maxRetries } = {}) {
  if (!force) {
    const cachedEntry = readCachedEntry(cacheKey);
    if (cachedEntry?.promise) {
      return cachedEntry.promise;
    }
    if (Object.prototype.hasOwnProperty.call(cachedEntry || {}, 'data')) {
      return Promise.resolve(cachedEntry.data);
    }
  }

  const promise = loadWithRetry(loader, { maxRetries, signal })
    .then((data) => {
      if (cacheKey && cacheTtlMs > 0) {
        cmsCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + cacheTtlMs,
        });
      } else if (cacheKey) {
        cmsCache.delete(cacheKey);
      }
      return data;
    })
    .catch((error) => {
      if (cacheKey) {
        cmsCache.delete(cacheKey);
      }
      throw error;
    });

  if (cacheKey && cacheTtlMs > 0) {
    cmsCache.set(cacheKey, {
      promise,
      expiresAt: Date.now() + cacheTtlMs,
    });
  }

  return promise;
}

export const cmsClient = {
  getSiteSettings({ preview = false, signal, force = false, cacheTtlMs = CLIENT_CACHE_TTL_MS } = {}) {
    const cacheKey = preview ? null : 'site-settings';
    return readCmsResource(
      cacheKey,
      () => getCmsSiteSettingsRequest({ preview, signal }),
      { cacheTtlMs, force, signal }
    );
  },

  getNavigation({ placement = '', preview = false, signal, force = false, cacheTtlMs = CLIENT_CACHE_TTL_MS } = {}) {
    const normalizedPlacement = String(placement || '').trim().toLowerCase();
    const cacheKey = preview ? null : `navigation:${normalizedPlacement || 'all'}`;
    return readCmsResource(
      cacheKey,
      () => getCmsNavigationRequest({ placement: normalizedPlacement, preview, signal }),
      { cacheTtlMs, force, signal }
    );
  },

  getPage(slug, { preview = false, signal, force = false, cacheTtlMs = CLIENT_CACHE_TTL_MS } = {}) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug) {
      return Promise.reject(new Error('CMS page slug is required'));
    }

    const cacheKey = preview ? null : `page:${normalizedSlug}`;
    return readCmsResource(
      cacheKey,
      () => getCmsPageRequest(normalizedSlug, { preview, signal }),
      { cacheTtlMs, force, signal }
    );
  },

  clearCache(prefix = '') {
    const normalizedPrefix = String(prefix || '').trim();
    if (!normalizedPrefix) {
      cmsCache.clear();
      return;
    }

    Array.from(cmsCache.keys()).forEach((key) => {
      if (key.startsWith(normalizedPrefix)) {
        cmsCache.delete(key);
      }
    });
  },
};

export default cmsClient;

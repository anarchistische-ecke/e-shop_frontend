import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getBrands,
  getCategories,
  getCmsCollection,
  getCmsNavigation,
  getCmsPage,
  getCmsSiteSettings,
  getProduct,
  getProducts
} from '../src/api/index.js';
import { readEnv } from '../src/config/runtime.js';
import { legalTokens } from '../src/data/legal/constants.js';
import {
  applyLegalTokens,
  buildLegalRuntimeTokens
} from '../src/pages/legal/legalDocuments.js';

const DIRECTORY_ROUTE_IDS = new Set(['home', 'catalog', 'category', 'product']);
const CMS_PAGE_SLUG_BY_ROUTE_ID = {
  home: 'home',
  about: 'about',
  'payment-info': 'payment',
  'delivery-info': 'delivery',
  'bonuses-info': 'bonuses',
  'production-info': 'production'
};
const LEGAL_FILE_BY_ROUTE_ID = {
  'privacy-policy': 'privacy.html',
  'user-agreement': 'user-agreement.html',
  'ads-consent': 'ads-consent.html',
  'sales-terms': 'sales-terms.html',
  'cookies-policy': 'cookies.html',
  'personal-data-consent': 'pd-consent.html'
};
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const publicDir = path.join(projectRoot, 'public');
const sharedCache = new Map();
const DEFAULT_CACHE_TTL_MS = parsePositiveNumber(
  readEnv('SSR_SHARED_CACHE_TTL_MS', '60000'),
  60000
);

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function resolveCanonicalOrigin(requestOrigin = '') {
  return (
    String(
      readEnv('REACT_APP_SITE_URL') ||
        readEnv('REACT_APP_CANONICAL_ORIGIN') ||
        requestOrigin ||
        legalTokens.SITE_URL
    )
      .trim()
      .replace(/\/$/, '') || legalTokens.SITE_URL
  );
}

function getCachedValue(key) {
  const cached = sharedCache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    sharedCache.delete(key);
    return null;
  }

  return cached;
}

async function readThroughCache(key, loader, ttlMs = DEFAULT_CACHE_TTL_MS) {
  const cached = getCachedValue(key);
  if (cached?.promise) {
    return cached.promise;
  }
  if (cached && Object.prototype.hasOwnProperty.call(cached, 'value')) {
    return cached.value;
  }

  const promise = loader()
    .then((value) => {
      sharedCache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs
      });
      return value;
    })
    .catch((error) => {
      sharedCache.delete(key);
      throw error;
    });

  sharedCache.set(key, {
    promise,
    expiresAt: Date.now() + ttlMs
  });

  return promise;
}

async function loadSharedCmsData() {
  const [siteSettingsResult, footerNavigationResult] = await Promise.allSettled([
    readThroughCache('cms:site-settings', () => getCmsSiteSettings()),
    readThroughCache('cms:navigation:footer', () =>
      getCmsNavigation({ placement: 'footer' })
    )
  ]);

  return {
    siteSettings:
      siteSettingsResult.status === 'fulfilled'
        ? siteSettingsResult.value
        : null,
    footerNavigation:
      footerNavigationResult.status === 'fulfilled'
        ? footerNavigationResult.value
        : null
  };
}

async function loadDirectoryData() {
  try {
    return await readThroughCache('catalogue:directory', async () => {
      const [categories, brands, products] = await Promise.all([
        getCategories(),
        getBrands(),
        getProducts()
      ]);

      return {
        categories: Array.isArray(categories) ? categories : [],
        brands: Array.isArray(brands) ? brands : [],
        products: Array.isArray(products)
          ? products.filter((product) => product?.isActive !== false)
          : []
      };
    });
  } catch (error) {
    return null;
  }
}

async function loadCmsPageSeed(slug) {
  try {
    const page = await readThroughCache(`cms:page:${slug}`, () => getCmsPage(slug));
    return { slug, page, shouldUseFallback: false };
  } catch (error) {
    return {
      slug,
      page: null,
      shouldUseFallback: error?.status === 404,
      error
    };
  }
}

function normalizeReferenceKind(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');
}

function readReferenceKey(source = {}) {
  return String(
    source.referenceKey ||
      source.reference_key ||
      source.collectionKey ||
      source.collection_key ||
      source.key ||
      ''
  ).trim();
}

function collectCmsCollectionKeysFromPage(page) {
  const keys = new Set();

  if (!page || !Array.isArray(page.sections)) {
    return [];
  }

  page.sections.forEach((section) => {
    const sectionType = normalizeReferenceKind(section?.sectionType);
    const addKey = (key) => {
      const normalizedKey = String(key || '').trim();
      if (normalizedKey) {
        keys.add(normalizedKey);
      }
    };

    addKey(section?.collectionKey || section?.collection_key);
    if (Array.isArray(section?.collectionKeys)) {
      section.collectionKeys.forEach(addKey);
    }
    if (Array.isArray(section?.collection_keys)) {
      section.collection_keys.forEach(addKey);
    }

    const sectionReferenceKind = normalizeReferenceKind(
      section?.referenceKind || section?.reference_kind
    );
    if (
      ['collection', 'storefront_collection', 'collection_key', 'cms_collection'].includes(
        sectionReferenceKind
      )
    ) {
      addKey(readReferenceKey(section));
    }

    (Array.isArray(section?.items) ? section.items : []).forEach((item) => {
      const referenceKind = normalizeReferenceKind(item?.referenceKind || item?.reference_kind);
      const referenceKey = readReferenceKey(item);
      const isCollectionReference = [
        'collection',
        'storefront_collection',
        'collection_key',
        'cms_collection'
      ].includes(referenceKind);

      if (isCollectionReference || (sectionType === 'collection_teaser' && !referenceKind)) {
        addKey(referenceKey);
      }
    });
  });

  return Array.from(keys);
}

async function loadCmsCollectionsSeed(page) {
  const collectionKeys = collectCmsCollectionKeysFromPage(page);
  if (!collectionKeys.length) {
    return null;
  }

  const results = await Promise.allSettled(
    collectionKeys.map((key) =>
      readThroughCache(`cms:collection:${key}`, () => getCmsCollection(key))
        .then((collection) => ({ key, collection }))
    )
  );

  return results.reduce(
    (acc, result, index) => {
      const key = collectionKeys[index];
      if (result.status === 'fulfilled' && result.value?.collection) {
        acc.collectionsByKey[result.value.key] = result.value.collection;
        return acc;
      }

      const error = result.reason;
      if (error?.status === 404) {
        acc.missingCollectionKeys.push(key);
      }
      return acc;
    },
    { collectionsByKey: {}, missingCollectionKeys: [] }
  );
}

async function loadProductSeed(productId) {
  try {
    const product = await readThroughCache(
      `product:${productId}`,
      () => getProduct(productId),
      parsePositiveNumber(readEnv('SSR_PRODUCT_CACHE_TTL_MS', '30000'), 30000)
    );

    if (!product || product?.isActive === false) {
      return {
        product: null,
        productId,
        notFound: true
      };
    }

    return {
      product,
      productId,
      notFound: false
    };
  } catch (error) {
    return {
      product: null,
      productId,
      notFound: error?.status === 404,
      error
    };
  }
}

async function loadLegalDocumentSeed(fileName, requestOrigin) {
  try {
    const rawHtml = await readThroughCache(
      `legal:${fileName}`,
      () => fs.readFile(path.join(publicDir, 'legal', fileName), 'utf8'),
      parsePositiveNumber(readEnv('SSR_LEGAL_CACHE_TTL_MS', '300000'), 300000)
    );
    const content = applyLegalTokens(
      rawHtml,
      buildLegalRuntimeTokens({
        publicUrl: '',
        siteUrl: resolveCanonicalOrigin(requestOrigin)
      })
    );

    return {
      fileName,
      content,
      notFound: false
    };
  } catch (error) {
    return {
      fileName,
      content: '',
      error: 'Не удалось загрузить документ.',
      notFound: true
    };
  }
}

function mergeCmsSeed(currentCms, sharedCms, pageSeed, collectionsSeed) {
  const cms = currentCms ? { ...currentCms } : {};

  if (sharedCms?.siteSettings) {
    cms.siteSettings = sharedCms.siteSettings;
  }
  if (sharedCms?.footerNavigation) {
    cms.footerNavigation = sharedCms.footerNavigation;
  }

  if (pageSeed?.page) {
    cms.pages = {
      ...(cms.pages || {}),
      [pageSeed.slug]: pageSeed.page
    };
  }

  if (pageSeed?.shouldUseFallback) {
    cms.missingPageSlugs = Array.from(
      new Set([...(cms.missingPageSlugs || []), pageSeed.slug])
    );
  }

  if (collectionsSeed?.collectionsByKey && Object.keys(collectionsSeed.collectionsByKey).length > 0) {
    cms.collectionsByKey = {
      ...(cms.collectionsByKey || {}),
      ...collectionsSeed.collectionsByKey
    };
  }

  if (Array.isArray(collectionsSeed?.missingCollectionKeys) && collectionsSeed.missingCollectionKeys.length > 0) {
    cms.missingCollectionKeys = Array.from(
      new Set([...(cms.missingCollectionKeys || []), ...collectionsSeed.missingCollectionKeys])
    );
  }

  return Object.keys(cms).length > 0 ? cms : null;
}

export function buildClientRuntimeConfig({ requestOrigin = '' } = {}) {
  return {
    basePath: '',
    publicUrl: '',
    siteUrl: resolveCanonicalOrigin(requestOrigin),
    apiBase: readEnv('REACT_APP_API_BASE'),
    imageBase:
      readEnv('REACT_APP_IMAGE_BASE') ||
      readEnv('REACT_APP_STORAGE_BASE_URL') ||
      readEnv('REACT_APP_ASSET_BASE_URL'),
    keycloakUrl: readEnv('REACT_APP_KEYCLOAK_URL'),
    keycloakRealm: readEnv('REACT_APP_KEYCLOAK_REALM'),
    keycloakClientId: readEnv('REACT_APP_KEYCLOAK_CLIENT_ID')
  };
}

export async function loadSsrRequestData({
  route,
  params = {},
  requestOrigin = ''
} = {}) {
  const ssrData = {
    routeId: route?.id || 'not-found',
    renderMode: route?.renderMode || 'csr',
    routeParams: params,
    routeData: null
  };
  let statusCode = route?.id === 'not-found' ? 404 : 200;

  if (route?.renderMode !== 'ssr') {
    return { ssrData, statusCode };
  }

  const cmsPageSlug = CMS_PAGE_SLUG_BY_ROUTE_ID[route.id];
  const legalFileName = LEGAL_FILE_BY_ROUTE_ID[route.id];
  const [sharedCms, directory, cmsPageSeed, productSeed, legalSeed] =
    await Promise.all([
      loadSharedCmsData(),
      DIRECTORY_ROUTE_IDS.has(route.id)
        ? loadDirectoryData()
        : Promise.resolve(null),
      cmsPageSlug ? loadCmsPageSeed(cmsPageSlug) : Promise.resolve(null),
      route.id === 'product' && params.id
        ? loadProductSeed(params.id)
        : Promise.resolve(null),
      legalFileName
        ? loadLegalDocumentSeed(legalFileName, requestOrigin)
        : Promise.resolve(null)
    ]);

  const cmsCollectionsSeed = cmsPageSeed?.page
    ? await loadCmsCollectionsSeed(cmsPageSeed.page)
    : null;
  const cmsSeed = mergeCmsSeed(null, sharedCms, cmsPageSeed, cmsCollectionsSeed);
  if (cmsSeed) {
    ssrData.cms = cmsSeed;
  }

  if (directory) {
    ssrData.directory = directory;
  }

  if (productSeed) {
    ssrData.routeData = {
      kind: 'product',
      productId: productSeed.productId,
      product: productSeed.product,
      notFound: productSeed.notFound
    };
    if (!productSeed.product && productSeed.notFound) {
      statusCode = 404;
    }
  }

  if (legalSeed) {
    ssrData.routeData = {
      kind: 'legal-document',
      fileName: legalSeed.fileName,
      content: legalSeed.content,
      error: legalSeed.error || ''
    };
    if (!legalSeed.content) {
      statusCode = 404;
    }
  }

  return { ssrData, statusCode };
}

import {
  getRuntimeConfig,
  isProductionEnvironment,
  readBooleanEnv,
  readEnv
} from '../config/runtime';

const SCRIPT_ID = 'yandex-metrika-tag';
const SCRIPT_SRC = 'https://mc.yandex.ru/metrika/tag.js';
const DATA_LAYER_NAME = 'dataLayer';
const ATTRIBUTION_STORAGE_KEY = 'cozyhome.analytics.attribution.v1';
const CLIENT_ID_STORAGE_KEY = 'cozyhome.analytics.metrikaClientId';
const PURCHASE_ID_STORAGE_KEY = 'cozyhome.analytics.purchaseId';
const MAX_METRIKA_PAYLOAD_BYTES = 7800;
const DEFAULT_CURRENCY = 'RUB';
const PII_KEY_PATTERN =
  /(^|[_-])(email|e[_-]?mail|phone|tel|fio|first[_-]?name|last[_-]?name|full[_-]?name|customer[_-]?name|recipient[_-]?name|address|addr|passport|token|secret|password|card|pan|cvv|cvc|public[_-]?token|authorization)($|[_-])/i;
const EMAIL_VALUE_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_VALUE_PATTERN = /(?:\+?\d[\s().-]*){8,}/;
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id'
];
const DEFAULT_METRIKA_OPTIONS = {
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: false,
  ecommerce: DATA_LAYER_NAME
};

export const METRIKA_GOALS = {
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CART_QUANTITY_CHANGE: 'cart_quantity_change',
  VIEW_CART: 'view_cart',
  CATEGORY_NAV_CLICK: 'category_nav_click',
  SEARCH_SUBMIT: 'search_submit',
  SEARCH_ZERO_RESULTS: 'search_zero_results',
  SEARCH_FILTER_CHANGE: 'search_filter_change',
  SEARCH_SORT_CHANGE: 'search_sort_change',
  SEARCH_SUGGESTION_CLICK: 'search_suggestion_click',
  PRODUCT_LIST_VIEW: 'product_list_view',
  PRODUCT_CLICK: 'product_click',
  PRODUCT_DETAIL: 'product_detail',
  PRODUCT_VARIANT_CHANGE: 'product_variant_change',
  PRODUCT_GALLERY_INTERACTION: 'product_gallery_interaction',
  PRODUCT_INFO_OPEN: 'product_info_open',
  PRODUCT_SPEC_INTERACTION: 'product_spec_interaction',
  BUNDLE_SELECT: 'bundle_select',
  PROMO_VIEW: 'promo_view',
  PROMO_CLICK: 'promo_click',
  PROMO_CODE_ATTEMPT: 'promo_code_attempt',
  PROMO_CODE_SUCCESS: 'promo_code_success',
  PROMO_CODE_FAILURE: 'promo_code_failure',
  CHECKOUT_CTA_CLICK: 'checkout_cta_click',
  BEGIN_CHECKOUT: 'begin_checkout',
  CHECKOUT_STEP_VIEW: 'checkout_step_view',
  CHECKOUT_STEP_SUBMIT: 'checkout_step_submit',
  CHECKOUT_FIELD_ERROR: 'checkout_field_error',
  CHECKOUT_SHIPPING_SELECT: 'checkout_shipping_select',
  ADD_SHIPPING_INFO: 'add_shipping_info',
  ADD_PAYMENT_INFO: 'add_payment_info',
  CHECKOUT_SUBMIT: 'checkout_submit',
  CHECKOUT_PAYMENT_RESULT: 'checkout_payment_result',
  PAYMENT_SESSION_SUCCESS: 'payment_session_success',
  PAYMENT_SESSION_FAILURE: 'payment_session_failure',
  PURCHASE: 'purchase',
  MANAGER_LINK_CREATED: 'manager_link_created',
  MANAGER_LINK_OPENED: 'manager_link_opened',
  MANAGER_LINK_PAYMENT_STARTED: 'manager_link_payment_started',
  MANAGER_LINK_PAID: 'manager_link_paid',
  CONTACT_CLICK: 'contact_click'
};

function getRuntimeValue(key, envName, fallback = '') {
  const runtimeConfig = getRuntimeConfig();
  const value = runtimeConfig?.[key];
  if (value !== undefined && value !== null && String(value).trim()) {
    return String(value).trim();
  }
  return readEnv(envName, fallback);
}

function getRuntimeBoolean(key, envName, fallback = false) {
  const runtimeConfig = getRuntimeConfig();
  const value = runtimeConfig?.[key];
  if (typeof value === 'boolean') {
    return value;
  }
  if (value !== undefined && value !== null && String(value).trim()) {
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  }
  return readBooleanEnv(envName, fallback);
}

function resolveCounterId() {
  const rawCounterId = getRuntimeValue(
    'metrikaCounterId',
    'REACT_APP_YANDEX_METRIKA_ID',
    '0'
  );
  const counterId = Number(rawCounterId);
  return Number.isFinite(counterId) && counterId > 0 ? counterId : 0;
}

function canUseBrowser() {
  return typeof window !== 'undefined';
}

function canUseMetrika() {
  return canUseBrowser() && resolveCounterId() > 0;
}

function isDebugEnabled() {
  if (!canUseBrowser()) return false;
  const url = new URL(window.location.href);
  return (
    url.searchParams.get('_ym_debug') === '2' ||
    getRuntimeBoolean('metrikaDebug', 'REACT_APP_YANDEX_METRIKA_DEBUG', false)
  );
}

function safeParseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function readStorage(storage, key) {
  if (!canUseBrowser() || !storage) return '';
  try {
    return storage.getItem(key) || '';
  } catch (error) {
    return '';
  }
}

function writeStorage(storage, key, value) {
  if (!canUseBrowser() || !storage) return;
  try {
    storage.setItem(key, value);
  } catch (error) {
  }
}

function truncateString(value, maxLength = 256) {
  const normalized = String(value || '').trim();
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}

function valueLooksLikePii(value) {
  if (typeof value !== 'string') return false;
  return EMAIL_VALUE_PATTERN.test(value) || PHONE_VALUE_PATTERN.test(value);
}

function shouldDropParam(key, value) {
  return PII_KEY_PATTERN.test(String(key || '')) || valueLooksLikePii(value);
}

export function sanitizeAnalyticsParams(params = {}) {
  return Object.entries(params || {}).reduce((acc, [key, value]) => {
    if (!key || value === undefined || value === null || value === '') return acc;
    if (shouldDropParam(key, value)) return acc;

    if (typeof value === 'string') {
      acc[key] = truncateString(value, 512);
      return acc;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      acc[key] = value;
      return acc;
    }
    if (typeof value === 'boolean') {
      acc[key] = value;
      return acc;
    }
    if (value instanceof Date) {
      acc[key] = value.toISOString();
      return acc;
    }
    if (Array.isArray(value)) {
      const safeValues = value
        .filter((item) => ['string', 'number', 'boolean'].includes(typeof item))
        .filter((item) => !shouldDropParam(key, item))
        .slice(0, 20);
      if (safeValues.length) {
        acc[key] = safeValues;
      }
      return acc;
    }
    if (typeof value === 'object') {
      const nested = sanitizeAnalyticsParams(value);
      if (Object.keys(nested).length) {
        acc[key] = nested;
      }
    }
    return acc;
  }, {});
}

function safeJsonSize(value) {
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch (error) {
    return JSON.stringify(value || {}).length;
  }
}

function ensureDataLayer() {
  if (!canUseBrowser()) return null;
  if (!Array.isArray(window[DATA_LAYER_NAME])) {
    window[DATA_LAYER_NAME] = [];
  }
  return window[DATA_LAYER_NAME];
}

function debugLog(label, payload) {
  if (isDebugEnabled()) {
    console.info(`[Metrica] ${label}`, payload);
  }
}

function resolveMetrikaOptions() {
  return {
    clickmap: getRuntimeBoolean(
      'metrikaClickmap',
      'REACT_APP_YANDEX_METRIKA_CLICKMAP',
      DEFAULT_METRIKA_OPTIONS.clickmap
    ),
    trackLinks: getRuntimeBoolean(
      'metrikaTrackLinks',
      'REACT_APP_YANDEX_METRIKA_TRACK_LINKS',
      DEFAULT_METRIKA_OPTIONS.trackLinks
    ),
    accurateTrackBounce: getRuntimeBoolean(
      'metrikaAccurateTrackBounce',
      'REACT_APP_YANDEX_METRIKA_ACCURATE_BOUNCE',
      DEFAULT_METRIKA_OPTIONS.accurateTrackBounce
    ),
    webvisor: getRuntimeBoolean(
      'metrikaWebvisor',
      'REACT_APP_YANDEX_METRIKA_WEBVISOR',
      DEFAULT_METRIKA_OPTIONS.webvisor
    ),
    ecommerce:
      getRuntimeValue(
        'metrikaEcommerce',
        'REACT_APP_YANDEX_METRIKA_ECOMMERCE',
        DEFAULT_METRIKA_OPTIONS.ecommerce
      ) || DEFAULT_METRIKA_OPTIONS.ecommerce
  };
}

function getCurrentUrlParts() {
  if (!canUseBrowser()) {
    return {
      path: '',
      origin: '',
      searchParams: new URLSearchParams()
    };
  }
  const url = new URL(window.location.href);
  return {
    path: `${url.pathname}${url.search}${url.hash}`,
    origin: url.origin,
    searchParams: url.searchParams
  };
}

function resolveDeviceType() {
  if (!canUseBrowser()) return '';
  const width = window.innerWidth || 0;
  if (width > 0 && width < 768) return 'mobile';
  if (width >= 768 && width < 1024) return 'tablet';
  return 'desktop';
}

function resolveBrowserFamily() {
  if (!canUseBrowser() || !window.navigator?.userAgent) return '';
  const userAgent = window.navigator.userAgent;
  if (/YaBrowser/i.test(userAgent)) return 'yandex';
  if (/Edg\//i.test(userAgent)) return 'edge';
  if (/Chrome\//i.test(userAgent)) return 'chrome';
  if (/Safari\//i.test(userAgent)) return 'safari';
  if (/Firefox\//i.test(userAgent)) return 'firefox';
  return 'other';
}

function normalizeAttribution(rawAttribution = {}) {
  return sanitizeAnalyticsParams({
    metrikaClientId: rawAttribution.metrikaClientId,
    metrikaUserId: rawAttribution.metrikaUserId,
    yclid: rawAttribution.yclid,
    utm: rawAttribution.utm,
    referrer: rawAttribution.referrer,
    landingPage: rawAttribution.landingPage,
    currentPath: rawAttribution.currentPath,
    currentOrigin: rawAttribution.currentOrigin,
    sessionStartedAt: rawAttribution.sessionStartedAt,
    purchaseId: rawAttribution.purchaseId,
    deviceType: rawAttribution.deviceType,
    browserFamily: rawAttribution.browserFamily,
    firstVisit: rawAttribution.firstVisit
  });
}

function createPurchaseId() {
  if (!canUseBrowser()) return '';
  const existing = readStorage(window.sessionStorage, PURCHASE_ID_STORAGE_KEY);
  if (existing) return existing;
  const generated =
    window.crypto?.randomUUID?.() ||
    `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  writeStorage(window.sessionStorage, PURCHASE_ID_STORAGE_KEY, generated);
  return generated;
}

function captureAttribution() {
  if (!canUseBrowser()) return {};

  const { path, origin, searchParams } = getCurrentUrlParts();
  const storedAttribution = safeParseJson(
    readStorage(window.localStorage, ATTRIBUTION_STORAGE_KEY),
    {}
  ) || {};
  const utm = UTM_KEYS.reduce((acc, key) => {
    const value = searchParams.get(key);
    if (value) {
      acc[key] = truncateString(value, 256);
    }
    return acc;
  }, {});
  const yclid = searchParams.get('yclid') || storedAttribution.yclid || '';
  const firstVisit = !storedAttribution.sessionStartedAt;
  const nextAttribution = normalizeAttribution({
    ...storedAttribution,
    utm: Object.keys(storedAttribution.utm || {}).length ? storedAttribution.utm : utm,
    yclid,
    referrer: storedAttribution.referrer || document.referrer || '',
    landingPage: storedAttribution.landingPage || path,
    currentPath: path,
    currentOrigin: origin,
    sessionStartedAt: storedAttribution.sessionStartedAt || new Date().toISOString(),
    metrikaClientId:
      readStorage(window.localStorage, CLIENT_ID_STORAGE_KEY) ||
      storedAttribution.metrikaClientId ||
      '',
    metrikaUserId: storedAttribution.metrikaUserId || '',
    purchaseId: createPurchaseId(),
    deviceType: resolveDeviceType(),
    browserFamily: resolveBrowserFamily(),
    firstVisit
  });

  writeStorage(window.localStorage, ATTRIBUTION_STORAGE_KEY, JSON.stringify(nextAttribution));
  return nextAttribution;
}

function requestMetrikaClientId() {
  if (!canUseMetrika() || !window.ym) return;
  const counterId = resolveCounterId();
  try {
    window.ym(counterId, 'getClientID', (clientId) => {
      if (!clientId) return;
      writeStorage(window.localStorage, CLIENT_ID_STORAGE_KEY, String(clientId));
      const attribution = captureAttribution();
      writeStorage(
        window.localStorage,
        ATTRIBUTION_STORAGE_KEY,
        JSON.stringify({ ...attribution, metrikaClientId: String(clientId) })
      );
    });
  } catch (error) {
    if (!isProductionEnvironment()) {
      console.warn('Failed to read Metrica ClientID:', error);
    }
  }
}

function normalizeGoalName(goal = '') {
  return String(goal || '').trim().replace(/[\\/&#?="]/g, '_');
}

function callMetrika(method, ...args) {
  if (!canUseMetrika() || !window.ym) return;
  const counterId = resolveCounterId();
  try {
    window.ym(counterId, method, ...args);
    debugLog(method, args);
  } catch (error) {
    if (!isProductionEnvironment()) {
      console.warn(`Failed to call Metrica ${method}:`, error);
    }
  }
}

function normalizeMoney(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const parsed = Number(String(value).replace(/\s+/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeCategoryName(product = {}) {
  if (product.categoryName) return product.categoryName;
  if (product.category?.name) return product.category.name;
  if (Array.isArray(product.categories) && product.categories[0]?.name) {
    return product.categories[0].name;
  }
  return product.category || '';
}

function normalizeVariantName(product = {}, explicitVariant = null) {
  if (explicitVariant?.name || explicitVariant?.sku) {
    return explicitVariant.name || explicitVariant.sku;
  }
  if (product.variantName) return product.variantName;
  if (product.selectedVariant?.name || product.selectedVariant?.sku) {
    return product.selectedVariant.name || product.selectedVariant.sku;
  }
  if (product.variant?.name || product.variant?.sku) {
    return product.variant.name || product.variant.sku;
  }
  return '';
}

export function buildEcommerceProduct(product = {}, options = {}) {
  const explicitVariant = options.variant || null;
  const productInfo = product.productInfo || {};
  const pricingLine = product.pricingLine || {};
  const id =
    options.variantId ||
    explicitVariant?.id ||
    product.variantId ||
    product.id ||
    product.productId ||
    productInfo.id ||
    product.sku;
  const name =
    product.name ||
    product.productName ||
    productInfo.name ||
    product.title ||
    pricingLine.productName ||
    'Товар';
  const price = normalizeMoney(
    options.price ??
      pricingLine.unitPrice ??
      product.unitPriceValue ??
      product.price ??
      explicitVariant?.price ??
      product.selectedVariant?.price ??
      product.variant?.price
  );
  const quantity = normalizeMoney(options.quantity ?? product.quantity) || 1;
  const normalized = {
    id: truncateString(id || name, 128),
    name: truncateString(name, 256),
    brand: truncateString(
      product.brandName || product.brand?.name || product.manufacturer || '',
      128
    ),
    category: truncateString(normalizeCategoryName(product), 256),
    variant: truncateString(normalizeVariantName(product, explicitVariant), 128),
    price,
    quantity,
    list: truncateString(options.listName || product.listName || '', 128),
    position: Number.isFinite(Number(options.position ?? product.position))
      ? Number(options.position ?? product.position)
      : undefined,
    coupon: truncateString(options.coupon || product.coupon || product.promoCode || '', 128),
    discount: normalizeMoney(
      options.discount ??
        pricingLine.discountTotal ??
        product.discountValue ??
        product.discount
    )
  };

  return Object.entries(normalized).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    acc[key] = value;
    return acc;
  }, {});
}

function chunkProductsForPayload(products, payloadBuilder) {
  const chunks = [];
  let currentProducts = [];
  products.forEach((product) => {
    const candidate = [...currentProducts, product];
    if (candidate.length > 1 && safeJsonSize(payloadBuilder(candidate)) > MAX_METRIKA_PAYLOAD_BYTES) {
      chunks.push(currentProducts);
      currentProducts = [product];
      return;
    }
    currentProducts = candidate;
  });
  if (currentProducts.length) {
    chunks.push(currentProducts);
  }
  return chunks;
}

function pushEcommercePayload(payload) {
  const dataLayer = ensureDataLayer();
  if (!dataLayer || !payload) return;
  dataLayer.push(payload);
  debugLog('dataLayer.push', payload);
}

function pushProductsPayload(products, payloadBuilder) {
  const safeProducts = products.filter((product) => product?.id || product?.name);
  if (!safeProducts.length) return;

  chunkProductsForPayload(safeProducts, payloadBuilder).forEach((chunk) => {
    pushEcommercePayload(payloadBuilder(chunk));
  });
}

export function initAnalytics() {
  ensureDataLayer();
  captureAttribution();

  if (!canUseMetrika()) {
    if (
      canUseBrowser() &&
      !isProductionEnvironment() &&
      !window.__cozyhomeMetrikaWarningShown
    ) {
      console.info('Yandex.Metrica is disabled: REACT_APP_YANDEX_METRIKA_ID is not configured.');
      window.__cozyhomeMetrikaWarningShown = true;
    }
    return;
  }
  if (window.__cozyhomeMetrikaReady) {
    requestMetrikaClientId();
    return;
  }

  if (!window.ym) {
    const ymStub = function (...args) {
      ymStub.a = ymStub.a || [];
      ymStub.a.push(args);
    };
    ymStub.l = Date.now();
    window.ym = ymStub;
  }

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = SCRIPT_SRC;
    document.head.appendChild(script);
  }

  callMetrika('init', resolveMetrikaOptions());
  requestMetrikaClientId();
  window.__cozyhomeMetrikaReady = true;
}

export function trackPageView(urlPath, title, params = {}) {
  if (!canUseBrowser() || !urlPath) return;
  const attribution = captureAttribution();
  const safeParams = sanitizeAnalyticsParams({
    ...params,
    currentPath: urlPath,
    landingPage: attribution.landingPage,
    firstVisit: attribution.firstVisit,
    deviceType: attribution.deviceType,
    browserFamily: attribution.browserFamily
  });
  callMetrika('params', safeParams);
  callMetrika('hit', urlPath, title ? { title } : undefined);
}

export function trackGoal(goal, params = {}) {
  const goalName = normalizeGoalName(goal);
  if (!goalName) return;
  const payload = sanitizeAnalyticsParams(params);
  if (Object.keys(payload).length) {
    callMetrika('reachGoal', goalName, payload);
    return;
  }
  callMetrika('reachGoal', goalName);
}

export function trackParams(params = {}) {
  const payload = sanitizeAnalyticsParams(params);
  if (!Object.keys(payload).length) return;
  callMetrika('params', payload);
}

export function trackUserParams(params = {}) {
  const payload = sanitizeAnalyticsParams(params);
  if (!Object.keys(payload).length) return;
  callMetrika('userParams', payload);
}

export function setAnalyticsUser(userId, params = {}) {
  if (!canUseBrowser()) return;
  const safeUserId = truncateString(userId, 128);
  if (!safeUserId || valueLooksLikePii(safeUserId)) return;
  callMetrika('setUserID', safeUserId);
  const attribution = captureAttribution();
  writeStorage(
    window.localStorage,
    ATTRIBUTION_STORAGE_KEY,
    JSON.stringify({ ...attribution, metrikaUserId: safeUserId })
  );
  trackUserParams({
    auth_state: 'authenticated',
    visitor_type: 'customer',
    ...params
  });
}

export function clearAnalyticsUser() {
  if (!canUseBrowser()) return;
  const attribution = captureAttribution();
  writeStorage(
    window.localStorage,
    ATTRIBUTION_STORAGE_KEY,
    JSON.stringify({ ...attribution, metrikaUserId: '' })
  );
  trackUserParams({
    auth_state: 'guest',
    visitor_type: 'guest'
  });
}

export function trackEcommerce(actionOrPayload, payload = {}) {
  if (!canUseBrowser()) return;

  if (typeof actionOrPayload === 'object' && actionOrPayload?.ecommerce) {
    pushEcommercePayload(actionOrPayload);
    return;
  }

  const action = String(actionOrPayload || '').trim();
  if (!action) return;
  const currencyCode = payload.currencyCode || payload.currency || DEFAULT_CURRENCY;
  const products = (Array.isArray(payload.products) ? payload.products : [])
    .map((product, index) =>
      buildEcommerceProduct(product, {
        listName: payload.listName,
        position: product.position ?? index + 1,
        coupon: payload.coupon,
        discount: product.discount ?? payload.discount
      })
    );

  const productPayload = (chunk) => ({ ecommerce: { currencyCode, [action]: chunk } });
  const actionWithProducts = (key, chunk, actionField = {}) => ({
    ecommerce: {
      currencyCode,
      [key]: {
        actionField: sanitizeAnalyticsParams(actionField),
        products: chunk
      }
    }
  });

  if (action === 'impressions') {
    pushProductsPayload(products, productPayload);
    return;
  }
  if (['click', 'detail', 'add', 'remove', 'checkout'].includes(action)) {
    const actionField = {
      list: payload.listName,
      step: payload.step,
      option: payload.option
    };
    pushProductsPayload(products, (chunk) => actionWithProducts(action, chunk, actionField));
    return;
  }
  if (action === 'purchase') {
    const actionField = {
      id: payload.orderId || payload.id || payload.purchaseId,
      revenue: normalizeMoney(payload.revenue ?? payload.total ?? payload.amount),
      tax: normalizeMoney(payload.tax),
      shipping: normalizeMoney(payload.shipping),
      coupon: payload.coupon || payload.promoCode,
      affiliation: payload.affiliation || 'yug-postel.ru'
    };
    pushProductsPayload(products, (chunk) => actionWithProducts('purchase', chunk, actionField));
    return;
  }
  if (action === 'promoView' || action === 'promoClick') {
    const promotions = (Array.isArray(payload.promotions) ? payload.promotions : [])
      .map((promotion, index) =>
        sanitizeAnalyticsParams({
          id: promotion.id || promotion.key || promotion.slug,
          name: promotion.name || promotion.title,
          creative: promotion.creative || promotion.image,
          position: promotion.position || index + 1
        })
      )
      .filter((promotion) => promotion.id || promotion.name);
    if (promotions.length) {
      pushEcommercePayload({
        ecommerce: {
          [action]: {
            promotions
          }
        }
      });
    }
  }
}

export function trackProductList(products = [], options = {}) {
  const normalizedProducts = (Array.isArray(products) ? products : []).map((product, index) =>
    buildEcommerceProduct(product, {
      listName: options.listName,
      position: options.startPosition ? options.startPosition + index : index + 1
    })
  );
  trackEcommerce('impressions', {
    products: normalizedProducts,
    listName: options.listName,
    currencyCode: options.currencyCode || DEFAULT_CURRENCY
  });
  trackGoal(METRIKA_GOALS.PRODUCT_LIST_VIEW, {
    list_name: options.listName,
    page_type: options.pageType,
    product_count: normalizedProducts.length
  });
}

export function trackProductClick(product, options = {}) {
  const ecommerceProduct = buildEcommerceProduct(product, options);
  trackEcommerce('click', {
    products: [ecommerceProduct],
    listName: options.listName,
    currencyCode: options.currencyCode || DEFAULT_CURRENCY
  });
  trackGoal(METRIKA_GOALS.PRODUCT_CLICK, {
    product_id: ecommerceProduct.id,
    list_name: options.listName,
    position: ecommerceProduct.position
  });
}

export function trackProductDetail(product, options = {}) {
  const ecommerceProduct = buildEcommerceProduct(product, options);
  trackEcommerce('detail', {
    products: [ecommerceProduct],
    currencyCode: options.currencyCode || DEFAULT_CURRENCY
  });
  trackGoal(METRIKA_GOALS.PRODUCT_DETAIL, {
    product_id: ecommerceProduct.id,
    category: ecommerceProduct.category
  });
}

export function trackCartChange(action, product, options = {}) {
  const ecommerceAction = action === 'remove' ? 'remove' : 'add';
  const ecommerceProduct = buildEcommerceProduct(product, options);
  trackEcommerce(ecommerceAction, {
    products: [ecommerceProduct],
    currencyCode: options.currencyCode || DEFAULT_CURRENCY,
    coupon: options.coupon
  });
  trackGoal(
    ecommerceAction === 'remove' ? METRIKA_GOALS.REMOVE_FROM_CART : METRIKA_GOALS.ADD_TO_CART,
    {
      product_id: ecommerceProduct.id,
      quantity: ecommerceProduct.quantity,
      cart_state_bucket: options.cartStateBucket
    }
  );
}

export function trackCheckoutStep(step, params = {}, products = []) {
  const safeStep = typeof step === 'number' ? step : Number(params.stepNumber || 1);
  const ecommerceProducts = (Array.isArray(products) ? products : []).map((product, index) =>
    buildEcommerceProduct(product, { position: index + 1 })
  );
  trackEcommerce('checkout', {
    step: safeStep,
    option: params.option || params.step,
    products: ecommerceProducts,
    currencyCode: params.currencyCode || DEFAULT_CURRENCY
  });
  trackGoal(METRIKA_GOALS.CHECKOUT_STEP_VIEW, {
    ...params,
    step: params.step || String(step),
    step_number: safeStep
  });
}

export function getAttributionSnapshot() {
  return captureAttribution();
}

export const initYandexMetrika = initAnalytics;
export const trackMetrikaHit = trackPageView;
export const trackMetrikaGoal = trackGoal;

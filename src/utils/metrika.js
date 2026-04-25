import {
  isProductionEnvironment,
  readBooleanEnv,
  readEnv
} from '../config/runtime';

const COUNTER_ID = Number(readEnv('REACT_APP_YANDEX_METRIKA_ID', '0') || 0);
const SCRIPT_ID = 'yandex-metrika-tag';
const SCRIPT_SRC = 'https://mc.yandex.ru/metrika/tag.js';
const DEFAULT_METRIKA_OPTIONS = {
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true
};

export const METRIKA_GOALS = {
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CATEGORY_NAV_CLICK: 'category_nav_click',
  SEARCH_SUGGESTION_CLICK: 'search_suggestion_click',
  CHECKOUT_CTA_CLICK: 'checkout_cta_click',
  BEGIN_CHECKOUT: 'begin_checkout',
  CHECKOUT_STEP_VIEW: 'checkout_step_view',
  CHECKOUT_STEP_SUBMIT: 'checkout_step_submit',
  CHECKOUT_FIELD_ERROR: 'checkout_field_error',
  CHECKOUT_SHIPPING_SELECT: 'checkout_shipping_select',
  ADD_SHIPPING_INFO: 'add_shipping_info',
  ADD_PAYMENT_INFO: 'add_payment_info',
  CHECKOUT_PAYMENT_RESULT: 'checkout_payment_result',
  PURCHASE: 'purchase'
};

function canUseMetrika() {
  return typeof window !== 'undefined' && Number.isFinite(COUNTER_ID) && COUNTER_ID > 0;
}

function resolveMetrikaOptions() {
  return {
    clickmap: readBooleanEnv('REACT_APP_YANDEX_METRIKA_CLICKMAP', DEFAULT_METRIKA_OPTIONS.clickmap),
    trackLinks: readBooleanEnv('REACT_APP_YANDEX_METRIKA_TRACK_LINKS', DEFAULT_METRIKA_OPTIONS.trackLinks),
    accurateTrackBounce: readBooleanEnv(
      'REACT_APP_YANDEX_METRIKA_ACCURATE_BOUNCE',
      DEFAULT_METRIKA_OPTIONS.accurateTrackBounce
    ),
    webvisor: readBooleanEnv('REACT_APP_YANDEX_METRIKA_WEBVISOR', DEFAULT_METRIKA_OPTIONS.webvisor)
  };
}

function sanitizeParams(params = {}) {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function initYandexMetrika() {
  if (!canUseMetrika()) {
    if (
      typeof window !== 'undefined' &&
      !isProductionEnvironment() &&
      !window.__cozyhomeMetrikaWarningShown
    ) {
      console.info('Yandex.Metrica is disabled: REACT_APP_YANDEX_METRIKA_ID is not configured.');
      window.__cozyhomeMetrikaWarningShown = true;
    }
    return;
  }
  if (window.__cozyhomeMetrikaReady) return;

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

  window.ym(COUNTER_ID, 'init', resolveMetrikaOptions());

  window.__cozyhomeMetrikaReady = true;
}

export function trackMetrikaHit(urlPath, title) {
  if (!canUseMetrika() || !window.ym || !urlPath) return;
  try {
    window.ym(COUNTER_ID, 'hit', urlPath, title ? { title } : undefined);
  } catch (err) {
    console.warn('Failed to send Metrika hit:', err);
  }
}

export function trackMetrikaGoal(goal, params = {}) {
  if (!canUseMetrika() || !window.ym || !goal) return;
  const payload = sanitizeParams(params);
  try {
    if (Object.keys(payload).length) {
      window.ym(COUNTER_ID, 'reachGoal', goal, payload);
      return;
    }
    window.ym(COUNTER_ID, 'reachGoal', goal);
  } catch (err) {
    console.warn(`Failed to send Metrika goal "${goal}":`, err);
  }
}

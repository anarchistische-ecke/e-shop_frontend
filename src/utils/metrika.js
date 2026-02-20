const COUNTER_ID = Number(process.env.REACT_APP_YANDEX_METRIKA_ID || 0);
const SCRIPT_ID = 'yandex-metrika-tag';
const SCRIPT_SRC = 'https://mc.yandex.ru/metrika/tag.js';

export const METRIKA_GOALS = {
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CHECKOUT_CTA_CLICK: 'checkout_cta_click',
  BEGIN_CHECKOUT: 'begin_checkout',
  CHECKOUT_STEP_VIEW: 'checkout_step_view',
  ADD_SHIPPING_INFO: 'add_shipping_info',
  ADD_PAYMENT_INFO: 'add_payment_info',
  PURCHASE: 'purchase'
};

function canUseMetrika() {
  return typeof window !== 'undefined' && Number.isFinite(COUNTER_ID) && COUNTER_ID > 0;
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
  if (!canUseMetrika()) return;
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

  window.ym(COUNTER_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true
  });

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

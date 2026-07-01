export const ACCOUNT_DEFAULT_SECTION = 'profile';
export const ACCOUNT_ORDERS_SECTION = 'orders';
export const POST_CHECKOUT_ACCOUNT_BOOTSTRAP_KEY = 'cozyhome:post-checkout-account:v1';
const POST_CHECKOUT_BOOTSTRAP_TTL_MS = 24 * 60 * 60 * 1000;
export const CART_SESSION_STRATEGY = Object.freeze({
  code: 'PRESERVE_DEVICE_CART',
  title: 'Корзина на этом устройстве сохранится',
  summary:
    'После входа мы не заменяем текущую корзину и не убираем товары. Аккаунт нужен, чтобы подставить ваши данные и показать историю заказов.',
  guestCheckoutMessage:
    'Можно оформить заказ без регистрации. Если войти или зарегистрироваться, мы сохраним данные для следующих покупок, а текущая корзина на этом устройстве останется без изменений.',
  loginMessage:
    'После входа или регистрации вы сможете быстрее оформлять повторные покупки, видеть историю заказов и не потеряете товары из текущей корзины.',
  loginBenefits: [
    'Сохраняйте имя, телефон и контактные данные для следующих заказов.',
    'Проверяйте статусы и детали заказов в личном кабинете.',
    'Продолжайте оформление с текущей корзиной на этом устройстве.'
  ]
});

function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeSection(section) {
  return normalizeValue(section).replace(/^#/, '');
}

function normalizeCartId(cartId) {
  return normalizeValue(cartId);
}

export function buildLoginRedirectPath(locationLike, fallbackPath = '/account') {
  const pathname = normalizeValue(locationLike?.pathname) || fallbackPath;
  const search = normalizeValue(locationLike?.search);
  const hash = normalizeValue(locationLike?.hash);
  const path = `${pathname}${search}${hash}`;
  const isBlockedAuthPath =
    pathname === '/login' ||
    pathname === '/manager/login';

  if (!path.startsWith('/') || path.startsWith('//') || isBlockedAuthPath) {
    return fallbackPath;
  }

  return path;
}

export function resolveCartSessionAfterAuthChange({ currentCartId, storedCartId } = {}) {
  const cartId = normalizeCartId(currentCartId) || normalizeCartId(storedCartId);

  return {
    strategy: CART_SESSION_STRATEGY.code,
    cartId,
    preserveExistingCart: Boolean(cartId)
  };
}

export function buildAccountSectionPath(section = ACCOUNT_DEFAULT_SECTION, { orderId } = {}) {
  const normalizedSection = normalizeSection(section) || ACCOUNT_DEFAULT_SECTION;
  const normalizedOrderId = normalizeValue(orderId);
  const params = new URLSearchParams();

  if (normalizedSection === ACCOUNT_ORDERS_SECTION && normalizedOrderId) {
    params.set('order', normalizedOrderId);
  }

  const query = params.toString();
  return `/account${query ? `?${query}` : ''}#${normalizedSection}`;
}

export function buildAccountOrderPath(order) {
  const publicToken = normalizeValue(order?.publicToken);
  if (publicToken) {
    return `/order/${publicToken}`;
  }
  return buildAccountSectionPath(ACCOUNT_ORDERS_SECTION, {
    orderId: order?.id
  });
}

export function resolveAccountLocationState({ hash = '', search = '' } = {}) {
  const params = new URLSearchParams(search);
  const orderId = normalizeValue(params.get('order'));
  const sectionFromHash = normalizeSection(hash);
  const section = sectionFromHash || (orderId ? ACCOUNT_ORDERS_SECTION : ACCOUNT_DEFAULT_SECTION);

  return {
    section,
    orderId: section === ACCOUNT_ORDERS_SECTION ? orderId : ''
  };
}

export function findAccountOrderById(orders = [], orderId) {
  const normalizedOrderId = normalizeValue(orderId);
  if (!normalizedOrderId) return null;
  return orders.find((order) => normalizeValue(order?.id) === normalizedOrderId) || null;
}

function getSessionStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage || null;
  } catch (err) {
    return null;
  }
}

function safeParseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
}

export function savePostCheckoutAccountBootstrap(payload = {}) {
  const storage = getSessionStorage();
  const orderId = normalizeValue(payload.orderId || payload.order?.id);
  const publicToken = normalizeValue(payload.publicToken || payload.order?.publicToken);
  if (!storage || !orderId || !publicToken) {
    return null;
  }

  const bootstrap = {
    orderId,
    publicToken,
    email: normalizeValue(payload.email || payload.order?.receiptEmail),
    accountStatus: normalizeValue(payload.accountStatus),
    redirectPath: normalizeValue(payload.redirectPath) || buildAccountSectionPath(ACCOUNT_ORDERS_SECTION, { orderId }),
    order: payload.order || null,
    payment: payload.payment || null,
    paymentSession: payload.paymentSession || null,
    createdAt: Date.now(),
    expiresAt: Date.now() + POST_CHECKOUT_BOOTSTRAP_TTL_MS
  };

  try {
    storage.setItem(POST_CHECKOUT_ACCOUNT_BOOTSTRAP_KEY, JSON.stringify(bootstrap));
    return bootstrap;
  } catch (err) {
    return null;
  }
}

export function loadPostCheckoutAccountBootstrap(orderId = '') {
  const storage = getSessionStorage();
  if (!storage) return null;
  const bootstrap = safeParseJson(storage.getItem(POST_CHECKOUT_ACCOUNT_BOOTSTRAP_KEY));
  if (!bootstrap || Date.now() >= Number(bootstrap.expiresAt || 0)) {
    clearPostCheckoutAccountBootstrap();
    return null;
  }
  const expectedOrderId = normalizeValue(orderId);
  const storedOrderId = normalizeValue(bootstrap.orderId || bootstrap.order?.id);
  if (expectedOrderId && storedOrderId !== expectedOrderId) {
    return null;
  }
  if (!storedOrderId || !normalizeValue(bootstrap.publicToken || bootstrap.order?.publicToken)) {
    clearPostCheckoutAccountBootstrap();
    return null;
  }
  return bootstrap;
}

export function clearPostCheckoutAccountBootstrap(orderId = '') {
  const storage = getSessionStorage();
  if (!storage) return;
  if (orderId) {
    const bootstrap = safeParseJson(storage.getItem(POST_CHECKOUT_ACCOUNT_BOOTSTRAP_KEY));
    const storedOrderId = normalizeValue(bootstrap?.orderId || bootstrap?.order?.id);
    if (storedOrderId && storedOrderId !== normalizeValue(orderId)) {
      return;
    }
  }
  try {
    storage.removeItem(POST_CHECKOUT_ACCOUNT_BOOTSTRAP_KEY);
  } catch (err) {
  }
}

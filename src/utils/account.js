export const ACCOUNT_DEFAULT_SECTION = 'profile';
export const ACCOUNT_ORDERS_SECTION = 'orders';
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
    pathname === '/admin/login' ||
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

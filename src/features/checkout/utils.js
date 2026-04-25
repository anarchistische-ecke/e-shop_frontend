const MONEY_FORMATTER = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

export function formatRub(value) {
  return `${MONEY_FORMATTER.format(Number.isFinite(value) ? value : 0)} ₽`;
}

export function isEmailValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function createIdempotencyKey(seed = '') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `checkout-${seed}-${crypto.randomUUID()}`;
  }
  return `checkout-${seed}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function mapBackendField(field = '') {
  const normalized = String(field || '').trim();
  if (!normalized) return '';
  if (normalized === 'receiptEmail' || normalized === 'email') return 'email';
  if (normalized === 'customerName' || normalized === 'contactName' || normalized === 'name') return 'customerName';
  if (normalized === 'phone' || normalized === 'contactPhone') return 'phone';
  if (normalized === 'homeAddress' || normalized === 'address') return 'homeAddress';
  return '';
}

export function inferFieldByMessage(message = '') {
  const source = String(message || '').toLowerCase();
  if (!source) return '';
  if (source.includes('email')) return 'email';
  if (source.includes('customer name') || source.includes('name') || source.includes('имя')) return 'customerName';
  if (source.includes('phone') || source.includes('телефон')) return 'phone';
  if (source.includes('home address') || source.includes('address') || source.includes('адрес')) return 'homeAddress';
  return '';
}

function normalizeValue(value) {
  return typeof value === 'string' ? value.trim() : value || '';
}

export function buildCheckoutAttemptSignature({
  cartId,
  receiptEmail,
  customerName,
  phone,
  homeAddress,
  returnUrl,
  orderPageUrl,
  confirmationMode,
  savePaymentMethod
} = {}) {
  return [
    cartId ? String(cartId) : '',
    normalizeValue(receiptEmail),
    normalizeValue(returnUrl),
    normalizeValue(orderPageUrl),
    normalizeValue(confirmationMode),
    savePaymentMethod ? '1' : '0',
    normalizeValue(customerName),
    normalizeValue(phone),
    normalizeValue(homeAddress)
  ].join('|');
}

export function resolveCheckoutAttempt({ cartId, signature, existingAttempt }) {
  const normalizedCartId = cartId ? String(cartId) : '';
  if (
    existingAttempt?.key &&
    existingAttempt.signature === signature &&
    (!existingAttempt.cartId || existingAttempt.cartId === normalizedCartId)
  ) {
    return existingAttempt;
  }

  return {
    cartId: normalizedCartId,
    key: createIdempotencyKey(cartId || 'guest'),
    signature,
    orderToken: existingAttempt?.signature === signature ? existingAttempt.orderToken || '' : ''
  };
}

export function isAbortError(error) {
  return error?.name === 'AbortError';
}

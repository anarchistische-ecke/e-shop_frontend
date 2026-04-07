const MONEY_FORMATTER = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

export function formatRub(value) {
  return `${MONEY_FORMATTER.format(Number.isFinite(value) ? value : 0)} ₽`;
}

export function pickupUiId(point, index = 0) {
  const lat = Number(point?.latitude);
  const lon = Number(point?.longitude);
  const coordToken = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat}-${lon}` : `point-${index}`;
  return point?.id || `${coordToken}-${index}`;
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

export function buildFullDeliveryAddress(deliveryAddress, deliveryAddressDetails) {
  return [String(deliveryAddress || '').trim(), String(deliveryAddressDetails || '').trim()]
    .filter(Boolean)
    .join(', ');
}

export function mapBackendField(field = '') {
  const normalized = String(field || '').trim();
  if (!normalized) return '';
  if (normalized === 'receiptEmail' || normalized === 'email' || normalized === 'delivery.email') return 'email';
  if (normalized === 'delivery.firstName' || normalized === 'firstName') return 'recipientFirstName';
  if (normalized === 'delivery.phone' || normalized === 'phone') return 'recipientPhone';
  if (normalized === 'delivery.address' || normalized === 'address') return 'deliveryAddress';
  if (normalized === 'delivery.pickupPointId' || normalized === 'pickupPointId') return 'selectedPickupPointId';
  if (normalized === 'delivery.offerId' || normalized === 'offerId') return 'selectedOfferId';
  if (normalized === 'delivery.pickupLocation' || normalized === 'pickupLocation') return 'pickupLocation';
  return '';
}

export function inferFieldByMessage(message = '') {
  const source = String(message || '').toLowerCase();
  if (!source) return '';
  if (source.includes('email')) return 'email';
  if (source.includes('first name') || source.includes('имя')) return 'recipientFirstName';
  if (source.includes('phone') || source.includes('телефон')) return 'recipientPhone';
  if (source.includes('address') || source.includes('адрес')) return 'deliveryAddress';
  if (source.includes('pickup point') || source.includes('пункт')) return 'selectedPickupPointId';
  if (source.includes('offer') || source.includes('интервал')) return 'selectedOfferId';
  return '';
}

export function extractCityFromGeocodeResponse(payload) {
  const feature = payload?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  if (!feature) return '';
  const components = feature?.metaDataProperty?.GeocoderMetaData?.Address?.Components || [];
  const city =
    components.find((item) => item.kind === 'locality')?.name ||
    components.find((item) => item.kind === 'province')?.name ||
    components.find((item) => item.kind === 'area')?.name ||
    '';
  if (city) return city;
  return feature?.metaDataProperty?.GeocoderMetaData?.Address?.formatted || '';
}

export function detectCityByTimezone() {
  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') return '';
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const token = zone.split('/').pop() || '';
  return token.replace(/_/g, ' ').trim();
}

export function normalizeViewportBounds(bounds) {
  const latitudeFrom = Number(bounds?.latitudeFrom);
  const latitudeTo = Number(bounds?.latitudeTo);
  const longitudeFrom = Number(bounds?.longitudeFrom);
  const longitudeTo = Number(bounds?.longitudeTo);
  if (![latitudeFrom, latitudeTo, longitudeFrom, longitudeTo].every((value) => Number.isFinite(value))) {
    return null;
  }
  return {
    latitudeFrom: Math.min(latitudeFrom, latitudeTo),
    latitudeTo: Math.max(latitudeFrom, latitudeTo),
    longitudeFrom: Math.min(longitudeFrom, longitudeTo),
    longitudeTo: Math.max(longitudeFrom, longitudeTo)
  };
}

export function viewportToken(bounds) {
  return [
    bounds.latitudeFrom.toFixed(4),
    bounds.latitudeTo.toFixed(4),
    bounds.longitudeFrom.toFixed(4),
    bounds.longitudeTo.toFixed(4)
  ].join('|');
}

export function uniqueCities(cities = []) {
  return Array.from(
    new Set(
      cities
        .map((city) => (city || '').trim())
        .filter(Boolean)
    )
  );
}

function normalizeValue(value) {
  return typeof value === 'string' ? value.trim() : value || '';
}

export function buildCheckoutAttemptSignature({
  cartId,
  receiptEmail,
  returnUrl,
  orderPageUrl,
  confirmationMode,
  savePaymentMethod,
  delivery
} = {}) {
  const joiner = [
    cartId ? String(cartId) : '',
    normalizeValue(receiptEmail),
    normalizeValue(returnUrl),
    normalizeValue(orderPageUrl),
    normalizeValue(confirmationMode),
    savePaymentMethod ? '1' : '0'
  ];

  if (delivery) {
    joiner.push(
      normalizeValue(delivery.deliveryType),
      normalizeValue(delivery.offerId),
      normalizeValue(delivery.address),
      normalizeValue(delivery.pickupPointId),
      normalizeValue(delivery.pickupPointName),
      normalizeValue(delivery.intervalFrom),
      normalizeValue(delivery.intervalTo),
      normalizeValue(delivery.firstName),
      normalizeValue(delivery.lastName),
      normalizeValue(delivery.phone),
      normalizeValue(delivery.email),
      normalizeValue(delivery.comment)
    );
  }

  return joiner.join('|');
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

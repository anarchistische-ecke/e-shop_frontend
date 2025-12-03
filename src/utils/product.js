// Utility helpers for dealing with product and price data returned by the backend API.

/**
 * Convert a Money object (amount in minor units) or primitive value to a float.
 * @param {object|number|string} value
 * @returns {number}
 */
export function moneyToNumber(value) {
  if (!value && value !== 0) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.amount === 'number') {
      return value.amount / 100;
    }
    if (typeof value.totalAmount === 'number') {
      return value.totalAmount / 100;
    }
  }
  return 0;
}

/**
 * Format the price (Money object or primitive) as a localized currency string.
 */
export function formatPrice(value, locale = 'ru-RU') {
  return moneyToNumber(value).toLocaleString(locale);
}

/**
 * Ensure any iterable/Set is converted into a plain array for rendering.
 */
export function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && typeof value.values === 'function') {
    return Array.from(value.values());
  }
  return Array.from(value);
}

/**
 * Return the first variant of the product (if any).
 */
export function getPrimaryVariant(product) {
  if (!product || !product.variants) return null;
  const variants = toArray(product.variants);
  return variants.length > 0 ? variants[0] : null;
}

/**
 * Get numeric price for a product by falling back to the first variant.
 */
export function getProductPrice(product) {
  if (!product) return 0;
  if (product.price !== undefined && product.price !== null) {
    return moneyToNumber(product.price);
  }
  const primary = getPrimaryVariant(product);
  if (primary && primary.price) {
    return moneyToNumber(primary.price);
  }
  return 0;
}

/**
 * Helper to safely round user-entered price values to integer minor units.
 */
export function decimalToMinorUnits(value) {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.round(parsed * 100);
}

/**
 * Get the primary image URL for a product (if provided by the backend).
 */
export function getPrimaryImageUrl(product) {
  if (!product || !product.images) return null;
  const list = Array.isArray(product.images) ? product.images : Array.from(product.images);
  if (list.length === 0) return null;
  const first = list[0];
  if (typeof first === 'string') return first;
  return first?.url || null;
}

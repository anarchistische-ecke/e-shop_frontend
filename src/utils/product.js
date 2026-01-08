// Utility helpers for dealing with product and price data returned by the backend API.
// Includes helpers for prices and media attached to products/variants.

const inferImageBase = () => {
  if (typeof window !== 'undefined' && window.__IMAGE_BASE__) {
    return window.__IMAGE_BASE__;
  }
  return (
    process.env.REACT_APP_IMAGE_BASE ||
    process.env.REACT_APP_STORAGE_BASE_URL ||
    process.env.REACT_APP_ASSET_BASE_URL ||
    ''
  );
};

const IMAGE_BASE = inferImageBase().replace(/\/$/, '');

export function resolveImageUrl(value = '') {
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }
  if (!IMAGE_BASE) return value;
  return `${IMAGE_BASE}/${String(value).replace(/^\//, '')}`;
}

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
 * Normalize various image representations (string or object) into a common shape.
 * Variant-aware media can specify variantId to scope images to a specific SKU.
 */
export function normalizeProductImages(images = []) {
  const list = Array.isArray(images) ? images : Array.from(images || []);
  return list
    .map((img, index) => {
      if (!img) return null;
      if (typeof img === 'string') {
        return {
          id: `img-${index}`,
          url: resolveImageUrl(img),
          variantId: null,
          alt: ''
        };
      }
      const url =
        img.url ||
        img.src ||
        img.imageUrl ||
        img.image ||
        img.image_url ||
        img.path ||
        img.key ||
        img.objectKey ||
        img.object_key ||
        img.storageKey ||
        img.storage_key ||
        img.fileKey ||
        img.fileName ||
        img.filename ||
        '';
      if (!url) return null;
      return {
        id: img.id || img._id || img.imageId || img.image_id || img.key || `img-${index}`,
        url: resolveImageUrl(url),
        variantId: img.variantId || img.variant_id || img.variant || null,
        alt: img.alt || img.label || ''
      };
    })
    .filter(Boolean);
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
export function getPrimaryImageUrl(product, variantId = null) {
  if (!product) return null;
  const images = normalizeProductImages(product.images);
  if (variantId) {
    const match = images.find((img) => img.variantId === variantId);
    if (match) return match.url;
  }
  if (images.length > 0) {
    const generic = images.find((img) => !img.variantId);
    return (generic || images[0]).url;
  }
  if (variantId) {
    const variants = toArray(product.variants);
    const variant = variants.find((v) => v && v.id === variantId);
    const variantImage = resolveImageUrl(
      variant?.imageUrl ||
        variant?.image ||
        variant?.image_url ||
        variant?.thumbnailUrl ||
        variant?.thumbnail ||
        ''
    );
    if (variantImage) return variantImage;
  }
  const productImage = resolveImageUrl(
    product.imageUrl ||
      product.image ||
      product.image_url ||
      product.thumbnailUrl ||
      product.thumbnail ||
      ''
  );
  return productImage || null;
}

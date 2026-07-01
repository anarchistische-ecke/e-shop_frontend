import { clearAllAuthStorage, getAccessToken } from '../auth/session.js';
import { getRuntimeConfig, readEnv } from '../config/runtime.js';

const inferBrowserApiBase = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return getRuntimeConfig().apiBase || window.location.origin;
};

const DEFAULT_API_BASE =
  inferBrowserApiBase() ||
  readEnv('SERVER_API_BASE') ||
  readEnv('REACT_APP_API_BASE') ||
  'http://localhost:8080';
const API_BASE = DEFAULT_API_BASE.replace(/\/$/, '');
const JSON_TYPE = 'application/json';

export class ApiRequestError extends Error {
  constructor(message, { status, statusText, details, url } = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.statusText = statusText;
    this.details = details;
    this.url = url;
  }
}

export function isApiRequestError(error) {
  return error instanceof ApiRequestError;
}

function broadcastLogout(reason = 'logout') {
  if (typeof window === 'undefined') return;
  clearAllAuthStorage();
}

async function request(url, options = {}) {
  const { includeResponseMetadata = false, ...fetchOptions } = options;
  let token = null;
  try {
    token = await getAccessToken();
  } catch (err) {
    console.warn('Failed to read access token', err);
  }
  const isFormData =
    typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': JSON_TYPE }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers || {})
  };
  const targetUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE}${url}`;
  const response = await fetch(targetUrl, { ...fetchOptions, headers });
  if (response.status === 401) {
    broadcastLogout('unauthorized');
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let details = null;
    let rawText = '';
    if (contentType.includes('application/json')) {
      try {
        details = await response.json();
      } catch (err) {
      }
    } else {
      try {
        rawText = await response.text();
      } catch (err) {
      }
    }

    const messageFromDetails =
      typeof details === 'string'
        ? details
        : details && typeof details === 'object' && typeof details.message === 'string'
        ? details.message
        : '';
    const message = messageFromDetails || rawText || `Request failed: ${response.status} ${response.statusText}`;
    throw new ApiRequestError(message, {
      status: response.status,
      statusText: response.statusText,
      details,
      url: targetUrl
    });
  }
  if (response.status === 204) {
    return includeResponseMetadata ? { data: null, headers: response.headers, status: response.status } : null;
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      const data = JSON.parse(text);
      return includeResponseMetadata
        ? { data, headers: response.headers, status: response.status }
        : data;
    } catch (err) {
      console.error(`Failed to parse JSON from ${targetUrl}`, err, text.slice(0, 500));
      throw new Error(`Failed to parse JSON from ${targetUrl}: ${err.message}`);
    }
  }
  return response;
}

// Catalog (products, categories, brands)
export async function getCategories() {
  return request('/categories');
}

export async function requestMagicLink({ email, redirectUri }) {
  return request('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email, redirectUri })
  });
}

export async function createCategory(category) {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify(category)
  });
}
export async function updateCategory(categoryId, updates) {
  return request(`/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}
export async function deleteCategory(categoryId) {
  return request(`/categories/${categoryId}`, { method: 'DELETE' });
}
export async function uploadCategoryImage(categoryId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return request(`/categories/${categoryId}/image`, {
    method: 'POST',
    body: formData
  });
}

export async function getBrands() {
  return request('/brands');
}
export async function createBrand(brand) {
  return request('/brands', {
    method: 'POST',
    body: JSON.stringify(brand)
  });
}
export async function updateBrand(brandId, updates) {
  return request(`/brands/${brandId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}
export async function deleteBrand(brandId) {
  return request(`/brands/${brandId}`, { method: 'DELETE' });
}

export async function getProducts(params = {}) {
  const pageSize = 96;
  const maxPages = 1000;
  const productsById = new Map();

  for (let page = 0; page < maxPages; page += 1) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.brand) query.append('brand', params.brand);
    if (params.includeInactive) query.append('includeInactive', 'true');
    query.append('page', String(page));
    query.append('size', String(pageSize));

    const response = await request(`/products?${query.toString()}`, {
      cache: 'no-store',
      includeResponseMetadata: true
    });
    const pageProducts = Array.isArray(response?.data) ? response.data : [];
    const declaredPageHeader = response?.headers?.get?.('x-page');
    const declaredTotalPagesHeader = response?.headers?.get?.('x-total-pages');
    const declaredPage = declaredPageHeader === null || declaredPageHeader === undefined || declaredPageHeader === ''
      ? Number.NaN
      : Number(declaredPageHeader);
    const declaredTotalPages =
      declaredTotalPagesHeader === null || declaredTotalPagesHeader === undefined || declaredTotalPagesHeader === ''
        ? Number.NaN
        : Number(declaredTotalPagesHeader);

    if (Number.isFinite(declaredPage) && declaredPage !== page) {
      throw new Error(`Product pagination returned page ${declaredPage} while page ${page} was requested`);
    }

    const sizeBeforePage = productsById.size;
    pageProducts.forEach((product) => {
      const key = String(product?.id || '').trim();
      if (key) {
        productsById.set(key, product);
      }
    });

    const reachedDeclaredEnd =
      Number.isFinite(declaredTotalPages) && declaredTotalPages >= 0 && page + 1 >= declaredTotalPages;
    if (reachedDeclaredEnd || pageProducts.length < pageSize) {
      return Array.from(productsById.values());
    }
    if (productsById.size === sizeBeforePage) {
      throw new Error(`Product pagination did not advance after page ${page}`);
    }
  }

  throw new Error(`Product pagination exceeded the safety limit of ${maxPages} pages`);
}
export async function getProduct(id, params = {}) {
  const qs = params.includeInactive ? '?includeInactive=true' : '';
  return request(`/products/${id}${qs}`);
}
export async function getCatalogueCards(params = {}) {
  const query = new URLSearchParams();
  const addKeys = (name, values) => {
    const normalizedValues = Array.isArray(values)
      ? values
      : String(values || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
    if (normalizedValues.length > 0) {
      query.append(name, normalizedValues.join(','));
    }
  };

  addKeys('productKeys', params.productKeys);
  addKeys('categoryKeys', params.categoryKeys);
  if (params.productLimit) query.append('productLimit', String(params.productLimit));
  if (params.categoryLimit) query.append('categoryLimit', String(params.categoryLimit));
  const qs = query.toString();
  return request(`/catalogue/cards${qs ? `?${qs}` : ''}`);
}
export async function createProduct(product) {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify(product)
  });
}
export async function addProductVariant(productId, variant) {
  return request(`/products/${productId}/variants`, {
    method: 'POST',
    body: JSON.stringify(variant)
  });
}
export async function updateProductVariant(productId, variantId, updates) {
  return request(`/products/${productId}/variants/${variantId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}
export async function adjustStock(variantId, delta, { reason = '', idempotencyKey }) {
  if (!idempotencyKey) {
    throw new Error('Idempotency key is required for stock adjustment');
  }
  return request('/inventory/adjust', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ variantId, delta, reason })
  });
}
export async function updateProduct(productId, updates) {
  return request(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}
export async function deleteProduct(productId) {
  return request(`/products/${productId}`, { method: 'DELETE' });
}

export async function uploadProductImages(productId, files = [], { variantId } = {}) {
  const formData = new FormData();
  Array.from(files || []).forEach((file) => formData.append('files', file));
  if (variantId) {
    formData.append('variantId', variantId);
  }
  return request(`/products/${productId}/images`, {
    method: 'POST',
    body: formData
  });
}

export async function deleteProductImage(productId, imageId) {
  return request(`/products/${productId}/images/${imageId}`, { method: 'DELETE' });
}

export async function updateProductImage(productId, imageId, updates) {
  return request(`/products/${productId}/images/${imageId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

// Cart and Orders
export async function createCart(customerId) {
  const body = customerId ? { customerId } : {};
  return request('/carts', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
export async function getCart(cartId) {
  return request(`/carts/${cartId}`);
}
export async function getCartTotal(cartId) {
  return request(`/carts/${cartId}/total`);
}
export async function getCartPricing(cartId) {
  return request(`/carts/${cartId}/pricing`);
}
export async function applyCartPromoCode(cartId, code) {
  return request(`/carts/${cartId}/promo-code`, {
    method: 'PUT',
    body: JSON.stringify({ code })
  });
}
export async function removeCartPromoCode(cartId) {
  return request(`/carts/${cartId}/promo-code`, {
    method: 'DELETE'
  });
}
export async function addItemToCart(cartId, variantId, quantity = 1) {
  return request(`/carts/${cartId}/items`, {
    method: 'POST',
    body: JSON.stringify({ variantId, quantity })
  });
}
export async function updateCartItem(cartId, itemId, quantity) {
  return request(`/carts/${cartId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity })
  });
}
export async function removeCartItem(cartId, itemId) {
  return request(`/carts/${cartId}/items/${itemId}`, {
    method: 'DELETE'
  });
}
export async function createOrder(cartId) {
  return request(`/orders?cartId=${encodeURIComponent(cartId)}`, {
    method: 'POST'
  });
}
export async function checkoutCart({
  cartId,
  receiptEmail,
  customerName,
  phone,
  homeAddress,
  returnUrl,
  orderPageUrl,
  confirmationMode,
  savePaymentMethod,
  analyticsAttribution,
  accountRedirectUrl,
  addressParts,
  idempotencyKey,
  signal
} = {}) {
  if (!idempotencyKey) {
    throw new Error('Idempotency key is required for checkout');
  }
  return request('/orders/checkout', {
    method: 'POST',
    signal,
    body: JSON.stringify({
      cartId,
      receiptEmail,
      customerName,
      phone,
      homeAddress,
      returnUrl,
      orderPageUrl,
      confirmationMode,
      savePaymentMethod,
      analyticsAttribution,
      accountRedirectUrl,
      addressParts,
      idempotencyKey
    })
  });
}
export async function createManagerOrderLink({ cartId, receiptEmail, customerName, phone, homeAddress, orderPageUrl, sendEmail, idempotencyKey } = {}) {
  return request('/orders/manager-link', {
    method: 'POST',
    body: JSON.stringify({ cartId, receiptEmail, customerName, phone, homeAddress, orderPageUrl, sendEmail, idempotencyKey })
  });
}
export async function getOrders() {
  return request('/orders');
}
export async function getOrder(id) {
  return request(`/orders/${id}`);
}
export async function getPublicOrder(token) {
  return request(`/orders/public/${token}`);
}
export async function payPublicOrder({ token, receiptEmail, returnUrl, confirmationMode, analyticsAttribution } = {}) {
  return request(`/orders/public/${token}/pay`, {
    method: 'POST',
    body: JSON.stringify({ receiptEmail, returnUrl, confirmationMode, analyticsAttribution })
  });
}
export async function refreshPublicOrderPayment(token) {
  return request(`/orders/public/${token}/refresh-payment`, {
    method: 'POST'
  });
}
export async function getPublicPaymentConfig() {
  return request('/payments/public-config');
}
export async function getActivePromotions() {
  return request('/promotions/active');
}
export async function updateOrderStatus(id, status) {
  return request(
    `/orders/${id}/status?status=${encodeURIComponent(status)}`,
    {
      method: 'PUT'
    }
  );
}

// Customers and Authentication
export async function getCustomers() {
  return request('/customers');
}
export async function createCustomer(customer) {
  return request('/customers', {
    method: 'POST',
    body: JSON.stringify(customer)
  });
}
export async function getCustomerProfile() {
  return request('/customers/me');
}
export async function updateCustomerProfile(updates) {
  return request('/customers/me', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}
export async function updateCustomerSubscription(marketingOptIn) {
  return request('/customers/me/subscription', {
    method: 'PUT',
    body: JSON.stringify({ marketingOptIn })
  });
}
export async function getCustomerOrders() {
  return request('/orders/me');
}
export async function getCustomerRmaRequests(orderId) {
  return request(`/orders/me/${encodeURIComponent(orderId)}/rma-requests`);
}
export async function createCustomerRmaRequest(orderId, payload) {
  return request(`/orders/me/${encodeURIComponent(orderId)}/rma-requests`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
export async function getManagerProfile() {
  return request('/managers/me');
}
export async function getManagerDashboard({ limit = 8 } = {}) {
  const safeLimit = Number.isFinite(limit) ? limit : 8;
  return request(`/managers/me/dashboard?limit=${encodeURIComponent(safeLimit)}`);
}

// CMS content façade
export async function getCmsSiteSettings({ preview = false, signal } = {}) {
  const path = preview ? '/content/preview/site-settings' : '/content/site-settings';
  return request(path, { signal, cache: 'no-store' });
}

export async function getCmsNavigation({ placement, preview = false, signal } = {}) {
  const path = preview ? '/content/preview/navigation' : '/content/navigation';
  const query = new URLSearchParams();
  if (placement) {
    query.append('placement', placement);
  }
  const qs = query.toString();
  return request(`${path}${qs ? `?${qs}` : ''}`, { signal, cache: 'no-store' });
}

export async function getCmsPage(slug, { preview = false, signal } = {}) {
  if (!slug) {
    throw new Error('CMS page slug is required');
  }
  const path = preview ? '/content/preview/pages' : '/content/pages';
  return request(`${path}/${encodeURIComponent(slug)}`, { signal, cache: 'no-store' });
}

export async function getCmsCollection(key, { preview = false, signal } = {}) {
  if (!key) {
    throw new Error('CMS collection key is required');
  }
  const path = preview ? '/content/preview/collections' : '/content/collections';
  return request(`${path}/${encodeURIComponent(key)}`, { signal, cache: 'no-store' });
}

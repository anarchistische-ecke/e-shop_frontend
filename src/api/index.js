import { clearSession, getAccessToken } from '../auth/session';

const inferBrowserApiBase = () =>
  (typeof window !== 'undefined' ? window.__API_BASE__ || window.location.origin : null);
const DEFAULT_API_BASE = inferBrowserApiBase() || 'http://localhost:8080';
const API_BASE = (process.env.REACT_APP_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
const JSON_TYPE = 'application/json';
const rawActivityPath = process.env.REACT_APP_ACTIVITY_LOGS_PATH || '/admin/activity';
const ACTIVITY_LOGS_PATH = (rawActivityPath.startsWith('/') ? rawActivityPath : `/${rawActivityPath}`).replace(/\/$/, '');

function broadcastLogout(reason = 'logout') {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminToken');
  localStorage.removeItem('userToken');
  clearSession();
}

async function request(url, options = {}) {
  let token = null;
  try {
    token = await getAccessToken();
  } catch (err) {
    console.warn('Failed to read access token', err);
  }
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': JSON_TYPE }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const targetUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE}${url}`;
  const response = await fetch(targetUrl, { ...options, headers });
  if (response.status === 401) {
    broadcastLogout('unauthorized');
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} ${text}`
    );
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
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
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.brand) query.append('brand', params.brand);
  if (params.includeInactive) query.append('includeInactive', 'true');
  const qs = query.toString();
  return request(`/products${qs ? `?${qs}` : ''}`);
}
export async function getProduct(id, params = {}) {
  const qs = params.includeInactive ? '?includeInactive=true' : '';
  return request(`/products/${id}${qs}`);
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
export async function checkoutCart({ cartId, receiptEmail, returnUrl, orderPageUrl, savePaymentMethod } = {}) {
  return request('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify({ cartId, receiptEmail, returnUrl, orderPageUrl, savePaymentMethod })
  });
}
export async function createAdminOrderLink({ cartId, receiptEmail, orderPageUrl } = {}) {
  return request('/orders/admin-link', {
    method: 'POST',
    body: JSON.stringify({ cartId, receiptEmail, orderPageUrl })
  });
}
export async function createManagerOrderLink({ cartId, receiptEmail, orderPageUrl, sendEmail } = {}) {
  return request('/orders/manager-link', {
    method: 'POST',
    body: JSON.stringify({ cartId, receiptEmail, orderPageUrl, sendEmail })
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
export async function payPublicOrder({ token, receiptEmail, returnUrl } = {}) {
  return request(`/orders/public/${token}/pay`, {
    method: 'POST',
    body: JSON.stringify({ receiptEmail, returnUrl })
  });
}
export async function refreshPublicOrderPayment(token) {
  return request(`/orders/public/${token}/refresh-payment`, {
    method: 'POST'
  });
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
export async function loginAdmin(username, password) {
  return request('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}
export async function loginCustomer(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}
export async function registerCustomer(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
export async function requestEmailVerification(email) {
  return request('/customers/verify/request', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}
export async function confirmEmailVerification(email, code, password) {
  return request('/customers/verify/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code, password })
  });
}
export async function getManagerProfile() {
  return request('/managers/me');
}
export async function getManagerDashboard({ limit = 8 } = {}) {
  const safeLimit = Number.isFinite(limit) ? limit : 8;
  return request(`/managers/me/dashboard?limit=${encodeURIComponent(safeLimit)}`);
}
export async function loginWithYandex({
  accessToken = '',
  yandexId = '',
  email = '',
  firstName = '',
  lastName = ''
} = {}) {
  return request('/auth/login/yandex', {
    method: 'POST',
    body: JSON.stringify({ accessToken, yandexId, email, firstName, lastName })
  });
}
export async function loginWithVk({
  accessToken = '',
  vkUserId = '',
  email = '',
  firstName = '',
  lastName = ''
} = {}) {
  return request('/auth/login/vk', {
    method: 'POST',
    body: JSON.stringify({ accessToken, vkUserId, email, firstName, lastName })
  });
}

export async function getAdminActivityLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.append('page', params.page);
  if (params.size !== undefined) query.append('size', params.size);
  const qs = query.toString();
  return request(`${ACTIVITY_LOGS_PATH}${qs ? `?${qs}` : ''}`);
}

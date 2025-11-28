import { notifyAuthChange } from '../utils/auth';

const DEFAULT_API_BASE = 'http://localhost:8080';
const API_BASE = (process.env.REACT_APP_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
const JSON_TYPE = 'application/json';

function broadcastLogout(reason = 'logout') {
  if (typeof window === 'undefined') return;
  const hadAnyToken =
    localStorage.getItem('adminToken') || localStorage.getItem('userToken');
  if (hadAnyToken) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userToken');
    notifyAuthChange({ reason });
  }
}

async function request(url, options = {}) {
  const token =
    typeof window !== 'undefined' &&
    (localStorage.getItem('adminToken') || localStorage.getItem('userToken'));
  const headers = {
    'Content-Type': JSON_TYPE,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const targetUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE}${url}`;
  const response = await fetch(targetUrl, { headers, ...options });
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
  const qs = query.toString();
  return request(`/products${qs ? `?${qs}` : ''}`);
}
export async function getProduct(id) {
  return request(`/products/${id}`);
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
export async function updateProduct(productId, updates) {
  return request(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}
export async function deleteProduct(productId) {
  return request(`/products/${productId}`, { method: 'DELETE' });
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
export async function getOrders() {
  return request('/orders');
}
export async function getOrder(id) {
  return request(`/orders/${id}`);
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

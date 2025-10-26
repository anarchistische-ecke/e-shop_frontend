// src/api/index.js
//
// This module centralizes all HTTP requests to the backend API.  Each
// function wraps the native fetch API and handles JSON serialization,
// response checking and error reporting.  The backend is assumed to
// run locally on port 8080.  Adjust `API_BASE` as needed to point
// towards your deployment environment.

const API_BASE = 'http://localhost:8080';

/**
 * Helper to perform an HTTP request against the API.  Accepts a URL
 * relative to the API base and an options object.  Throws an error
 * when the response status indicates failure.  Attempts to parse
 * JSON bodies automatically.
 *
 * @param {string} url Path relative to API_BASE
 * @param {RequestInit} [options] Additional fetch options
 */
async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    // Merge any provided options (method, body, etc.)
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText} ${text}`);
  }
  // No content
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response;
}

// Catalog endpoints

/** Fetch all categories. */
export async function getCategories() {
  return request('/categories');
}

/**
 * Fetch products with optional filters.  Supported filters:
 *   - category: slug of the category
 *   - brand: slug or ID of the brand
 *
 * @param {Object} params
 */
export async function getProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.brand) query.append('brand', params.brand);
  const qs = query.toString();
  return request(`/products${qs ? `?${qs}` : ''}`);
}

/** Fetch a single product by its identifier. */
export async function getProduct(id) {
  return request(`/products/${id}`);
}

// Cart endpoints

/**
 * Create a new cart.  Optionally associate it with a customer by
 * passing a customerId query parameter.  The backend responds with
 * the newly created cart including its unique identifier.
 */
export async function createCart(customerId) {
  const url = customerId ? `/carts?customerId=${customerId}` : '/carts';
  return request(url, { method: 'POST' });
}

/** Retrieve a cart by its ID. */
export async function getCart(cartId) {
  return request(`/carts/${cartId}`);
}

/** Retrieve the total amount of a cart in smallest currency units. */
export async function getCartTotal(cartId) {
  return request(`/carts/${cartId}/total`);
}

/**
 * Add an item to a cart.  The backend expects a JSON body with
 * `variantId` and `quantity`.  For the purposes of this front‑end
 * integration we treat the product ID as the variant ID.
 */
export async function addItemToCart(cartId, variantId, quantity = 1) {
  return request(`/carts/${cartId}/items`, {
    method: 'POST',
    body: JSON.stringify({ variantId, quantity }),
  });
}

/** Update the quantity of an existing cart item. */
export async function updateCartItem(cartId, itemId, quantity) {
  return request(`/carts/${cartId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

/** Remove an item from the cart. */
export async function removeCartItem(cartId, itemId) {
  return request(`/carts/${cartId}/items/${itemId}`, { method: 'DELETE' });
}

// Order endpoints

/** Create a new order from a cart. */
export async function createOrder(cartId) {
  return request(`/orders?cartId=${cartId}`, { method: 'POST' });
}

/** Retrieve all orders. */
export async function getOrders() {
  return request('/orders');
}

/** Retrieve a specific order by its ID. */
export async function getOrder(id) {
  return request(`/orders/${id}`);
}

/** Update the status of an existing order. */
export async function updateOrderStatus(id, status) {
  const encoded = encodeURIComponent(status);
  return request(`/orders/${id}/status?status=${encoded}`, { method: 'PUT' });
}

// Customer endpoints

/** Register a new customer.  Expects an object with firstName, lastName,
 * email and address fields.  The address should include street,
 * city, state, postalCode and country.  Returns the created
 * customer entity.
 */
export async function createCustomer(customer) {
  return request('/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
}

/** Fetch all customers. */
export async function getCustomers() {
  return request('/customers');
}

/** Fetch a single customer by ID. */
export async function getCustomer(id) {
  return request(`/customers/${id}`);
}
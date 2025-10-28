// src/api/index.js
//
// This module centralizes HTTP requests to the back‑end API.  Each
// function wraps the native fetch API and handles JSON
// serialization, error handling and response parsing.  The backend
// runs locally on port 8080 by default – adjust `API_BASE` to point
// to your deployed environment.

const API_BASE = 'http://localhost:8080';

/**
 * Generic helper used by all API calls.  It prefixes the given
 * relative URL with the API base, attaches default JSON headers and
 * merges any additional options.  If the response indicates an
 * error (non‑2xx status), the promise rejects with a descriptive
 * message.  When the response contains JSON it will be parsed
 * automatically.
 *
 * @param {string} url Path relative to API_BASE
 * @param {RequestInit} [options] Additional fetch options such as
 *        method or body
 */
async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText} ${text}`);
  }
  if (response.status === 204) {
    // No content
    return null;
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response;
}

// -----------------------------------------------------------------------------
// Catalog endpoints
//
// Fetch lists of categories and products or individual entities.  Optional
// filters (category or brand) can be passed to getProducts.

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

/** Fetch a single product by its identifier (UUID). */
export async function getProduct(id) {
  return request(`/products/${id}`);
}

/**
 * Create a new product.  The back‑end expects a JSON body with
 * `name`, `description` and `slug`.  The slug should be unique and
 * URL‑friendly.  Returns the newly created product.
 *
 * @param {{name: string, description?: string, slug: string}} product
 */
export async function createProduct(product) {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

/**
 * Add a variant to an existing product.  A variant represents a
 * purchasable SKU with its own price and stock.  The API expects
 * `sku`, `name`, `amount` (as an integer representing the smallest
 * currency unit), `currency` (e.g. "RUB") and `stock`.  Returns the
 * created variant.
 *
 * @param {string} productId UUID of the parent product
 * @param {{sku: string, name: string, amount: number, currency: string, stock: number}} variant
 */
export async function addProductVariant(productId, variant) {
  return request(`/products/${productId}/variants`, {
    method: 'POST',
    body: JSON.stringify(variant),
  });
}

// -----------------------------------------------------------------------------
// Cart endpoints
//
// Create a cart, add items, update quantity and remove items.  When
// interacting with the cart the client should persist the cart ID
// locally (e.g. in localStorage) so that subsequent page loads can
// retrieve the same cart.  Note that the backend expects JSON bodies
// for the createCart and item mutation endpoints.

/**
 * Create a new cart.  Optionally associate it with a customer by
 * passing a customerId property.  The backend responds with the
 * newly created cart including its unique identifier.  The
 * customerId should be a UUID string when provided.
 *
 * @param {string} [customerId] Optional customer ID to link the cart
 */
export async function createCart(customerId) {
  const body = customerId ? { customerId } : {};
  return request('/carts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
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
 * `variantId` and `quantity`.  Note that the front‑end treats the
 * product ID as the variant ID because there is only a single
 * variant per product in this demo.  Adjust this mapping if you
 * expose multiple variants per product.
 *
 * @param {string} cartId UUID of the cart
 * @param {string} variantId UUID of the variant (or product ID)
 * @param {number} quantity Quantity to add
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

// -----------------------------------------------------------------------------
// Order endpoints

/** Create a new order from a cart. */
export async function createOrder(cartId) {
  return request(`/orders?cartId=${encodeURIComponent(cartId)}`, { method: 'POST' });
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
  return request(`/orders/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PUT' });
}

// -----------------------------------------------------------------------------
// Customer endpoints

/**
 * Register a new customer.  Expects an object with firstName,
 * lastName, email and address fields.  The address should include
 * street, city, state, postalCode and country.  Returns the created
 * customer entity.
 *
 * @param {{firstName: string, lastName: string, email: string, street: string,
 *         city: string, state?: string, postalCode: string, country: string}} customer
 */
export async function createCustomer(customer) {
  return request('/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
}

/** Fetch all customers.  The backend may not expose a list endpoint. */
export async function getCustomers() {
  return request('/customers');
}

/** Fetch a single customer by ID. */
export async function getCustomer(id) {
  return request(`/customers/${id}`);
}

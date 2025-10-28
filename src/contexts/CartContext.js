import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  createCart,
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
} from '../api';

/**
 * CartContext provides a shared cart state across the application.  It
 * persists a cart ID in localStorage so users retain their cart
 * between sessions and synchronizes all cart operations with the
 * Spring Boot backend.  On initial mount it will either reuse an
 * existing cart ID or create a new cart via the API.  Mutations
 * propagate to the backend and then refresh local state to ensure
 * consistency.
 */
export const CartContext = createContext();

export function CartProvider({ children }) {
  // Retrieve a previously stored cart ID if it exists.  localStorage
  // access is guarded to avoid errors during server‑side rendering.
  const [cartId, setCartId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cartId') || null;
    }
    return null;
  });
  const [items, setItems] = useState([]);

  // Initialise the cart when the provider mounts or when the cartId
  // changes (e.g. after creating a new cart).  This effect will
  // create a cart on the backend if none exists and then load
  // current items.  Errors are logged to the console.
  useEffect(() => {
    async function init() {
      try {
        let id = cartId;
        if (!id) {
          // Create a fresh cart.  The backend accepts an empty body
          // when no customer association is needed.
          const cart = await createCart();
          id = cart.id;
          localStorage.setItem('cartId', id);
          setCartId(id);
        }
        const cart = await getCart(id);
        setItems(cart.items || []);
      } catch (err) {
        console.error('Failed to initialise cart:', err);
      }
    }
    init();
  }, [cartId]);

  // Add a product to the cart.  The variantId is derived from the
  // product ID because this demo assumes a single variant per product.
  const addItem = useCallback(
    async (product, quantity = 1) => {
      if (!cartId) return;
      try {
        await addItemToCart(cartId, product.id, quantity);
        const cart = await getCart(cartId);
        setItems(cart.items || []);
      } catch (err) {
        console.error('Failed to add item to cart:', err);
      }
    },
    [cartId]
  );

  // Remove an item from the cart by its cart item ID
  const removeItem = useCallback(
    async (cartItemId) => {
      if (!cartId) return;
      try {
        await removeCartItem(cartId, cartItemId);
        const cart = await getCart(cartId);
        setItems(cart.items || []);
      } catch (err) {
        console.error('Failed to remove item from cart:', err);
      }
    },
    [cartId]
  );

  // Update the quantity of an existing cart item
  const updateQuantity = useCallback(
    async (cartItemId, quantity) => {
      if (!cartId || quantity < 1) return;
      try {
        await updateCartItem(cartId, cartItemId, quantity);
        const cart = await getCart(cartId);
        setItems(cart.items || []);
      } catch (err) {
        console.error('Failed to update item quantity:', err);
      }
    },
    [cartId]
  );

  // Clear the cart by removing all items.  This iterates through the
  // current items and removes them one by one since the backend has
  // no bulk clear endpoint.
  const clearCart = useCallback(
    async () => {
      if (!cartId) return;
      try {
        const current = [...items];
        for (const item of current) {
          await removeCartItem(cartId, item.id);
        }
        setItems([]);
      } catch (err) {
        console.error('Failed to clear cart:', err);
      }
    },
    [cartId, items]
  );

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
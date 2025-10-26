import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  createCart,
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
} from '../api';

/**
 * CartContext synchronizes cart state between the front‑end and the
 * Spring Boot backend.  When the provider mounts it attempts to
 * locate an existing cart ID in localStorage.  If none is found it
 * creates a new cart via the API and persists the identifier for
 * subsequent page loads.  All cart operations (add, remove, update)
 * propagate changes to the backend and then refresh the local
 * state to ensure consistency.
 */
export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartId, setCartId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cartId') || null;
    }
    return null;
  });
  const [items, setItems] = useState([]);

  // Initialize the cart on first mount or when cartId changes
  useEffect(() => {
    async function initCart() {
      try {
        let id = cartId;
        if (!id) {
          // Create a fresh cart on the backend
          const cart = await createCart();
          id = cart.id;
          localStorage.setItem('cartId', id);
          setCartId(id);
        }
        // Fetch current cart contents
        const cart = await getCart(id);
        // The backend returns an array of cart items.  Each item is
        // expected to include its own ID, the product/variant and
        // quantity.  Save this into state.
        setItems(cart.items || []);
      } catch (err) {
        console.error('Failed to initialize cart:', err);
      }
    }
    initCart();
  }, [cartId]);

  // Add a product to the cart.  Accepts a product object from the
  // front‑end; we treat product.id as the variant ID for the API call.
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

  // Clear the cart by removing each item.  This implementation
  // iterates through current items and removes them one by one.
  const clearCart = useCallback(
    async () => {
      if (!cartId) return;
      try {
        // Make a copy because removeItem updates state
        const currentItems = [...items];
        for (const item of currentItems) {
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
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}
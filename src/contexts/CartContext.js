import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  createCart,
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem
} from '../api';

export const CartContext = createContext();

export function CartProvider({ children }) {
  // Persist cart ID in localStorage
  const [cartId, setCartId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cartId') || null;
    }
    return null;
  });
  const [items, setItems] = useState([]);

  // Initialize or fetch the cart on mount
  useEffect(() => {
    async function init() {
      try {
        let id = cartId;
        if (!id) {
          // Create a new cart (associate with customer if needed)
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

  // Add item to cart (handles single or multiple variants per product)
  const addItem = useCallback(
    async (product, variantId = null, quantity = 1) => {
      if (!cartId) return;
      try {
        const vid = variantId || product.id;
        await addItemToCart(cartId, vid, quantity);
        const cart = await getCart(cartId);
        setItems(cart.items || []);
      } catch (err) {
        console.error('Failed to add item to cart:', err);
      }
    },
    [cartId]
  );

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

  const clearCart = useCallback(
    async () => {
      if (!cartId) return;
      try {
        // Remove all items one by one (no bulk delete endpoint)
        for (const item of items) {
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

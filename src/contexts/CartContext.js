import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  createCart,
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  getProducts
} from '../api';
import { moneyToNumber, getPrimaryImageUrl, getPrimaryVariant } from '../utils/product';

export const CartContext = createContext();

function normalizeVariantsMap(products = []) {
  const map = {};
  products.forEach((product) => {
    const variants = Array.isArray(product.variants)
      ? product.variants
      : product.variants
      ? Array.from(product.variants)
      : [];
    variants.forEach((variant) => {
      if (variant?.id) {
        map[variant.id] = {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          variantName: variant.name,
          variantPrice: variant.price,
          imageUrl: getPrimaryImageUrl(product, variant.id)
        };
      }
    });
  });
  return map;
}

function enrichCartItems(items = [], variantMap = {}) {
  return items.map((item) => {
    const variantMeta = variantMap[item.variantId];
    return {
      ...item,
      productInfo: variantMeta
        ? {
            id: variantMeta.productId,
            name: variantMeta.productName,
            slug: variantMeta.productSlug,
            variantName: variantMeta.variantName,
            imageUrl: variantMeta.imageUrl
          }
        : null,
      unitPriceValue: moneyToNumber(item.unitPrice || variantMeta?.variantPrice)
    };
  });
}

export function CartProvider({ children }) {
  // Persist cart ID in localStorage
  const [cartId, setCartId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cartId') || null;
    }
    return null;
  });
  const [items, setItems] = useState([]);
  const [variantMap, setVariantMap] = useState({});

  const refreshVariantMap = useCallback(async () => {
    try {
      const products = await getProducts();
      const map = normalizeVariantsMap(Array.isArray(products) ? products : []);
      setVariantMap(map);
      return map;
    } catch (err) {
      console.error('Failed to fetch products for cart context:', err);
      return variantMap;
    }
  }, [variantMap]);

  const syncCart = useCallback(
    async (id) => {
      try {
        const cart = await getCart(id);
        const map =
          Object.keys(variantMap).length > 0
            ? variantMap
            : await refreshVariantMap();
        setItems(enrichCartItems(cart.items || [], map));
      } catch (err) {
        console.error('Failed to load cart:', err);
      }
    },
    [variantMap, refreshVariantMap]
  );

  // Initialize or fetch the cart on mount
  useEffect(() => {
    async function init() {
      try {
        let id = cartId;
        if (!id) {
          // Create a new cart bound to a guest/customer ID
          const cart = await createCart();
          id = cart.id;
          localStorage.setItem('cartId', id);
          setCartId(id);
        }
        await syncCart(id);
      } catch (err) {
        console.error('Failed to initialise cart:', err);
      }
    }
    init();
  }, [cartId, syncCart]);

  useEffect(() => {
    if (!cartId) return;
    syncCart(cartId);
  }, [cartId, syncCart]);

  // Add item to cart (handles single or multiple variants per product)
  const addItem = useCallback(
    async (product, variantId = null, quantity = 1) => {
      let id = cartId;
      try {
        if (!id) {
          const cart = await createCart();
          id = cart.id;
          localStorage.setItem('cartId', id);
          setCartId(id);
        }
        const targetVariant = variantId || getPrimaryVariant(product)?.id;
        if (!targetVariant) {
          console.error('Product has no variants to add to cart');
          return;
        }
        await addItemToCart(id, targetVariant, quantity);
        await syncCart(id);
      } catch (err) {
        console.error('Failed to add item to cart:', err);
        alert('Не удалось добавить товар в корзину. Возможно, товар закончился или недоступен.');
      }
    },
    [cartId, syncCart]
  );

  const removeItem = useCallback(
    async (cartItemId) => {
      if (!cartId) return;
      try {
        await removeCartItem(cartId, cartItemId);
        await syncCart(cartId);
      } catch (err) {
        console.error('Failed to remove item from cart:', err);
      }
    },
    [cartId, syncCart]
  );

  const updateQuantity = useCallback(
    async (cartItemId, quantity) => {
      if (!cartId || quantity < 1) return;
      try {
        await updateCartItem(cartId, cartItemId, quantity);
        await syncCart(cartId);
      } catch (err) {
        console.error('Failed to update item quantity:', err);
      }
    },
    [cartId, syncCart]
  );

  const clearCart = useCallback(async () => {
    if (!cartId) return;
    try {
      // Remove all items one by one (no bulk delete endpoint)
      for (const item of items) {
        await removeCartItem(cartId, item.id);
      }
      await syncCart(cartId);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  }, [cartId, items, syncCart]);

  const contextValue = {
    items,
    cartId,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

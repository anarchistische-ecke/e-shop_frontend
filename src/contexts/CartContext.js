import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  createCart,
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem
} from '../api';
import { useNotifications } from './NotificationContext';
import { normalizeCartQuantity } from '../utils/cart';
import { subscribeToAuthChanges } from '../utils/auth';
import { resolveCartSessionAfterAuthChange } from '../utils/account';
import { createNotification } from '../utils/notifications';
import { moneyToNumber, getPrimaryImageUrl, getPrimaryVariant } from '../utils/product';
import { METRIKA_GOALS, trackMetrikaGoal } from '../utils/metrika';
import { useProductDirectoryData } from '../features/product-list/data';

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

function buildAddToCartErrorNotification(err, { reason = 'request_failed' } = {}) {
  if (reason === 'missing_variant') {
    return createNotification({
      type: 'error',
      title: 'Не удалось добавить в корзину',
      message: 'У этого товара сейчас нет доступного варианта для покупки.'
    });
  }

  const fallbackMessage = 'Возможно, товар закончился или недоступен.';
  const message =
    typeof err?.message === 'string' && err.message.trim()
      ? err.message.trim()
      : fallbackMessage;

  return createNotification({
    type: 'error',
    title: 'Не удалось добавить в корзину',
    message
  });
}

export function CartProvider({ children }) {
  const { notify } = useNotifications();
  const { products } = useProductDirectoryData();
  // Persist cart ID in localStorage
  const [cartId, setCartId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cartId') || null;
    }
    return null;
  });
  const [rawItems, setRawItems] = useState([]);
  const [lastAddedItem, setLastAddedItem] = useState(null);

  const variantMap = useMemo(
    () => normalizeVariantsMap(products),
    [products]
  );

  const items = useMemo(
    () => enrichCartItems(rawItems, variantMap),
    [rawItems, variantMap]
  );

  const syncCart = useCallback(
    async (id) => {
      try {
        const cart = await getCart(id);
        setRawItems(Array.isArray(cart?.items) ? cart.items : []);
      } catch (err) {
        console.error('Failed to load cart:', err);
      }
    },
    []
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

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(() => {
      const nextSession = resolveCartSessionAfterAuthChange({
        currentCartId: cartId,
        storedCartId: typeof window !== 'undefined' ? localStorage.getItem('cartId') : null
      });

      if (!nextSession.cartId) {
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('cartId', nextSession.cartId);
      }

      if (nextSession.cartId !== cartId) {
        setCartId(nextSession.cartId);
        return;
      }

      syncCart(nextSession.cartId);
    });

    return unsubscribe;
  }, [cartId, syncCart]);

  // Add item to cart (handles single or multiple variants per product)
  const addItem = useCallback(
    async (product, variantId = null, quantity = 1, { notifyOnError = true } = {}) => {
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
          const notification = buildAddToCartErrorNotification(null, { reason: 'missing_variant' });
          if (notifyOnError) {
            notify(notification);
          }
          return { ok: false, notification };
        }
        const variants = Array.isArray(product?.variants)
          ? product.variants
          : product?.variants
          ? Array.from(product.variants)
          : [];
        const selectedVariant = variants.find((variant) => variant?.id === targetVariant) || getPrimaryVariant(product);
        const quantityValue = normalizeCartQuantity(quantity);
        await addItemToCart(id, targetVariant, quantityValue);
        await syncCart(id);
        setLastAddedItem({
          id: `${targetVariant}-${Date.now()}`,
          productId: product?.id || targetVariant,
          name: product?.name || 'Товар',
          variantName: selectedVariant?.name || selectedVariant?.sku || targetVariant,
          quantity: quantityValue,
          unitPriceValue: moneyToNumber(selectedVariant?.price || product?.price),
          imageUrl: getPrimaryImageUrl(product, targetVariant) || getPrimaryImageUrl(product),
        });
        trackMetrikaGoal(METRIKA_GOALS.ADD_TO_CART, {
          product_id: product?.id,
          variant_id: targetVariant,
          quantity: quantityValue
        });
        return { ok: true };
      } catch (err) {
        console.error('Failed to add item to cart:', err);
        const notification = buildAddToCartErrorNotification(err);
        if (notifyOnError) {
          notify(notification);
        }
        return { ok: false, notification };
      }
    },
    [cartId, notify, syncCart]
  );

  const removeItem = useCallback(
    async (cartItemId) => {
      if (!cartId) return;
      try {
        await removeCartItem(cartId, cartItemId);
        await syncCart(cartId);
        trackMetrikaGoal(METRIKA_GOALS.REMOVE_FROM_CART, {
          cart_item_id: cartItemId
        });
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

  const dismissLastAddedItem = useCallback(() => {
    setLastAddedItem(null);
  }, []);

  const contextValue = {
    items,
    cartId,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    lastAddedItem,
    dismissLastAddedItem
  };

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

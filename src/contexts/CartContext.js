import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  createCart,
  getCart,
  getCartPricing,
  applyCartPromoCode,
  removeCartPromoCode,
  addItemToCart,
  updateCartItem,
  removeCartItem
} from '../api';
import { useNotifications } from './NotificationContext';
import { normalizeCartQuantity } from '../utils/cart';
import { subscribeToAuthChanges } from '../utils/auth';
import { resolveCartSessionAfterAuthChange } from '../utils/account';
import { createNotification } from '../utils/notifications';
import { getCustomerSafeErrorMessage } from '../utils/customerErrors';
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
          variantOldPrice: variant.oldPrice,
          discountPercent: variant.discountPercent,
          imageUrl: getPrimaryImageUrl(product, variant.id)
        };
      }
    });
  });
  return map;
}

function enrichCartItems(items = [], variantMap = {}, pricing = null) {
  const pricingLinesByVariantId = new Map(
    Array.isArray(pricing?.items)
      ? pricing.items.map((line) => [line.variantId, line])
      : []
  );
  return items.map((item) => {
    const variantMeta = variantMap[item.variantId];
    const pricingLine = pricingLinesByVariantId.get(item.variantId) || null;
    return {
      ...item,
      pricingLine,
      productInfo: variantMeta
        ? {
            id: variantMeta.productId,
            name: variantMeta.productName,
            slug: variantMeta.productSlug,
            variantName: variantMeta.variantName,
            imageUrl: variantMeta.imageUrl
          }
        : null,
      unitPriceValue: moneyToNumber(pricingLine?.unitPrice || item.unitPrice || variantMeta?.variantPrice),
      oldUnitPriceValue: moneyToNumber(pricingLine?.originalUnitPrice || variantMeta?.variantOldPrice),
      discountPercent: pricingLine?.saleApplied
        ? Math.round(
            ((moneyToNumber(pricingLine.originalUnitPrice) - moneyToNumber(pricingLine.unitPrice)) /
              Math.max(1, moneyToNumber(pricingLine.originalUnitPrice))) * 100
          )
        : variantMeta?.discountPercent || null
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

  const message = getCustomerSafeErrorMessage(err, {
    context: 'addToCart',
    fallbackMessage: 'Возможно, товар закончился или недоступен.'
  });

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
  const [pricing, setPricing] = useState(null);
  const [lastAddedItem, setLastAddedItem] = useState(null);

  const variantMap = useMemo(
    () => normalizeVariantsMap(products),
    [products]
  );

  const items = useMemo(
    () => enrichCartItems(rawItems, variantMap, pricing),
    [rawItems, variantMap, pricing]
  );

  const syncCart = useCallback(
    async (id) => {
      try {
        const cart = await getCart(id);
        setRawItems(Array.isArray(cart?.items) ? cart.items : []);
        try {
          const nextPricing = await getCartPricing(id);
          setPricing(nextPricing || null);
        } catch (pricingErr) {
          console.error('Failed to load cart pricing:', pricingErr);
          setPricing(null);
        }
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

  const refreshPricing = useCallback(async () => {
    if (!cartId) return null;
    try {
      const nextPricing = await getCartPricing(cartId);
      setPricing(nextPricing || null);
      return nextPricing || null;
    } catch (err) {
      console.error('Failed to refresh cart pricing:', err);
      setPricing(null);
      return null;
    }
  }, [cartId]);

  const applyPromoCode = useCallback(
    async (code) => {
      if (!cartId) return { ok: false };
      const normalizedCode = String(code || '').trim();
      if (!normalizedCode) return { ok: false };
      try {
        await applyCartPromoCode(cartId, normalizedCode);
        await syncCart(cartId);
        return { ok: true };
      } catch (err) {
        console.error('Failed to apply promo code:', err);
        return { ok: false, error: err };
      }
    },
    [cartId, syncCart]
  );

  const removePromoCode = useCallback(async () => {
    if (!cartId) return { ok: false };
    try {
      await removeCartPromoCode(cartId);
      await syncCart(cartId);
      return { ok: true };
    } catch (err) {
      console.error('Failed to remove promo code:', err);
      return { ok: false, error: err };
    }
  }, [cartId, syncCart]);

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
    pricing,
    addItem,
    removeItem,
    updateQuantity,
    refreshPricing,
    applyPromoCode,
    removePromoCode,
    clearCart,
    lastAddedItem,
    dismissLastAddedItem
  };

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

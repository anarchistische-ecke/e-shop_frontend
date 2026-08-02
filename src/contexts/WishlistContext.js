import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'cozyhome-wishlist:v1';
const SNAPSHOT_STORAGE_KEY = 'cozyhome-wishlist-snapshots:v1';

export const WishlistContext = createContext({
  ids: [],
  items: [],
  count: 0,
  add: () => {},
  remove: () => {},
  toggle: () => false,
  clear: () => {},
  reconcile: () => {},
  isWishlisted: () => false
});

function normalizeId(value) {
  return String(typeof value === 'object' ? value?.id || '' : value || '').trim();
}

function readStoredIds() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(rawValue || '[]');
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.map(normalizeId).filter(Boolean)));
  } catch (err) {
    return [];
  }
}

function compactSnapshot(product) {
  if (!product?.id) return null;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    summary: product.summary || '',
    description: product.summary || product.description || '',
    category: product.category,
    categories: Array.isArray(product.categories) ? product.categories : [],
    brand: product.brand,
    brandName: product.brandName,
    primaryVariant: product.primaryVariant || null,
    variants: Array.isArray(product.variants) ? product.variants.slice(0, 1) : [],
    price: product.price,
    oldPrice: product.oldPrice,
    stock: product.stock,
    inStock: product.inStock,
    onSale: product.onSale,
    discountPercent: product.discountPercent,
    images: Array.isArray(product.images) ? product.images.slice(0, 1) : [],
    primaryMedia: product.primaryMedia || null,
    attributes: Array.isArray(product.attributes) ? product.attributes.slice(0, 3) : [],
    badges: Array.isArray(product.badges) ? product.badges : []
  };
}

function readStoredSnapshots() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(SNAPSHOT_STORAGE_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch (error) {
    return {};
  }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(readStoredIds);
  const [snapshots, setSnapshots] = useState(readStoredSnapshots);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots));
  }, [snapshots]);

  const items = useMemo(
    () => ids.map((id) => snapshots[id]).filter(Boolean),
    [ids, snapshots]
  );

  const add = useCallback((productOrId) => {
    const id = normalizeId(productOrId);
    if (!id) return;
    const snapshot = typeof productOrId === 'object' ? compactSnapshot(productOrId) : null;
    if (snapshot) {
      setSnapshots((current) => ({ ...current, [id]: snapshot }));
    }
    setIds((current) => (current.includes(id) ? current : [id, ...current]));
  }, []);

  const remove = useCallback((productOrId) => {
    const id = normalizeId(productOrId);
    if (!id) return;
    setIds((current) => current.filter((entry) => entry !== id));
    setSnapshots((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const toggle = useCallback((productOrId) => {
    const id = normalizeId(productOrId);
    if (!id) return false;
    const snapshot = typeof productOrId === 'object' ? compactSnapshot(productOrId) : null;
    let nextState = false;
    setIds((current) => {
      if (current.includes(id)) {
        nextState = false;
        setSnapshots((values) => {
          const next = { ...values };
          delete next[id];
          return next;
        });
        return current.filter((entry) => entry !== id);
      }
      nextState = true;
      if (snapshot) {
        setSnapshots((values) => ({ ...values, [id]: snapshot }));
      }
      return [id, ...current];
    });
    return nextState;
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    setSnapshots({});
  }, []);

  const reconcile = useCallback((products = []) => {
    const nextSnapshots = {};
    products.forEach((product) => {
      const snapshot = compactSnapshot(product);
      if (snapshot) nextSnapshots[String(snapshot.id)] = snapshot;
    });
    setSnapshots((current) => ({ ...current, ...nextSnapshots }));
  }, []);

  const isWishlisted = useCallback(
    (productOrId) => ids.includes(normalizeId(productOrId)),
    [ids]
  );

  const value = useMemo(
    () => ({
      ids,
      items,
      count: ids.length,
      add,
      remove,
      toggle,
      clear,
      reconcile,
      isWishlisted
    }),
    [add, clear, ids, isWishlisted, items, reconcile, remove, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

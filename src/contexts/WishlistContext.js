import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useProductDirectoryData } from '../features/product-list/data';

const STORAGE_KEY = 'cozyhome-wishlist:v1';

export const WishlistContext = createContext({
  ids: [],
  items: [],
  count: 0,
  add: () => {},
  remove: () => {},
  toggle: () => false,
  clear: () => {},
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

export function WishlistProvider({ children }) {
  const { products } = useProductDirectoryData({ requireFull: true });
  const [ids, setIds] = useState(readStoredIds);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const productById = useMemo(() => {
    const map = new Map();
    (Array.isArray(products) ? products : []).forEach((product) => {
      if (product?.id) {
        map.set(String(product.id), product);
      }
    });
    return map;
  }, [products]);

  const items = useMemo(
    () => ids.map((id) => productById.get(id)).filter(Boolean),
    [ids, productById]
  );

  const add = useCallback((productOrId) => {
    const id = normalizeId(productOrId);
    if (!id) return;
    setIds((current) => (current.includes(id) ? current : [id, ...current]));
  }, []);

  const remove = useCallback((productOrId) => {
    const id = normalizeId(productOrId);
    if (!id) return;
    setIds((current) => current.filter((entry) => entry !== id));
  }, []);

  const toggle = useCallback((productOrId) => {
    const id = normalizeId(productOrId);
    if (!id) return false;
    let nextState = false;
    setIds((current) => {
      if (current.includes(id)) {
        nextState = false;
        return current.filter((entry) => entry !== id);
      }
      nextState = true;
      return [id, ...current];
    });
    return nextState;
  }, []);

  const clear = useCallback(() => {
    setIds([]);
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
      isWishlisted
    }),
    [add, clear, ids, isWishlisted, items, remove, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

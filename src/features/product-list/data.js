import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { getBrands, getCategories, getCatalogueListing } from '../../api';
import { readEnv } from '../../config/runtime.js';

let cachedDirectoryData = null;
let cachedDirectoryError = null;
let directoryRequest = null;
let cachedDirectoryAt = 0;

const parsedDirectoryCacheTtlMs = Number(readEnv('REACT_APP_CATALOGUE_CACHE_TTL_MS', '30000'));
const DIRECTORY_CACHE_TTL_MS = Number.isFinite(parsedDirectoryCacheTtlMs) && parsedDirectoryCacheTtlMs >= 0
  ? parsedDirectoryCacheTtlMs
  : 30000;

const CatalogueDataContext = createContext(null);

function isDirectoryCacheFresh() {
  return Boolean(
    cachedDirectoryData &&
      cachedDirectoryAt > 0 &&
      Date.now() - cachedDirectoryAt < DIRECTORY_CACHE_TTL_MS
  );
}

function normalizeDirectoryPayload([categoriesResponse, brandsResponse, listingResponse]) {
  const categories = Array.isArray(categoriesResponse) ? categoriesResponse : [];
  const brands = Array.isArray(brandsResponse) ? brandsResponse : [];
  const products = Array.isArray(listingResponse?.items)
    ? listingResponse.items.filter((product) => product?.isActive !== false)
    : [];

  return { categories, brands, products, listing: listingResponse || null, compact: true };
}

function normalizeDirectoryData(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const categories = Array.isArray(payload.categories) ? payload.categories : [];
  const brands = Array.isArray(payload.brands) ? payload.brands : [];
  const products = Array.isArray(payload.products)
    ? payload.products.filter((product) => product?.isActive !== false)
    : [];

  return {
    categories,
    brands,
    products,
    listing: payload.listing || null,
    compact: Boolean(payload.compact)
  };
}

function primeProductDirectoryData(data) {
  const normalized = normalizeDirectoryData(data);
  if (!normalized) {
    return null;
  }

  cachedDirectoryData = normalized;
  cachedDirectoryError = null;
  cachedDirectoryAt = Date.now();
  return normalized;
}

function createDirectoryState(initialData = null) {
  const seededData = normalizeDirectoryData(initialData) || cachedDirectoryData;
  return {
    categories: seededData?.categories || [],
    brands: seededData?.brands || [],
    products: seededData?.products || [],
    listing: seededData?.listing || null,
    compact: Boolean(seededData?.compact),
    loading: !seededData,
    error: cachedDirectoryError
  };
}

function applyDirectoryState(setState, data) {
  setState({
    categories: data.categories,
    brands: data.brands,
    products: data.products,
    listing: data.listing || null,
    compact: Boolean(data.compact),
    loading: false,
    error: null
  });
}

export function loadProductDirectoryData({ force = false } = {}) {
  if (
    !force &&
    isDirectoryCacheFresh()
  ) {
    return Promise.resolve(cachedDirectoryData);
  }

  if (directoryRequest) {
    return directoryRequest;
  }

  directoryRequest = Promise.all([
    getCategories(),
    getBrands(),
    getCatalogueListing({ page: 0, size: 12 })
  ])
    .then((responses) => {
      cachedDirectoryData = normalizeDirectoryPayload(responses);
      cachedDirectoryError = null;
      cachedDirectoryAt = Date.now();
      return cachedDirectoryData;
    })
    .catch((error) => {
      cachedDirectoryError = error;
      throw error;
    })
    .finally(() => {
      directoryRequest = null;
    });

  return directoryRequest;
}

function useStandaloneDirectoryState({ enabled = true, initialData = null } = {}) {
  const seededData = useMemo(() => {
    return normalizeDirectoryData(initialData) || cachedDirectoryData;
  }, [initialData]);

  if (seededData && !cachedDirectoryData) {
    primeProductDirectoryData(seededData);
  }

  const [state, setState] = useState(() => createDirectoryState(seededData));

  const refresh = useCallback((options = {}) => {
    return loadProductDirectoryData(options)
      .then((data) => {
        applyDirectoryState(setState, data);
        return data;
      })
      .catch((error) => {
        setState((previous) => ({
          ...previous,
          loading: false,
          error
        }));
        throw error;
      });
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let active = true;

    if (seededData) {
      applyDirectoryState(setState, seededData);
      return undefined;
    }

    setState((previous) => ({
      ...previous,
      loading: true,
      error: null
    }));

    refresh()
      .then((data) => {
        if (!active) {
          return;
        }
        applyDirectoryState(setState, data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [enabled, refresh, seededData]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    const refreshIfStale = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      if (!isDirectoryCacheFresh()) {
        refresh({ force: true }).catch(() => {});
      }
    };

    window.addEventListener('focus', refreshIfStale);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', refreshIfStale);
    }
    return () => {
      window.removeEventListener('focus', refreshIfStale);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', refreshIfStale);
      }
    };
  }, [enabled, refresh]);

  return useMemo(
    () => ({
      ...state,
      refresh
    }),
    [refresh, state]
  );
}

export function CatalogueDataProvider({ children, initialData = null }) {
  const state = useStandaloneDirectoryState({
    initialData
  });

  return (
    <CatalogueDataContext.Provider value={state}>
      {children}
    </CatalogueDataContext.Provider>
  );
}

export function useProductDirectoryData() {
  const context = useContext(CatalogueDataContext);
  const standaloneState = useStandaloneDirectoryState({
    enabled: !context
  });

  return context || standaloneState;
}

export function __resetProductDirectoryCacheForTests() {
  cachedDirectoryData = null;
  cachedDirectoryError = null;
  directoryRequest = null;
  cachedDirectoryAt = 0;
}

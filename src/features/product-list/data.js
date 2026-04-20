import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { getBrands, getCategories, getProducts } from '../../api';

let cachedDirectoryData = null;
let cachedDirectoryError = null;
let directoryRequest = null;

const CatalogueDataContext = createContext(null);

function normalizeDirectoryPayload([categoriesResponse, brandsResponse, productsResponse]) {
  const categories = Array.isArray(categoriesResponse) ? categoriesResponse : [];
  const brands = Array.isArray(brandsResponse) ? brandsResponse : [];
  const products = Array.isArray(productsResponse)
    ? productsResponse.filter((product) => product?.isActive !== false)
    : [];

  return { categories, brands, products };
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
    products
  };
}

function primeProductDirectoryData(data) {
  const normalized = normalizeDirectoryData(data);
  if (!normalized) {
    return null;
  }

  cachedDirectoryData = normalized;
  cachedDirectoryError = null;
  return normalized;
}

function createDirectoryState(initialData = null) {
  const seededData = normalizeDirectoryData(initialData) || cachedDirectoryData;
  return {
    categories: seededData?.categories || [],
    brands: seededData?.brands || [],
    products: seededData?.products || [],
    loading: !seededData,
    error: cachedDirectoryError
  };
}

function applyDirectoryState(setState, data) {
  setState({
    categories: data.categories,
    brands: data.brands,
    products: data.products,
    loading: false,
    error: null
  });
}

export function loadProductDirectoryData({ force = false } = {}) {
  if (!force && cachedDirectoryData) {
    return Promise.resolve(cachedDirectoryData);
  }

  if (!force && directoryRequest) {
    return directoryRequest;
  }

  directoryRequest = Promise.all([getCategories(), getBrands(), getProducts()])
    .then((responses) => {
      cachedDirectoryData = normalizeDirectoryPayload(responses);
      cachedDirectoryError = null;
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
}

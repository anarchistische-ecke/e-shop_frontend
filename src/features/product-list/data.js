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

function createDirectoryState() {
  return {
    categories: cachedDirectoryData?.categories || [],
    brands: cachedDirectoryData?.brands || [],
    products: cachedDirectoryData?.products || [],
    loading: !cachedDirectoryData,
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

function useStandaloneDirectoryState({ enabled = true } = {}) {
  const [state, setState] = useState(() => createDirectoryState());

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

    if (cachedDirectoryData) {
      applyDirectoryState(setState, cachedDirectoryData);
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
  }, [enabled, refresh]);

  return useMemo(
    () => ({
      ...state,
      refresh
    }),
    [refresh, state]
  );
}

export function CatalogueDataProvider({ children }) {
  const state = useStandaloneDirectoryState();

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

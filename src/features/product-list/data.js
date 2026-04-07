import { useEffect, useState } from 'react';
import { getBrands, getCategories, getProducts } from '../../api';

let cachedDirectoryData = null;
let cachedDirectoryError = null;
let directoryRequest = null;

function normalizeDirectoryPayload([categoriesResponse, brandsResponse, productsResponse]) {
  const categories = Array.isArray(categoriesResponse) ? categoriesResponse : [];
  const brands = Array.isArray(brandsResponse) ? brandsResponse : [];
  const products = Array.isArray(productsResponse)
    ? productsResponse.filter((product) => product?.isActive !== false)
    : [];

  return { categories, brands, products };
}

export function loadProductDirectoryData() {
  if (cachedDirectoryData) {
    return Promise.resolve(cachedDirectoryData);
  }

  if (!directoryRequest) {
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
  }

  return directoryRequest;
}

export function useProductDirectoryData() {
  const [state, setState] = useState(() => ({
    categories: cachedDirectoryData?.categories || [],
    brands: cachedDirectoryData?.brands || [],
    products: cachedDirectoryData?.products || [],
    loading: !cachedDirectoryData,
    error: cachedDirectoryError
  }));

  useEffect(() => {
    let active = true;

    if (cachedDirectoryData) {
      setState({
        categories: cachedDirectoryData.categories,
        brands: cachedDirectoryData.brands,
        products: cachedDirectoryData.products,
        loading: false,
        error: null
      });
      return undefined;
    }

    setState((previous) => ({
      ...previous,
      loading: true,
      error: null
    }));

    loadProductDirectoryData()
      .then((data) => {
        if (!active) {
          return;
        }
        setState({
          categories: data.categories,
          brands: data.brands,
          products: data.products,
          loading: false,
          error: null
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setState({
          categories: [],
          brands: [],
          products: [],
          loading: false,
          error
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}

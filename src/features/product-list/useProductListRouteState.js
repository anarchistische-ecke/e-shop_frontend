import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  buildProductListSearchParams,
  parseProductListSearchParams
} from './url';

export function useProductListRouteState({ source = 'catalog', categorySlug = '' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(
    () => parseProductListSearchParams(searchParams, { source, categorySlug }),
    [categorySlug, searchParams, source]
  );

  const updateParams = useCallback(
    (patch, { replace = false, resetPage = true } = {}) => {
      const next = {
        ...params,
        ...patch
      };

      if (resetPage && !Object.prototype.hasOwnProperty.call(patch || {}, 'page')) {
        next.page = 1;
      }

      setSearchParams(
        buildProductListSearchParams(next, { source, categorySlug }),
        { replace }
      );
    },
    [categorySlug, params, setSearchParams, source]
  );

  const clearFilters = useCallback(() => {
    updateParams({
      scope: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      inStock: false,
      sale: false
    });
  }, [updateParams]);

  return {
    params,
    updateParams,
    clearFilters
  };
}

import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  buildProductListSearchParams,
  parseProductListSearchParams
} from '../features/product-list/url';

function SearchRedirectPage() {
  const location = useLocation();

  const target = useMemo(() => {
    const params = parseProductListSearchParams(location.search, { source: 'catalog' });
    const normalized = buildProductListSearchParams(params, { source: 'catalog' }).toString();
    return {
      pathname: '/search',
      search: normalized ? `?${normalized}` : ''
    };
  }, [location.search]);

  return <Navigate replace to={target} state={location.state} />;
}

export default SearchRedirectPage;

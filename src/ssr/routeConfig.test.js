import {
  getAllStorefrontRouteConfigs,
  matchStorefrontRoute
} from './routeConfig';

describe('storefront route config', () => {
  it('matches public SSR routes and extracts params', () => {
    expect(matchStorefrontRoute('/')).toMatchObject({
      route: { id: 'home', renderMode: 'ssr' },
      params: {}
    });

    expect(matchStorefrontRoute('/category/popular')).toMatchObject({
      route: { id: 'category', renderMode: 'ssr' },
      params: { slug: 'popular' }
    });

    expect(matchStorefrontRoute('/product/prod-1/linen-soft')).toMatchObject({
      route: { id: 'product', renderMode: 'ssr' },
      params: { id: 'prod-1', slug: 'linen-soft' }
    });

    expect(matchStorefrontRoute('/product/prod-1')).toMatchObject({
      route: { id: 'product', renderMode: 'ssr' },
      params: { id: 'prod-1' }
    });
  });

  it('marks private and transactional routes as csr-only', () => {
    expect(matchStorefrontRoute('/search').route).toMatchObject({
      id: 'search',
      renderMode: 'csr'
    });
    expect(matchStorefrontRoute('/checkout').route).toMatchObject({
      id: 'checkout',
      renderMode: 'csr'
    });
    expect(matchStorefrontRoute('/admin/products').route).toMatchObject({
      id: 'admin-app',
      renderMode: 'csr'
    });
  });

  it('falls back to the synthetic 404 route for unknown paths', () => {
    expect(matchStorefrontRoute('/missing-page')).toMatchObject({
      route: { id: 'not-found', renderMode: 'ssr' },
      params: {}
    });

    expect(getAllStorefrontRouteConfigs().at(-1)).toMatchObject({
      id: 'not-found',
      path: '*',
      renderMode: 'ssr'
    });
  });
});

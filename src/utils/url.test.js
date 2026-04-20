import {
  buildAbsoluteAppUrl,
  buildAppPath,
  buildProductPath,
  getCanonicalUrl,
  resolveAppBasePath,
} from './url';

describe('url helpers', () => {
  const originalBaseName = process.env.REACT_APP_BASENAME;
  const originalPublicUrl = process.env.PUBLIC_URL;

  afterEach(() => {
    if (typeof originalBaseName === 'undefined') {
      delete process.env.REACT_APP_BASENAME;
    } else {
      process.env.REACT_APP_BASENAME = originalBaseName;
    }

    if (typeof originalPublicUrl === 'undefined') {
      delete process.env.PUBLIC_URL;
    } else {
      process.env.PUBLIC_URL = originalPublicUrl;
    }
  });

  it('uses REACT_APP_BASENAME for order return paths', () => {
    process.env.REACT_APP_BASENAME = '/shop';
    delete process.env.PUBLIC_URL;

    expect(resolveAppBasePath()).toBe('/shop');
    expect(buildAppPath('/order/test-token')).toBe('/shop/order/test-token');
    expect(buildAbsoluteAppUrl('/order/test-token')).toBe('http://localhost:3000/shop/order/test-token');
    expect(getCanonicalUrl('/order/test-token')).toBe('http://localhost:3000/shop/order/test-token');
    expect(buildAbsoluteAppUrl('/order/{token}')).toBe('http://localhost:3000/shop/order/{token}');
  });

  it('falls back to PUBLIC_URL pathname when basename is unset', () => {
    delete process.env.REACT_APP_BASENAME;
    process.env.PUBLIC_URL = 'https://cdn.example.com/shop/';

    expect(resolveAppBasePath()).toBe('/shop');
    expect(buildAppPath('/order/test-token')).toBe('/shop/order/test-token');
  });

  it('keeps root-relative order paths unchanged when no base path is configured', () => {
    delete process.env.REACT_APP_BASENAME;
    delete process.env.PUBLIC_URL;

    expect(resolveAppBasePath()).toBe('');
    expect(buildAppPath('/order/test-token')).toBe('/order/test-token');
    expect(buildAbsoluteAppUrl('/order/test-token')).toBe('http://localhost:3000/order/test-token');
    expect(getCanonicalUrl('/order/test-token')).toBe('http://localhost:3000/order/test-token');
  });

  it('builds stable storefront product paths with slug support', () => {
    expect(buildProductPath({ id: 'prod-1', slug: 'linen-soft' })).toBe('/product/prod-1/linen-soft');
    expect(buildProductPath({ id: 'prod-2' })).toBe('/product/prod-2');
    expect(buildProductPath({})).toBe('/catalog');
  });

  it('keeps absolute canonical URLs unchanged', () => {
    expect(getCanonicalUrl('https://yug-postel.ru/product/prod-1/linen-soft')).toBe(
      'https://yug-postel.ru/product/prod-1/linen-soft'
    );
  });
});

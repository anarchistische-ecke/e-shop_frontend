import { buildAbsoluteAppUrl, buildAppPath, resolveAppBasePath } from './url';

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
    expect(buildAbsoluteAppUrl('/order/test-token')).toBe('http://localhost/shop/order/test-token');
    expect(buildAbsoluteAppUrl('/order/{token}')).toBe('http://localhost/shop/order/{token}');
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
    expect(buildAbsoluteAppUrl('/order/test-token')).toBe('http://localhost/order/test-token');
  });
});

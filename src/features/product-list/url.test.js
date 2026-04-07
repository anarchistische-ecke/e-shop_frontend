import {
  buildCategoryListingHref,
  buildCatalogSearchHref,
  buildProductListSearchParams,
  parseProductListSearchParams
} from './url';

describe('product list url helpers', () => {
  it('parses and serializes the canonical catalog query schema', () => {
    const parsed = parseProductListSearchParams(
      '?query=Плед&scope=throws&brand=luna-soft&sort=priceAsc&minPrice=1000&maxPrice=5000&rating=4.5&inStock=1&sale=1&page=3&original=плде',
      { source: 'catalog' }
    );

    expect(parsed).toEqual({
      query: 'Плед',
      scope: 'throws',
      brand: 'luna-soft',
      sort: 'priceAsc',
      minPrice: '1000',
      maxPrice: '5000',
      rating: '4.5',
      inStock: true,
      sale: true,
      page: 3,
      original: 'плде'
    });

    expect(
      buildProductListSearchParams(parsed, { source: 'catalog' }).toString()
    ).toBe(
      'query=%D0%9F%D0%BB%D0%B5%D0%B4&scope=throws&brand=luna-soft&sort=priceAsc&minPrice=1000&maxPrice=5000&rating=4.5&inStock=1&sale=1&page=3&original=%D0%BF%D0%BB%D0%B4%D0%B5'
    );
  });

  it('builds canonical catalog href without redundant default params', () => {
    expect(
      buildCatalogSearchHref({
        query: 'Плед',
        scope: 'throws'
      })
    ).toBe('/catalog?query=%D0%9F%D0%BB%D0%B5%D0%B4&scope=throws');
  });

  it('builds shareable category hrefs without correction-only params', () => {
    expect(
      buildCategoryListingHref('popular', {
        query: 'Сатин',
        original: 'стин',
        page: 2,
        sort: 'priceAsc'
      })
    ).toBe('/category/popular?query=%D0%A1%D0%B0%D1%82%D0%B8%D0%BD&sort=priceAsc&page=2');
  });
});

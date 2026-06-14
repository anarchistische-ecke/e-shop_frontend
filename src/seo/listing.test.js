import {
  getListingCanonicalPath,
  getListingRobots,
  hasListingSeoVariant
} from './listing';

describe('listing seo policy', () => {
  it('keeps clean catalog and category URLs indexable', () => {
    expect(hasListingSeoVariant({ sort: 'bestMatch', page: 1 }, { source: 'catalog' })).toBe(false);
    expect(getListingRobots({ sort: 'bestMatch', page: 1 }, { source: 'catalog' })).toBeUndefined();
    expect(getListingCanonicalPath({ source: 'category', categorySlug: 'popular' })).toBe('/category/popular');
  });

  it('marks filtered, searched, sorted, and paginated URLs as noindex follow', () => {
    expect(getListingRobots({ query: 'сатин', sort: 'bestMatch' }, { source: 'catalog' })).toBe('noindex,follow');
    expect(getListingRobots({ brand: 'cozy-home', sort: 'bestMatch' }, { source: 'catalog' })).toBe('noindex,follow');
    expect(getListingRobots({ sort: 'priceAsc' }, { source: 'catalog' })).toBe('noindex,follow');
    expect(getListingRobots({ page: 2, sort: 'bestMatch' }, { source: 'catalog' })).toBe('noindex,follow');
  });
});

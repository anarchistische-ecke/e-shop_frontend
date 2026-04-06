import {
  buildAccountLinks,
  buildCategoryCollections,
  buildHeaderSearchParams,
  resolveWayfindingLabel
} from './header';

describe('header utils', () => {
  it('builds sorted category collections and lookup maps', () => {
    const categories = [
      { id: 3, slug: 'nested', name: 'Nested', parentId: 2, position: 3 },
      { id: 2, slug: 'duvets', name: 'Одеяла', position: 2 },
      { id: 1, slug: 'bedding', name: 'Постельное белье', position: 1 },
      { id: 4, slug: 'sheets', name: 'Простыни', parentId: 1, position: 1 }
    ];

    const collections = buildCategoryCollections(categories);

    expect(collections.navCategories.map((category) => category.slug)).toEqual([
      'bedding',
      'duvets'
    ]);
    expect(collections.categoryByToken.bedding.id).toBe(1);
    expect(collections.categoryByNormalizedToken.bedding.id).toBe(1);
    expect(collections.childrenByParent['1'][0].slug).toBe('sheets');
  });

  it('builds search params with scope labels and corrected query metadata', () => {
    const params = buildHeaderSearchParams({
      queryValue: 'Плед',
      scopeValue: 'bedding',
      originalQuery: 'плде',
      categoryByNormalizedToken: {
        bedding: { name: 'Постельное белье' }
      }
    });

    expect(params.get('query')).toBe('Плед');
    expect(params.get('scope')).toBe('bedding');
    expect(params.get('scopeLabel')).toBe('Постельное белье');
    expect(params.get('original')).toBe('плде');
    expect(params.get('corrected')).toBe('Плед');
  });

  it('resolves wayfinding labels and account links', () => {
    expect(resolveWayfindingLabel('/checkout')).toBe('Оформление');
    expect(resolveWayfindingLabel('/category/search?query=плед')).toBe('Поиск');
    expect(buildAccountLinks(false)).toHaveLength(6);
    expect(buildAccountLinks(true)).toEqual([
      { to: '/account#overview', label: 'Сводка' },
      { to: '/account#orders', label: 'Заказы' },
      { to: '/cart', label: 'Ссылка на оплату' }
    ]);
  });
});

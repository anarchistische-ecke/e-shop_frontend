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
      originalQuery: 'плде'
    });

    expect(params.get('query')).toBe('Плед');
    expect(params.get('scope')).toBe('bedding');
    expect(params.get('original')).toBe('плде');
  });

  it('resolves wayfinding labels and account links', () => {
    expect(resolveWayfindingLabel('/checkout')).toBe('Оформление');
    expect(resolveWayfindingLabel('/pay/token-1')).toBe('Оплата заказа');
    expect(resolveWayfindingLabel('/favorites')).toBe('Избранное');
    expect(resolveWayfindingLabel('/manager/payment-link')).toBe('Ссылка на оплату');
    expect(resolveWayfindingLabel('/search', '?query=плед')).toBe('Поиск');
    expect(resolveWayfindingLabel('/category/search?query=плед')).toBe('Поиск');
    expect(resolveWayfindingLabel('/catalog', '?query=плед')).toBe('Поиск');
    expect(buildAccountLinks(false)).toEqual([
      { to: '/account#profile', label: 'Профиль' },
      { to: '/account#promocodes', label: 'Акции и промокоды' },
      { to: '/account#orders', label: 'Мои заказы' },
      { to: '/account#purchases', label: 'Купленные товары' }
    ]);
    expect(buildAccountLinks(true)).toEqual([
      { to: '/account#overview', label: 'Сводка' },
      { to: '/account#orders', label: 'Заказы' },
      { to: '/account#cms', label: 'CMS витрины' },
      { to: '/manager/payment-link', label: 'Ссылка на оплату' }
    ]);
  });
});

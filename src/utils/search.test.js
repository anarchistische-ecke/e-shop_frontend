import { buildAutocompleteData } from './search';

describe('search autocomplete', () => {
  const categories = [
    {
      id: 'popular',
      slug: 'popular',
      name: 'Популярное',
      description: 'Бестселлеры для спальни'
    },
    {
      id: 'throws',
      slug: 'throws',
      name: 'Пледы',
      description: 'Пледы и мягкие акценты'
    },
    {
      id: 'throws-light',
      slug: 'throws-light',
      parentId: 'throws',
      name: 'Лёгкие пледы',
      description: 'Воздушные пледы'
    }
  ];

  const products = [
    {
      id: 'prod-1',
      name: 'Плед Cloud',
      category: 'throws',
      rating: 4.6,
      variants: [{ id: 'variant-1', name: '130×170', price: 2600, stock: 3 }]
    }
  ];

  it('returns direct category suggestions with real route tokens', () => {
    const result = buildAutocompleteData({
      query: 'плед',
      categories,
      products
    });

    expect(result.categorySuggestions.map((item) => item.token)).toEqual([
      'throws',
      'throws-light'
    ]);
    expect(result.categorySuggestions[0].label).toBe('Пледы');
    expect(result.productSuggestions[0].id).toBe('prod-1');
  });
});

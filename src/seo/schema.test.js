import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildJsonLdGraph,
  buildOfferCatalogJsonLd,
  buildOrganizationJsonLd,
  buildProductJsonLd,
  buildProductMicrodata,
  buildWebSiteJsonLd,
  pruneStructuredData
} from './schema';

describe('seo schema builders', () => {
  const originalSiteUrl = process.env.REACT_APP_SITE_URL;

  beforeEach(() => {
    process.env.REACT_APP_SITE_URL = 'https://yug-postel.ru';
  });

  afterEach(() => {
    if (typeof originalSiteUrl === 'undefined') {
      delete process.env.REACT_APP_SITE_URL;
      return;
    }
    process.env.REACT_APP_SITE_URL = originalSiteUrl;
  });

  const product = {
    id: 'prod-satin-sand',
    slug: 'satin-sand',
    name: 'Сатиновый комплект Sand',
    description: 'Комплект из мягкого сатина.',
    sku: 'SAND-BASE',
    brand: { name: 'Cozy Home' },
    category: 'popular',
    rating: 4.9,
    reviewCount: 18,
    variants: [{ id: 'var-1', sku: 'SAND-200', price: 4200, stock: 7 }],
    images: [{ url: 'https://cdn.example.com/satin.jpg' }]
  };

  it('prunes empty structured data fields recursively', () => {
    expect(
      pruneStructuredData({
        name: 'Title',
        empty: '',
        nested: { keep: 'yes', drop: undefined },
        list: [null, { value: '' }, { value: 'ok' }]
      })
    ).toEqual({
      name: 'Title',
      nested: { keep: 'yes' },
      list: [{ value: 'ok' }]
    });
  });

  it('builds Organization and WebSite nodes with search action', () => {
    const organization = buildOrganizationJsonLd();
    const website = buildWebSiteJsonLd();

    expect(organization).toMatchObject({
      '@type': 'Organization',
      url: 'https://yug-postel.ru/'
    });
    expect(website).toMatchObject({
      '@type': 'WebSite',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://yug-postel.ru/search?query={search_term_string}'
      }
    });
  });

  it('builds Product and Offer data from existing product facts only', () => {
    const jsonLd = buildProductJsonLd({
      product,
      variant: product.variants[0],
      categoryName: 'Популярное',
      path: '/product/prod-satin-sand/satin-sand'
    });

    expect(jsonLd).toMatchObject({
      '@type': 'Product',
      name: 'Сатиновый комплект Sand',
      sku: 'SAND-200',
      category: 'Популярное',
      offers: {
        '@type': 'Offer',
        price: '4200.00',
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock'
      }
    });
    expect(jsonLd.gtin).toBeUndefined();
  });

  it('builds product microdata payload from the same product builder', () => {
    const microdata = buildProductMicrodata(product, {
      variant: product.variants[0],
      path: '/product/prod-satin-sand/satin-sand'
    });

    expect(microdata.offer).toMatchObject({
      price: '4200.00',
      url: 'https://yug-postel.ru/product/prod-satin-sand/satin-sand'
    });
    expect(microdata.brand).toBe('Cozy Home');
  });

  it('builds OfferCatalog only when required catalog fields are available', () => {
    const catalog = buildOfferCatalogJsonLd({
      name: 'Каталог товаров',
      description: 'Каталог домашнего текстиля.',
      products: [product]
    });

    expect(catalog).toMatchObject({
      '@type': 'OfferCatalog',
      name: 'Каталог товаров',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Сатиновый комплект Sand',
          price: '4200.00',
          priceCurrency: 'RUB'
        }
      ]
    });
  });

  it('builds breadcrumbs and FAQ schema from existing page content', () => {
    const breadcrumbs = buildBreadcrumbJsonLd([
      { name: 'Главная', path: '/' },
      { name: 'Вопросы', path: '/faq' }
    ]);
    const faq = buildFaqPageJsonLd({
      path: '/faq',
      sections: [
        {
          sectionType: 'faq_list',
          items: [{ title: 'Когда отправка?', description: '<p>В течение <strong>24 часов</strong>.</p>' }]
        }
      ]
    });

    expect(breadcrumbs.itemListElement).toHaveLength(2);
    expect(faq.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: 'Когда отправка?',
      acceptedAnswer: { text: 'В течение 24 часов.' }
    });
  });

  it('wraps nodes in a JSON-LD graph', () => {
    const graph = buildJsonLdGraph([
      buildOrganizationJsonLd(),
      buildWebSiteJsonLd(),
      null
    ]);

    expect(graph).toMatchObject({
      '@context': 'https://schema.org'
    });
    expect(graph['@graph']).toHaveLength(2);
  });
});

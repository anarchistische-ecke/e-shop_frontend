// @vitest-environment node

import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../src/entry-server.jsx';
import { createStorefrontServer } from './index.mjs';

const template = await fs.readFile(
  path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'index.html'),
  'utf8'
);

const categories = [
  {
    id: 'popular',
    slug: 'popular',
    name: 'Популярное',
    description: 'Бестселлеры для спальни и дома.'
  }
];
const brands = [{ id: 'brand-cozy', slug: 'cozy-home', name: 'Cozy Home' }];
const products = [
  {
    id: 'prod-satin-sand',
    slug: 'satin-sand',
    name: 'Сатиновый комплект Sand',
    price: 4200,
    oldPrice: 5100,
    rating: 4.9,
    reviewCount: 18,
    material: 'Сатин',
    category: 'popular',
    description: 'Комплект из мягкого сатина для спокойной спальни.',
    variants: [
      {
        id: 'var-satin-sand-200',
        name: '200×220',
        price: 4200,
        oldPrice: 5100,
        stock: 7
      }
    ],
    images: [
      {
        id: 'img-satin-sand-1',
        url: 'https://cdn.example.com/satin-sand.jpg',
        alt: 'Сатиновый комплект Sand'
      }
    ]
  }
];
const homePage = {
  title: 'Домашний текстиль для уютного дома',
  slug: 'home',
  path: '/',
  template: 'home',
  summary: 'Редакционная главная витрина.',
  seoTitle: 'Домашний текстиль для уютного дома',
  seoDescription: 'Домашний текстиль для уютного дома с понятной доставкой и оплатой.',
  sections: [
    {
      anchorId: 'home-hero',
      sectionType: 'hero',
      sort: 1,
      eyebrow: 'Постельное Белье-ЮГ',
      title: 'Постель, которая остается свежей',
      accent: 'ночь за ночью',
      body: '<p>Главная страница управляется через Directus.</p>',
      primaryCtaLabel: 'Смотреть бестселлеры',
      primaryCtaUrl: '/category/popular',
      secondaryCtaLabel: 'Найти свою ткань',
      secondaryCtaUrl: '/catalog?query=ткань',
      styleVariant: 'warm',
      items: [
        {
          title: 'Доставка по согласованию',
          description: 'Менеджер рассчитает стоимость после заказа.',
          sort: 1
        }
      ]
    },
    {
      anchorId: 'home-bestsellers',
      sectionType: 'product_reference_list',
      sort: 2,
      title: 'Бестселлеры, которые быстро объясняют выбор',
      items: [
        {
          title: 'Сатиновый комплект Sand',
          referenceKind: 'product_slug',
          referenceKey: 'satin-sand',
          sort: 1
        }
      ]
    },
    {
      anchorId: 'home-fabric-guide',
      sectionType: 'feature_list',
      sort: 3,
      title: 'Выберите по ощущению, а не по названию ткани',
      layoutVariant: 'full',
      items: [
        {
          label: 'Smooth & soft',
          title: 'Сатин',
          description: 'Гладкая поверхность с мягким блеском.',
          sort: 1
        }
      ]
    }
  ]
};
const aboutPage = {
  title: 'О бренде',
  path: '/about',
  summary: 'История бренда и наши принципы.',
  sections: [
    {
      anchorId: 'brand-story',
      sectionType: 'rich_text',
      title: 'Создаем спокойный дом',
      body: '<p>Натуральный текстиль для спальни и отдыха.</p>'
    }
  ]
};
const siteSettings = {
  defaultOgImage: { url: 'https://cdn.example.com/default-og.jpg' }
};
const footerNavigation = [
  {
    title: 'Покупателям',
    items: [{ label: 'Доставка', url: '/info/delivery' }]
  }
];
const homeBestsellersCollection = {
  key: 'home-bestsellers',
  title: 'Подборка для главной',
  description: 'CMS-подборка, связанная с backend-каталогом.',
  primaryCtaLabel: 'Открыть каталог',
  primaryCtaUrl: '/catalog',
  items: [
    {
      entityKind: 'product',
      entityKey: 'prod-satin-sand',
      href: '/product/prod-satin-sand/satin-sand',
      title: 'Сатиновый комплект Sand',
      summary: 'Комплект из мягкого сатина.',
      price: 4200,
      image: {
        url: 'https://cdn.example.com/satin-sand.jpg',
        alt: 'Сатиновый комплект Sand'
      },
      presentation: {
        marketingTitle: 'Сатиновый комплект Sand',
        introBody: 'Комплект из мягкого сатина.',
        badgeText: 'Бестселлер'
      }
    }
  ]
};
const springCampaign = {
  id: 'campaign-spring',
  slug: 'spring',
  internalName: 'Весенняя кампания',
  promotion: {
    id: 'promotion-spring',
    name: 'Весенняя скидка',
    discountPercent: 20,
    currency: 'RUB'
  },
  creatives: [
    {
      id: 'creative-spring',
      title: 'Весеннее обновление спальни',
      description: '<p>Скидка на избранные комплекты.</p>',
      primaryCtaLabel: 'Выбрать комплект',
      primaryCtaUrl: '/catalog'
    }
  ]
};
const previewTarget = {
  collection: 'page',
  id: 'page-home',
  version: 'version-draft',
  content: {
    title: 'Черновик главной страницы',
    slug: 'home',
    path: '/',
    template: 'home',
    sections: [
      {
        anchorId: 'preview-hero',
        sectionType: 'rich_text',
        title: 'Этот текст виден только в защищенном предпросмотре',
        body: '<p>Черновая редакционная версия.</p>'
      }
    ]
  }
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json'
    }
  });
}

function notFoundResponse(message = 'Not found') {
  return jsonResponse({ message }, 404);
}

function createFetchMock() {
  return vi.fn(async (input, init = {}) => {
    const targetUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;
    const { pathname, searchParams } = new URL(targetUrl);

    if (pathname === '/content/site-settings') {
      return jsonResponse(siteSettings);
    }

    if (
      pathname === '/content/navigation' &&
      searchParams.get('placement') === 'footer'
    ) {
      return jsonResponse(footerNavigation);
    }

    if (pathname === '/content/pages/about') {
      return jsonResponse(aboutPage);
    }

    if (pathname === '/content/pages/home') {
      return jsonResponse(homePage);
    }

    if (pathname === '/content/collections/home-bestsellers') {
      return jsonResponse(homeBestsellersCollection);
    }

    if (pathname === '/content/campaigns/active') {
      return jsonResponse(
        searchParams.get('placement') === 'home_promo' ? [springCampaign] : []
      );
    }

    if (pathname === '/content/campaigns/spring') {
      return jsonResponse(springCampaign);
    }

    if (pathname === '/content/preview/session') {
      const token =
        init?.headers?.['X-CMS-Preview-Token'] ||
        init?.headers?.get?.('X-CMS-Preview-Token');
      return token === 'preview-valid'
        ? jsonResponse(previewTarget)
        : jsonResponse({ message: 'Unauthorized' }, 401);
    }

    if (
      pathname === '/content/pages/payment' ||
      pathname === '/content/pages/delivery' ||
      pathname === '/content/pages/bonuses' ||
      pathname === '/content/pages/production'
    ) {
      return notFoundResponse();
    }

    if (pathname === '/categories') {
      return jsonResponse(categories);
    }

    if (pathname === '/brands') {
      return jsonResponse(brands);
    }

    if (pathname === '/products') {
      return jsonResponse(products);
    }

    if (pathname === '/catalogue/cards') {
      return jsonResponse({
        compact: true,
        categories,
        products: products.map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          category: product.category,
          categories: product.categories || [],
          brand: product.brand,
          price: product.variants[0].price,
          oldPrice: product.variants[0].oldPrice,
          onSale: true,
          discountPercent: 18,
          stock: product.variants[0].stock,
          images: product.images,
          primaryMedia: {
            url: 'https://img.example.com/media/products/prod-satin-sand/w640.webp',
            originalUrl: product.images[0].url,
            sources: {
              webp: [
                { url: 'https://img.example.com/media/products/prod-satin-sand/w320.webp', width: 320, format: 'webp' },
                { url: 'https://img.example.com/media/products/prod-satin-sand/w640.webp', width: 640, format: 'webp' }
              ],
              jpeg: [
                { url: 'https://img.example.com/media/products/prod-satin-sand/w640.jpeg', width: 640, format: 'jpeg' }
              ]
            }
          }
        }))
      });
    }

    if (pathname === '/catalogue/listing') {
      const items = products.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        summary: product.description,
        description: product.description,
        category: product.category,
        categories: product.categories || [],
        brand: product.brand,
        price: product.variants[0].price,
        oldPrice: product.variants[0].oldPrice,
        primaryVariant: product.variants[0],
        variants: [product.variants[0]],
        stock: product.variants[0].stock,
        inStock: true,
        images: product.images.slice(0, 1),
        attributes: [`Материал: ${product.material}`],
        badges: ['in_stock'],
        primaryMedia: {
          url: 'https://img.example.com/media/products/prod-satin-sand/w640.webp'
        }
      }));
      return jsonResponse({
        items,
        page: Number(searchParams.get('page') || 0),
        size: Number(searchParams.get('size') || 12),
        totalItems: items.length,
        totalPages: 1,
        appliedQuery: searchParams.get('q') || '',
        correction: null,
        facets: {
          price: { minMinor: 420000, maxMinor: 420000 },
          brands: [{ slug: 'cozy-home', name: 'Cozy Home', count: 1 }],
          childCategories: []
        }
      });
    }

    if (pathname === '/products/prod-satin-sand') {
      return jsonResponse(products[0]);
    }

    return notFoundResponse();
  });
}

describe('storefront SSR server', () => {
  let server;
  let app;

  beforeAll(() => {
    process.env.REACT_APP_SITE_URL = 'https://yug-postel.ru';
    process.env.REACT_APP_API_BASE = 'https://api.yug-postel.ru';
  });

  beforeEach(async () => {
    vi.stubGlobal('fetch', createFetchMock());
    server = await createStorefrontServer({
      mode: 'test',
      template,
      renderModule: { render }
    });
    app = server.app;
  });

  afterEach(async () => {
    await server?.close?.();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the home page with server HTML, canonical metadata, and bootstrap payloads', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe(
      'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
    );
    expect(response.text).toContain(
      'Домашний текстиль для уютного дома | Постельное Белье-ЮГ'
    );
    expect(response.text).toContain('href="https://yug-postel.ru/"');
    expect(response.text).toContain('Постель, которая остается свежей');
    expect(response.text).toContain('Сатиновый комплект Sand');
    expect(response.text).toContain('window.__APP_CONFIG__=');
    expect(response.text).toContain('"siteUrl":"https://yug-postel.ru"');
    expect(response.text).toContain('window.__SSR_DATA__=');
    expect(response.text).toContain('"routeId":"home"');
    expect(response.text).toContain('"directory"');
    expect(response.text).toContain('"compact":true');
    expect(response.text).not.toContain('"reviewCount"');
    expect(response.text).toContain('Весеннее обновление спальни');
  });

  it('renders an active campaign on its canonical SSR landing route', async () => {
    const response = await request(app).get('/promo/spring');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.text).toContain('Весеннее обновление спальни');
    expect(response.text).toContain('Скидка 20%');
    expect(response.text).toContain('href="https://yug-postel.ru/promo/spring"');
    expect(response.text).toContain('"routeId":"promo"');
  });

  it('limits home HTML caching to the next campaign boundary', async () => {
    springCampaign.activeTo = new Date(Date.now() + 30_000).toISOString();
    try {
      const response = await request(app).get('/');
      const cacheControl = response.headers['cache-control'];

      expect(cacheControl).toMatch(/^public, max-age=0, s-maxage=\d+$/);
      expect(Number(cacheControl.match(/s-maxage=(\d+)/)?.[1])).toBeLessThanOrEqual(30);
      expect(cacheControl).not.toContain('stale-while-revalidate');
    } finally {
      delete springCampaign.activeTo;
    }
  });

  it('keeps Directus preview tokens in an HttpOnly session cookie and never in rendered HTML', async () => {
    const acceptResponse = await request(app)
      .get('/__cms-preview/accept?token=preview-valid')
      .redirects(0);

    expect(acceptResponse.status).toBe(303);
    expect(acceptResponse.headers.location).toBe('/__cms-preview/view');
    expect(acceptResponse.headers['cache-control']).toContain('no-store');
    const cookie = acceptResponse.headers['set-cookie']?.[0] || '';
    expect(cookie).toContain('cms_preview_token=preview-valid');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');

    const previewResponse = await request(app)
      .get('/__cms-preview/view')
      .set('Cookie', cookie.split(';')[0]);

    expect(previewResponse.status).toBe(200);
    expect(previewResponse.headers['cache-control']).toBe('no-store');
    expect(previewResponse.text).toContain('Черновик главной страницы');
    expect(previewResponse.text).toContain(
      'Этот текст виден только в защищенном предпросмотре'
    );
    expect(previewResponse.text).toContain('noindex,nofollow');
    expect(previewResponse.text).not.toContain('preview-valid');
  });

  it('rejects missing and invalid Directus preview tokens', async () => {
    const missingResponse = await request(app).get('/__cms-preview/accept');
    expect(missingResponse.status).toBe(400);

    const invalidResponse = await request(app)
      .get('/__cms-preview/accept?token=preview-invalid')
      .redirects(0);
    expect(invalidResponse.status).toBe(401);
    expect(invalidResponse.headers['set-cookie']).toBeUndefined();

    const viewWithoutCookie = await request(app).get('/__cms-preview/view');
    expect(viewWithoutCookie.status).toBe(401);
    expect(viewWithoutCookie.text).toContain('Предпросмотр недоступен');
    expect(viewWithoutCookie.text).not.toContain('cms_preview_token');
  });

  it('renders catalog, category, product, legal info, and legal document SSR routes', async () => {
    const catalogResponse = await request(app).get('/catalog');
    expect(catalogResponse.status).toBe(200);
    expect(catalogResponse.text).toContain('Каталог домашнего текстиля | Постельное Белье-ЮГ');
    expect(catalogResponse.text).toContain('Сатиновый комплект Sand');
    expect(catalogResponse.text).toContain('href="https://yug-postel.ru/catalog"');
    expect(catalogResponse.text).toContain('itemType="https://schema.org/OfferCatalog"');

    const filteredCatalogResponse = await request(app).get('/catalog?brand=cozy-home&sort=priceAsc&page=2');
    expect(filteredCatalogResponse.status).toBe(200);
    expect(filteredCatalogResponse.text).toContain('noindex,follow');
    expect(filteredCatalogResponse.text).toContain('href="https://yug-postel.ru/catalog"');

    const categoryResponse = await request(app).get('/category/popular');
    expect(categoryResponse.status).toBe(200);
    expect(categoryResponse.text).toContain('Популярное');
    expect(categoryResponse.text).toContain('href="https://yug-postel.ru/category/popular"');

    const productResponse = await request(app).get('/product/prod-satin-sand/satin-sand');
    expect(productResponse.status).toBe(200);
    expect(productResponse.text).toContain('Сатиновый комплект Sand');
    expect(productResponse.text).toContain(
      'href="https://yug-postel.ru/product/prod-satin-sand/satin-sand"'
    );
    expect(productResponse.text).toContain('application/ld+json');
    expect(productResponse.text).toContain('BreadcrumbList');
    expect(productResponse.text).toContain('itemType="https://schema.org/Product"');
    expect(productResponse.text).toContain('itemType="https://schema.org/Offer"');
    expect(productResponse.text).toContain('"kind":"product"');

    const legalInfoResponse = await request(app).get('/info/legal');
    expect(legalInfoResponse.status).toBe(200);
    expect(legalInfoResponse.text).toContain('Юридическая информация');
    expect(legalInfoResponse.text).toContain('href="https://yug-postel.ru/info/legal"');

    const privacyResponse = await request(app).get(
      '/konfidentsialnost-i-zashchita-informatsii'
    );
    expect(privacyResponse.status).toBe(200);
    expect(privacyResponse.text).toContain('Политика обработки персональных данных');
    expect(privacyResponse.text).toContain('ИП Касьянова И.Л.');
    expect(privacyResponse.text).toContain('/legal-assets/list.png');
  });

  it('keeps listing SSR responses inside the raw and compressed budgets', async () => {
    const response = await request(app).get('/category/popular');
    const rawBytes = Buffer.byteLength(response.text, 'utf8');
    const compressedBytes = gzipSync(response.text).byteLength;

    expect(rawBytes).toBeLessThan(750 * 1024);
    expect(compressedBytes).toBeLessThan(150 * 1024);
    expect(response.text).not.toContain('"reviewCount"');
    expect(response.text).not.toContain('/products?');
  });

  it('redirects www and legacy /home routes to the root-path storefront', async () => {
    const wwwRedirect = await request(app)
      .get('/catalog')
      .set('Host', 'www.yug-postel.ru')
      .redirects(0);
    expect(wwwRedirect.status).toBe(301);
    expect(wwwRedirect.headers.location).toBe('https://yug-postel.ru/catalog');

    const legacyRootRedirect = await request(app).get('/home').redirects(0);
    expect(legacyRootRedirect.status).toBe(301);
    expect(legacyRootRedirect.headers.location).toBe('/');

    const legacyNestedRedirect = await request(app)
      .get('/home/category/foo?view=grid')
      .redirects(0);
    expect(legacyNestedRedirect.status).toBe(301);
    expect(legacyNestedRedirect.headers.location).toBe('/category/foo?view=grid');

    const legacySearchRedirect = await request(app)
      .get('/category/search?query=%D0%9F%D0%BB%D0%B5%D0%B4')
      .redirects(0);
    expect(legacySearchRedirect.status).toBe(301);
    expect(legacySearchRedirect.headers.location).toBe('/search?query=%D0%9F%D0%BB%D0%B5%D0%B4');

    const trailingSlashRedirect = await request(app).get('/catalog/').redirects(0);
    expect(trailingSlashRedirect.status).toBe(301);
    expect(trailingSlashRedirect.headers.location).toBe('/catalog');
  });

  it('redirects non-canonical product URLs to the canonical product slug', async () => {
    const shortProductRedirect = await request(app)
      .get('/product/prod-satin-sand')
      .redirects(0);
    expect(shortProductRedirect.status).toBe(301);
    expect(shortProductRedirect.headers.location).toBe('/product/prod-satin-sand/satin-sand');

    const staleProductRedirect = await request(app)
      .get('/product/prod-satin-sand/wrong-slug')
      .redirects(0);
    expect(staleProductRedirect.status).toBe(301);
    expect(staleProductRedirect.headers.location).toBe('/product/prod-satin-sand/satin-sand');
  });

  it('returns CSR shells without embedded route data for private or transactional routes', async () => {
    for (const pathname of ['/search', '/checkout', '/account', '/admin/products']) {
      const response = await request(app).get(pathname);

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.text).toContain('Загружаем страницу…');
      expect(response.text).toContain('"renderMode":"csr"');
      expect(response.text).toContain(pathname === '/search' ? 'noindex,follow' : 'noindex,nofollow');
      expect(response.text).not.toContain('"directory"');
      expect(response.text).not.toContain('"cms"');
      expect(response.text).not.toContain('"kind":"product"');
    }
  });

  it('serves Yandex-first robots.txt and runtime sitemap assets', async () => {
    const robotsResponse = await request(app).get('/robots.txt');
    expect(robotsResponse.status).toBe(200);
    expect(robotsResponse.text).toContain('User-agent: Yandex');
    expect(robotsResponse.text).toContain('Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&ymclid&gclid&fbclid&ref');
    expect(robotsResponse.text).toContain('Sitemap: https://yug-postel.ru/sitemap.xml');
    expect(robotsResponse.text).not.toContain('Disallow: /search');

    const sitemapResponse = await request(app).get('/sitemap.xml');
    expect(sitemapResponse.status).toBe(200);
    expect(sitemapResponse.headers['cache-control']).toBe('no-store');
    expect(sitemapResponse.text).toContain('<loc>https://yug-postel.ru/</loc>');
    expect(sitemapResponse.text).toContain('<loc>https://yug-postel.ru/catalog</loc>');
    expect(sitemapResponse.text).toContain('<loc>https://yug-postel.ru/category/popular</loc>');
    expect(sitemapResponse.text).toContain('<loc>https://yug-postel.ru/product/prod-satin-sand/satin-sand</loc>');
    expect(sitemapResponse.text).not.toContain('/search');
    expect(sitemapResponse.text).not.toContain('/checkout');
  });

  it('renders the not-found route as a 404 response', async () => {
    const response = await request(app).get('/missing-page');

    expect(response.status).toBe(404);
    expect(response.text).toContain('404');
    expect(response.text).toContain('noindex,nofollow');
    expect(response.headers['cache-control']).toBe('no-store');
  });
});

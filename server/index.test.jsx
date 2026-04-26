// @vitest-environment node

import fs from 'node:fs/promises';
import path from 'node:path';
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
      title: 'Обновите спальню без лишней суеты',
      body: '<p>Главная страница управляется через Directus.</p>',
      primaryCtaLabel: 'Смотреть каталог',
      primaryCtaUrl: '/catalog',
      secondaryCtaLabel: 'Доставка',
      secondaryCtaUrl: '/info/delivery',
      styleVariant: 'warm',
      items: [
        {
          title: 'Доставка по России',
          description: 'Стоимость видна до оплаты.',
          sort: 1
        }
      ]
    },
    {
      anchorId: 'home-categories',
      sectionType: 'category_reference_list',
      sort: 2,
      title: 'Быстрый вход в популярные разделы',
      items: [
        {
          title: 'Бестселлеры',
          referenceKind: 'category_slug',
          referenceKey: 'popular',
          sort: 1
        }
      ]
    },
    {
      anchorId: 'home-collection',
      sectionType: 'collection_teaser',
      sort: 3,
      title: 'Выбор для спокойной спальни',
      items: [
        {
          title: 'Подборка для главной',
          referenceKind: 'storefront_collection',
          referenceKey: 'home-bestsellers',
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
  return vi.fn(async (input) => {
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
    expect(response.text).toContain('Обновите спальню без лишней суеты');
    expect(response.text).toContain('Сатиновый комплект Sand');
    expect(response.text).toContain('window.__APP_CONFIG__=');
    expect(response.text).toContain('"siteUrl":"https://yug-postel.ru"');
    expect(response.text).toContain('window.__SSR_DATA__=');
    expect(response.text).toContain('"routeId":"home"');
    expect(response.text).toContain('"directory"');
    expect(response.text).toContain('"collectionsByKey"');
    expect(response.text).toContain('"home-bestsellers"');
  });

  it('renders catalog, category, product, legal info, and legal document SSR routes', async () => {
    const catalogResponse = await request(app).get('/catalog');
    expect(catalogResponse.status).toBe(200);
    expect(catalogResponse.text).toContain('Каталог домашнего текстиля | Постельное Белье-ЮГ');
    expect(catalogResponse.text).toContain('Сатиновый комплект Sand');
    expect(catalogResponse.text).toContain('href="https://yug-postel.ru/catalog"');

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
  });

  it('returns CSR shells without embedded route data for private or transactional routes', async () => {
    for (const pathname of ['/search', '/checkout', '/account', '/admin/products']) {
      const response = await request(app).get(pathname);

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.text).toContain('Загружаем страницу…');
      expect(response.text).toContain('"renderMode":"csr"');
      expect(response.text).not.toContain('"directory"');
      expect(response.text).not.toContain('"cms"');
      expect(response.text).not.toContain('"kind":"product"');
    }
  });

  it('renders the not-found route as a 404 response', async () => {
    const response = await request(app).get('/missing-page');

    expect(response.status).toBe(404);
    expect(response.text).toContain('404');
    expect(response.text).toContain('noindex,nofollow');
    expect(response.headers['cache-control']).toBe('no-store');
  });
});

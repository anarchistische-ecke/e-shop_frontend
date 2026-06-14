// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  buildRobotsTxt,
  buildSitemapEntries,
  renderSitemapXml
} from './seo-assets.mjs';

describe('seo assets', () => {
  it('builds sitemap entries from public canonical URLs only', () => {
    const entries = buildSitemapEntries({
      origin: 'https://yug-postel.ru',
      categories: [{ id: 'popular', slug: 'popular', name: 'Популярное' }],
      products: [
        { id: 'prod-1', slug: 'linen-soft', name: 'Linen Soft', isActive: true },
        { id: 'prod-2', slug: 'hidden', name: 'Hidden', isActive: false }
      ]
    });
    const urls = entries.map((entry) => entry.loc);

    expect(urls).toContain('https://yug-postel.ru/');
    expect(urls).toContain('https://yug-postel.ru/catalog');
    expect(urls).toContain('https://yug-postel.ru/category/popular');
    expect(urls).toContain('https://yug-postel.ru/product/prod-1/linen-soft');
    expect(urls.some((url) => url.includes('/search'))).toBe(false);
    expect(urls.some((url) => url.includes('/checkout'))).toBe(false);
    expect(urls.some((url) => url.includes('/admin'))).toBe(false);
    expect(urls.some((url) => url.includes('hidden'))).toBe(false);
  });

  it('renders valid XML with escaped canonical locations', () => {
    const xml = renderSitemapXml([{ loc: 'https://example.com/catalog?x=1&y=2' }]);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('https://example.com/catalog?x=1&amp;y=2');
  });

  it('builds robots.txt with Yandex Clean-param and sitemap rules', () => {
    const robots = buildRobotsTxt({ origin: 'https://yug-postel.ru' });

    expect(robots).toContain('User-agent: Yandex');
    expect(robots).toContain('Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&ymclid&gclid&fbclid&ref');
    expect(robots).toContain('Sitemap: https://yug-postel.ru/sitemap.xml');
    expect(robots).toContain('Disallow: /admin');
    expect(robots).not.toContain('Disallow: /search');
    expect(robots).not.toContain('Disallow: /cart');
  });
});

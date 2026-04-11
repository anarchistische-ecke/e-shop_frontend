const { test, expect, devices } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.use({
  ...devices['Desktop Chrome'],
  viewport: { width: 1440, height: 960 },
  isMobile: false,
  hasTouch: false
});

test.describe('desktop listing layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockStorefrontApi(page);
  });

  async function measureVerticalRhythm(page, selectors) {
    return page.evaluate(({ header, breadcrumbs, heading, search, filters, results }) => {
      const headerNode = document.querySelector(header);
      const breadcrumbsNode = document.querySelector(breadcrumbs);
      const headingNode = heading ? document.querySelector(heading) : null;
      const searchNode = search ? document.querySelector(search) : null;
      const filtersNode = document.querySelector(filters);
      const resultsNode = results ? document.querySelector(results) : null;

      const headerRect = headerNode?.getBoundingClientRect();
      const breadcrumbsRect = breadcrumbsNode?.getBoundingClientRect();
      const headingRect = headingNode?.getBoundingClientRect();
      const searchRect = searchNode?.getBoundingClientRect();
      const filtersRect = filtersNode?.getBoundingClientRect();
      const resultsRect = resultsNode?.getBoundingClientRect();

      return {
        breadcrumbsGap: (breadcrumbsRect?.top ?? 0) - (headerRect?.bottom ?? 0),
        headingGap: headingRect ? (headingRect.top ?? 0) - (breadcrumbsRect?.bottom ?? 0) : null,
        searchGap: searchRect
          ? (searchRect.top ?? 0) - ((headingRect?.bottom ?? breadcrumbsRect?.bottom) ?? 0)
          : null,
        filtersGap: searchRect
          ? (filtersRect?.top ?? 0) - (searchRect.bottom ?? 0)
          : (filtersRect?.top ?? 0) - ((headingRect?.bottom ?? breadcrumbsRect?.bottom) ?? 0),
        resultsGap: resultsRect ? (resultsRect.top ?? 0) - (filtersRect?.bottom ?? 0) : null
      };
    }, selectors);
  }

  test('category page starts compactly under the fixed header on desktop', async ({ page }) => {
    await page.goto('/category/popular');

    await expect(page.getByTestId('category-breadcrumbs')).toBeVisible();
    await expect(page.getByTestId('category-header')).toBeVisible();
    await expect(page.getByTestId('category-filters-card')).toBeVisible();

    const metrics = await measureVerticalRhythm(page, {
      header: 'header',
      breadcrumbs: '[data-testid="category-breadcrumbs"]',
      heading: '[data-testid="category-header"]',
      filters: '[data-testid="category-filters-card"]',
      results: '[data-testid="category-results"]'
    });

    expect(metrics.breadcrumbsGap).toBeLessThanOrEqual(36);
    expect(metrics.headingGap).toBeLessThanOrEqual(48);
    expect(metrics.filtersGap).toBeLessThanOrEqual(176);
    expect(metrics.resultsGap).toBeLessThanOrEqual(40);
  });

  test('catalog page keeps the summary and filters visually compact on desktop', async ({ page }) => {
    await page.goto('/catalog');

    await expect(page.getByTestId('catalogue-breadcrumbs')).toBeVisible();
    await expect(page.getByTestId('catalogue-header-card')).toHaveCount(0);
    await expect(page.getByTestId('catalogue-filters-card')).toBeVisible();
    await expect(page.getByTestId('catalogue-search-card')).toBeVisible();

    const metrics = await measureVerticalRhythm(page, {
      header: 'header',
      breadcrumbs: '[data-testid="catalogue-breadcrumbs"]',
      search: '[data-testid="catalogue-search-card"]',
      filters: '[data-testid="catalogue-filters-card"]',
      results: '[data-testid="catalogue-results"]'
    });

    expect(metrics.breadcrumbsGap).toBeLessThanOrEqual(36);
    expect(metrics.searchGap).toBeLessThanOrEqual(24);
    expect(metrics.filtersGap).toBeLessThanOrEqual(24);
    expect(metrics.resultsGap).toBeLessThanOrEqual(40);
  });
});

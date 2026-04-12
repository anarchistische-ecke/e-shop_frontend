const { test, expect } = require('@playwright/test');
const {
  buildAppUrl,
  fetchCmsNavigation,
  fetchCmsPage,
  getCmsNavigationPlacement,
  getCmsPageSlug,
  hasLiveCmsBaseUrl,
  normalizeComparablePath,
  pickExpectedPageText,
  pickNavigationItem,
} = require('./support/cmsSmoke');

test.describe('live CMS smoke', () => {
  test.skip(
    !hasLiveCmsBaseUrl(),
    'This smoke suite requires PLAYWRIGHT_BASE_URL so it can run against a live staging environment.'
  );

  test('footer navigation matches the live CMS facade', async ({ page, request }) => {
    const placement = getCmsNavigationPlacement();
    const navigationGroups = await fetchCmsNavigation(request, placement);
    const navigationItem = pickNavigationItem(navigationGroups);

    expect(navigationItem, `No CMS navigation items were returned for placement "${placement}"`).toBeTruthy();

    await page.goto(buildAppUrl('/'));

    const footerGrid = page.getByTestId('site-footer-link-grid');
    await footerGrid.scrollIntoViewIfNeeded();
    await expect(footerGrid).toBeVisible();

    const link = footerGrid.getByRole('link', { name: navigationItem.label }).first();
    await expect(link).toBeVisible();

    const actualHref = await link.getAttribute('href');
    expect(actualHref, `Missing href for CMS footer link "${navigationItem.label}"`).toBeTruthy();

    const expectedHref = navigationItem.url.startsWith('/')
      ? buildAppUrl(navigationItem.url)
      : navigationItem.url;

    expect(normalizeComparablePath(new URL(actualHref, page.url()).toString())).toBe(
      normalizeComparablePath(expectedHref)
    );
  });

  test('configured CMS page loads and renders live CMS content', async ({ page, request }) => {
    const slug = getCmsPageSlug();
    const cmsPage = await fetchCmsPage(request, slug);
    const expectedText = pickExpectedPageText(cmsPage);

    expect(cmsPage.path, `CMS page "${slug}" does not expose a routable path`).toBeTruthy();
    expect(expectedText, `CMS page "${slug}" does not expose any visible text to assert`).toBeTruthy();

    await page.goto(buildAppUrl(cmsPage.path));

    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page).toHaveURL(buildAppUrl(cmsPage.path));
    await expect(page.locator('#main-content')).toContainText(expectedText);
  });
});

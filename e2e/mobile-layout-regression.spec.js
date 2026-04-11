const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

test.beforeEach(async ({ page }) => {
  await mockStorefrontApi(page);
});

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth =
      Math.round(window.visualViewport?.width || 0) || doc?.clientWidth || window.innerWidth;

    return {
      viewportWidth,
      docScrollWidth: doc ? doc.scrollWidth : 0,
      bodyScrollWidth: body ? body.scrollWidth : 0,
      scrollX: window.scrollX,
    };
  });

  expect(Math.max(metrics.docScrollWidth, metrics.bodyScrollWidth)).toBeLessThanOrEqual(
    metrics.viewportWidth + 1
  );
  expect(Math.abs(metrics.scrollX)).toBeLessThanOrEqual(1);
}

async function expectNoOverlaps(locator) {
  const overlap = await locator.evaluate((node) => {
    const children = Array.from(node.children).filter((child) => {
      const style = window.getComputedStyle(child);
      const rect = child.getBoundingClientRect();
      return style.display !== 'none' && rect.width > 0 && rect.height > 0;
    });

    const rects = children.map((child) => child.getBoundingClientRect());
    for (let index = 0; index < rects.length; index += 1) {
      for (let next = index + 1; next < rects.length; next += 1) {
        const first = rects[index];
        const second = rects[next];
        const intersects =
          first.left < second.right &&
          first.right > second.left &&
          first.top < second.bottom &&
          first.bottom > second.top;

        if (intersects) {
          return {
            first: { left: first.left, right: first.right, top: first.top, bottom: first.bottom },
            second: { left: second.left, right: second.right, top: second.top, bottom: second.bottom }
          };
        }
      }
    }

    return null;
  });

  expect(overlap).toBeNull();
}

test('mobile catalog menu takes over the viewport instead of clipping under the header', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Открыть меню' }).click();

  const mobileMenu = page.getByTestId('mobile-nav-panel');
  await expect(mobileMenu).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Меню каталога' })).toBeVisible();

  const panelBox = await mobileMenu.boundingBox();
  const viewport = page.viewportSize();

  expect(panelBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.round(panelBox.x)).toBe(0);
  expect(Math.round(panelBox.width)).toBe(Math.round(viewport.width));
});

test('mobile bottom nav items stay evenly distributed and header avoids redundant shortcuts', async ({ page }) => {
  await page.goto('/');

  const navList = page.getByTestId('bottom-nav-list');
  await expect(navList).toBeVisible();

  const navMetrics = await navList.evaluate((node) => {
    const items = Array.from(node.children).map((child) => {
      const childRect = child.getBoundingClientRect();
      const interactive = child.querySelector('a,button');
      const interactiveRect = interactive?.getBoundingClientRect();
      return {
        width: Math.round(childRect.width),
        left: Math.round(childRect.left),
        right: Math.round(childRect.right),
        interactiveWidth: interactiveRect ? Math.round(interactiveRect.width) : 0
      };
    });

    return {
      widths: items.map((item) => item.width),
      interactiveWidths: items.map((item) => item.interactiveWidth),
      lefts: items.map((item) => item.left),
      rights: items.map((item) => item.right)
    };
  });

  expect(Math.max(...navMetrics.widths) - Math.min(...navMetrics.widths)).toBeLessThanOrEqual(2);
  expect(
    Math.max(...navMetrics.interactiveWidths) - Math.min(...navMetrics.interactiveWidths)
  ).toBeLessThanOrEqual(2);

  for (let index = 1; index < navMetrics.lefts.length; index += 1) {
    expect(navMetrics.lefts[index]).toBeGreaterThanOrEqual(navMetrics.rights[index - 1] - 1);
  }

  const header = page.locator('header').first();
  await expect(header.getByLabel('Корзина')).toBeHidden();
  await expect(header.getByLabel('Войти')).toBeHidden();
  await expect(header.getByText('Весь каталог')).toBeHidden();
});

test('mobile search page controls stay inside the card without overlap', async ({ page }) => {
  await page.goto('/search?query=%D0%9F%D0%BB%D0%B5%D0%B4');

  await expect(page.getByRole('heading', { name: /Найдено/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const searchCard = page.getByTestId('search-page-card');
  await expect(searchCard).toBeVisible();
  await expect(searchCard.getByTestId('search-page-scope-select')).toBeVisible();
  await expectNoOverlaps(page.getByTestId('search-page-controls'));
});

test('core storefront routes fit the mobile viewport without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Обновите спальню/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const homeCarousel = page.locator('[data-carousel-item]').first();
  await expect(homeCarousel).toBeVisible();
  await homeCarousel.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const scroller = document.querySelector('[data-carousel-item]')?.parentElement;
    if (scroller) {
      scroller.scrollLeft = 240;
    }
  });
  await expectNoHorizontalOverflow(page);

  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: 'Подбор текстиля без лишних кликов' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/search?query=%D0%9F%D0%BB%D0%B5%D0%B4');
  await expect(page.getByRole('heading', { name: /Найдено/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/category/popular');
  await expect(page.getByRole('heading', { name: 'Популярное' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/product/prod-satin-sand/satin-sand');
  await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Добавить в корзину' }).click();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Ваши товары для уюта' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Оформить заказ' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: /Быстрое оформление без лишних шагов/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/info/delivery');
  await expect(
    page.getByRole('heading', { name: /Бесплатная доставка при оформлении заказа/i })
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

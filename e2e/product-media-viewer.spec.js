const { test, expect } = require('@playwright/test');
const { mockStorefrontApi } = require('./support/mockStorefrontApi');

async function getPageMetrics(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth =
      Math.round(window.visualViewport?.width || 0) || doc.clientWidth || window.innerWidth;

    return {
      viewportWidth,
      viewportHeight:
        Math.round(window.visualViewport?.height || 0) || doc.clientHeight || window.innerHeight,
      visualViewportScale: window.visualViewport?.scale || 1,
      docScrollWidth: doc.scrollWidth,
      bodyScrollWidth: body.scrollWidth,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      bodyTop: document.body.style.top,
      activeElementLabel: document.activeElement?.getAttribute('aria-label') || '',
    };
  });
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await getPageMetrics(page);

  expect(Math.max(metrics.docScrollWidth, metrics.bodyScrollWidth)).toBeLessThanOrEqual(
    metrics.viewportWidth + 1
  );
  expect(Math.abs(metrics.scrollX)).toBeLessThanOrEqual(1);
}

async function openProductMediaViewer(page) {
  await mockStorefrontApi(page);
  await page.goto('/product/prod-satin-sand');
  await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();

  const gallery = page.getByTestId('product-gallery-card');
  await gallery.scrollIntoViewIfNeeded();
  await expect(gallery).toBeVisible();
  await page.getByRole('button', { name: 'Увеличить изображение' }).click();

  const viewer = page.getByTestId('product-media-viewer');
  await expect(viewer).toBeVisible();
  return viewer;
}

async function dispatchPointer(locator, type, { id = 1, x, y, buttons = 1 } = {}) {
  await locator.dispatchEvent(type, {
    pointerId: id,
    pointerType: 'touch',
    isPrimary: id === 1,
    clientX: x,
    clientY: y,
    button: 0,
    buttons,
    bubbles: true,
    cancelable: true,
  });
}

async function pointerTap(locator, point, id = 1) {
  await dispatchPointer(locator, 'pointerdown', { id, ...point });
  await dispatchPointer(locator, 'pointerup', { id, ...point, buttons: 0 });
}

async function pointerDrag(locator, start, end, id = 1) {
  await dispatchPointer(locator, 'pointerdown', { id, ...start });
  await dispatchPointer(locator, 'pointermove', { id, ...end });
  await dispatchPointer(locator, 'pointerup', { id, ...end, buttons: 0 });
}

async function expectImageScale(page, minimum) {
  await expect
    .poll(async () => {
      const value = await page.getByTestId('product-media-image').getAttribute('data-scale');
      return Number(value || 1);
    })
    .toBeGreaterThan(minimum);
}

test('mobile media viewer fills the viewport and isolates pinch zoom from the page', async ({ page }) => {
  await mockStorefrontApi(page);
  await page.goto('/product/prod-satin-sand');
  await expect(page.getByRole('heading', { name: /Сатиновый комплект Sand/i })).toBeVisible();

  const gallery = page.getByTestId('product-gallery-card');
  await gallery.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 96));

  const before = await getPageMetrics(page);
  await page.getByRole('button', { name: 'Увеличить изображение' }).click();

  const viewer = page.getByTestId('product-media-viewer');
  const stage = page.getByTestId('product-media-stage');
  await expect(viewer).toBeVisible();

  const [viewerBox, viewport] = await Promise.all([viewer.boundingBox(), page.viewportSize()]);
  expect(viewerBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.round(viewerBox.x)).toBe(0);
  expect(Math.round(viewerBox.y)).toBe(0);
  expect(Math.round(viewerBox.width)).toBe(Math.round(viewport.width));
  expect(Math.round(viewerBox.height)).toBe(Math.round(viewport.height));

  const stageBox = await stage.boundingBox();
  const center = {
    x: stageBox.x + stageBox.width / 2,
    y: stageBox.y + stageBox.height / 2,
  };

  await dispatchPointer(stage, 'pointerdown', { id: 1, x: center.x - 40, y: center.y });
  await dispatchPointer(stage, 'pointerdown', { id: 2, x: center.x + 40, y: center.y });
  await dispatchPointer(stage, 'pointermove', { id: 1, x: center.x - 120, y: center.y });
  await dispatchPointer(stage, 'pointermove', { id: 2, x: center.x + 120, y: center.y });
  await dispatchPointer(stage, 'pointerup', { id: 1, x: center.x - 120, y: center.y, buttons: 0 });
  await dispatchPointer(stage, 'pointerup', { id: 2, x: center.x + 120, y: center.y, buttons: 0 });

  await expectImageScale(page, 1.8);
  await pointerDrag(stage, { x: center.x, y: center.y }, { x: center.x + 180, y: center.y + 120 });
  await expectNoHorizontalOverflow(page);

  const during = await getPageMetrics(page);
  expect(during.visualViewportScale).toBe(1);
  expect(during.bodyTop).toBe(`-${before.scrollY}px`);

  await page.getByTestId('product-media-close').click();
  await expect(viewer).toHaveCount(0);

  const after = await getPageMetrics(page);
  expect(after.scrollY).toBe(before.scrollY);
  expect(after.activeElementLabel).toBe('Увеличить изображение');
});

test('mobile media viewer double-tap zooms, clamps pan, and swipes only at base scale', async ({ page }) => {
  const viewer = await openProductMediaViewer(page);
  const stage = page.getByTestId('product-media-stage');
  const counter = page.getByTestId('product-media-counter');
  await expect(counter).toHaveText('1 / 3');

  const stageBox = await stage.boundingBox();
  const center = {
    x: stageBox.x + stageBox.width / 2,
    y: stageBox.y + stageBox.height / 2,
  };

  await pointerTap(stage, center);
  await pointerTap(stage, center);
  await expectImageScale(page, 2);

  await pointerDrag(stage, { x: center.x + 120, y: center.y }, { x: center.x - 140, y: center.y });
  await expect(counter).toHaveText('1 / 3');

  await pointerDrag(stage, { x: center.x, y: center.y }, { x: center.x + 1000, y: center.y + 1000 });
  await expectNoHorizontalOverflow(page);

  await page.getByTestId('product-media-reset').click();
  await expect(page.getByTestId('product-media-image')).toHaveAttribute('data-scale', '1.00');

  await pointerDrag(stage, { x: center.x + 120, y: center.y }, { x: center.x - 120, y: center.y });
  await expect(counter).toHaveText('2 / 3');

  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
});

test.describe('desktop media viewer', () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
  });

  test('centers media in the viewport without the shared modal panel sizing bug', async ({ page }) => {
    await openProductMediaViewer(page);

    await expect(page.locator('.ui-modal__panel')).toHaveCount(0);

    const viewer = page.getByTestId('product-media-viewer');
    const image = page.getByTestId('product-media-image');
    const close = page.getByTestId('product-media-close');
    const [viewerBox, imageBox, closeBox, viewport] = await Promise.all([
      viewer.boundingBox(),
      image.boundingBox(),
      close.boundingBox(),
      page.viewportSize(),
    ]);

    expect(viewerBox).not.toBeNull();
    expect(imageBox).not.toBeNull();
    expect(closeBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(Math.round(viewerBox.width)).toBe(viewport.width);
    expect(Math.round(viewerBox.height)).toBe(viewport.height);
    expect(Math.abs(imageBox.x + imageBox.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(2);
    expect(Math.abs(imageBox.y + imageBox.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(2);
    expect(closeBox.x + closeBox.width).toBeGreaterThan(viewport.width - 90);

    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.mouse.wheel(0, -500);
    await expectImageScale(page, 1.2);
  });
});

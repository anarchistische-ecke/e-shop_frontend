const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const backendRoot = process.env.ESHOP_BACKEND_ROOT || '/Users/freddycooper/Documents/eshop';
const authStatePath =
  process.env.PLAYWRIGHT_STAGING_AUTH_STATE ||
  path.join(repoRoot, 'test-results/.auth/staging-customer.json');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return acc;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    acc[match[1]] = value;
    return acc;
  }, {});
}

const storefrontEnv = readEnvFile(path.join(repoRoot, '.env.local'));
const backendEnv = readEnvFile(path.join(backendRoot, '.env'));

function readSetting(name) {
  return process.env[name] || storefrontEnv[name] || backendEnv[name] || '';
}

function trimTrailingSlash(value = '') {
  return String(value || '').replace(/\/+$/, '');
}

function ensureBaseUrl(value = '') {
  const trimmed = trimTrailingSlash(value);
  return /^https?:\/\//i.test(trimmed) ? trimmed : '';
}

const appBaseUrl = ensureBaseUrl(
  process.env.PLAYWRIGHT_BASE_URL ||
    readSetting('STOREFRONT_PUBLIC_URL') ||
    readSetting('REACT_APP_SITE_URL')
);
const apiBaseUrl = ensureBaseUrl(
  process.env.PLAYWRIGHT_API_BASE_URL ||
    readSetting('REACT_APP_API_BASE') ||
    readSetting('SERVER_API_BASE') ||
    appBaseUrl
);
const keycloakBaseUrl = ensureBaseUrl(readSetting('REACT_APP_KEYCLOAK_URL'));
const keycloakRealm = readSetting('REACT_APP_KEYCLOAK_REALM') || 'cozyhome';

function buildUrl(baseUrl, pathValue = '/') {
  const normalizedPath = String(pathValue || '/').startsWith('/')
    ? String(pathValue || '/')
    : `/${pathValue}`;
  return `${trimTrailingSlash(baseUrl)}${normalizedPath}`;
}

function isKnownProductionUrl(value = '') {
  if (!value) return false;
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === 'yug-postel.ru' || hostname.endsWith('.yug-postel.ru');
  } catch (err) {
    return false;
  }
}

function isProductionTarget() {
  return [appBaseUrl, apiBaseUrl, keycloakBaseUrl].some(isKnownProductionUrl);
}

function paymentSessionIsPresent(payload = {}) {
  const payment = payload.payment || payload;
  return Boolean(payment?.confirmationUrl || payment?.confirmationToken);
}

function parsePostgresJdbcUrl(jdbcUrl = '') {
  const match = String(jdbcUrl).match(/^jdbc:postgresql:\/\/([^/:?]+)(?::(\d+))?\/([^?]+)/);
  if (!match) return null;
  return {
    host: match[1],
    port: match[2] || '5432',
    database: decodeURIComponent(match[3]),
  };
}

function runDockerPsql(sql) {
  const jdbc = parsePostgresJdbcUrl(readSetting('SPRING_DATASOURCE_URL'));
  const username = readSetting('SPRING_DATASOURCE_USERNAME');
  const password = readSetting('SPRING_DATASOURCE_PASSWORD');
  if (!jdbc || !username || !password) {
    return null;
  }

  const hostForDocker =
    jdbc.host === 'localhost' || jdbc.host === '127.0.0.1'
      ? 'host.docker.internal'
      : jdbc.host;
  const postgresUrl =
    `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}` +
    `@${hostForDocker}:${jdbc.port}/${encodeURIComponent(jdbc.database)}`;

  return execFileSync(
    'docker',
    [
      'run',
      '--rm',
      '-e',
      `PGPASSWORD=${password}`,
      'postgres:16-alpine',
      'psql',
      postgresUrl,
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      sql,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

async function openFirstPurchasableProduct(page) {
  await page.goto(buildUrl(appBaseUrl, '/catalog'));
  await expect(page.locator('body')).toBeVisible();

  const productLinks = page.locator('a[href^="/product/"], a[href*="/product/"]');
  const count = Math.min(await productLinks.count(), 8);
  for (let index = 0; index < count; index += 1) {
    const href = await productLinks.nth(index).getAttribute('href');
    if (!href) continue;
    await page.goto(new URL(href, appBaseUrl).toString());
    const addButton = page.getByRole('button', { name: 'Добавить в корзину' }).first();
    if ((await addButton.count()) > 0 && (await addButton.isEnabled().catch(() => false))) {
      return;
    }
  }
  throw new Error('No purchasable product was found in the live catalog.');
}

async function fillCheckout(page) {
  await page.getByLabel(/Электронная почта/i).fill(readSetting('PLAYWRIGHT_STAGING_CUSTOMER_EMAIL') || 'buyer@example.com');
  await page.getByLabel(/^Имя/i).fill('Smoke Customer');
  await page.getByLabel(/^Телефон/i).fill('+79990000000');
  await page.locator('#checkout-form').getByRole('button', { name: 'К адресу' }).click();
  await page.getByLabel(/Домашний адрес/i).fill('Smoke staging address');
  await page.locator('#checkout-form').getByRole('button', { name: 'К подтверждению' }).click();
}

test.describe('staging integration smoke', () => {
  test.skip(
    process.env.PLAYWRIGHT_STAGING_SMOKE !== 'true',
    'Set PLAYWRIGHT_STAGING_SMOKE=true to run the real staging smoke.'
  );
  test.skip(!appBaseUrl || !apiBaseUrl, 'PLAYWRIGHT_BASE_URL and PLAYWRIGHT_API_BASE_URL or .env.local equivalents are required.');

  test('read-only preflight verifies app, API health, Keycloak discovery, and YooKassa public config', async ({ page, request }) => {
    await page.goto(buildUrl(appBaseUrl, '/'));
    await expect(page.locator('#main-content, body')).toBeVisible();

    let healthResponse = null;
    for (const healthPath of ['/actuator/health/readiness', '/actuator/health', '/health']) {
      const response = await request.get(buildUrl(apiBaseUrl, healthPath), { failOnStatusCode: false });
      if (response.ok()) {
        healthResponse = response;
        break;
      }
    }
    expect(healthResponse, 'Expected at least one API health endpoint to respond with 2xx').toBeTruthy();

    if (keycloakBaseUrl) {
      const discovery = await request.get(
        buildUrl(keycloakBaseUrl, `/realms/${encodeURIComponent(keycloakRealm)}/.well-known/openid-configuration`),
        { failOnStatusCode: false }
      );
      expect(discovery.ok(), 'Expected Keycloak issuer discovery to succeed').toBeTruthy();
    }

    const paymentConfigResponse = await request.get(buildUrl(apiBaseUrl, '/payments/public-config'));
    expect(paymentConfigResponse.ok(), 'Expected YooKassa public config request to succeed').toBeTruthy();
    const paymentConfig = await paymentConfigResponse.json();
    expect(paymentConfig.enabled, 'Expected YooKassa public config to be enabled').toBeTruthy();
    expect(paymentConfig.providerCode || paymentConfig.providerName).toBeTruthy();
  });

  test('DB migration 202606270900 and RMA item schema are present when DB access is available', async () => {
    test.skip(
      !readSetting('SPRING_DATASOURCE_URL') ||
        !readSetting('SPRING_DATASOURCE_USERNAME') ||
        !readSetting('SPRING_DATASOURCE_PASSWORD'),
      'Direct DB credentials are not available; schema verification is skipped.'
    );

    const output = runDockerPsql(`
      SELECT
        EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '202606270900' AND success = true),
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rma_request_item'),
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variant' AND column_name = 'color_code'),
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variant' AND column_name = 'size_code');
    `);
    expect(output).toBeTruthy();
    expect(output.trim()).toBe('t|t|t|t');
  });

  test('customer can wishlist, checkout, and create a payment session without card entry', async ({ page }) => {
    test.skip(isProductionTarget(), 'Production target detected; destructive staging smoke is blocked.');
    test.skip(!fs.existsSync(authStatePath), 'Manual Keycloak auth state is required at test-results/.auth/staging-customer.json.');

    await openFirstPurchasableProduct(page);
    const productHeading = page.locator('h1').first();
    const productName = (await productHeading.textContent())?.trim() || '';

    const wishlistButton = page.getByRole('button', { name: 'Добавить в избранное' }).first();
    if ((await wishlistButton.count()) > 0) {
      await wishlistButton.click();
      await page.goto(buildUrl(appBaseUrl, '/favorites'));
      if (productName) {
        await expect(page.locator('#main-content, body')).toContainText(productName);
      }
    }

    await openFirstPurchasableProduct(page);
    await page.getByRole('button', { name: 'Добавить в корзину' }).first().click();
    await page.goto(buildUrl(appBaseUrl, '/cart'));
    await page.getByRole('button', { name: 'Оформить заказ' }).click();
    await fillCheckout(page);

    const checkoutResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/orders/checkout') && response.request().method() === 'POST'
    );
    await page.locator('#checkout-form').getByRole('button', { name: /Создать заказ/ }).click();
    const checkoutResponse = await checkoutResponsePromise;
    expect(checkoutResponse.ok(), 'Expected checkout request to succeed').toBeTruthy();
    const checkoutPayload = await checkoutResponse.json();
    const publicToken = checkoutPayload?.order?.publicToken;
    expect(publicToken, 'Expected checkout response to include an order public token').toBeTruthy();
    expect(paymentSessionIsPresent(checkoutPayload), 'Expected checkout response to include YooKassa confirmation data').toBeTruthy();

    await page.goto(buildUrl(appBaseUrl, `/pay/${publicToken}`));
    await expect(page.getByRole('heading', { name: 'Оплата заказа' })).toBeVisible();
    const payResponsePromise = page.waitForResponse(
      (response) => response.url().includes(`/orders/public/${publicToken}/pay`) && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /Оплатить|Открыть оплату|Продолжить оплату/i }).first().click();
    const payResponse = await payResponsePromise;
    expect(payResponse.ok(), 'Expected public pay request to succeed').toBeTruthy();
    expect(paymentSessionIsPresent(await payResponse.json()), 'Expected /pay/:token to create a YooKassa confirmation session').toBeTruthy();
  });

  test('account reorder and RMA creation work for an existing returnable customer order', async ({ page }) => {
    test.skip(isProductionTarget(), 'Production target detected; destructive staging smoke is blocked.');
    test.skip(!fs.existsSync(authStatePath), 'Manual Keycloak auth state is required at test-results/.auth/staging-customer.json.');

    await page.goto(buildUrl(appBaseUrl, '/account#orders'));
    await expect(page.getByRole('heading', { name: 'Мои заказы' })).toBeVisible();

    const reorderButton = page.getByRole('button', { name: 'Повторить заказ' }).first();
    test.skip((await reorderButton.count()) === 0, 'No existing customer order is available for reorder smoke.');
    await reorderButton.click();
    await expect(page.getByText('Товары добавлены в корзину')).toBeVisible();

    const rmaButton = page.getByRole('button', { name: /Возврат|Оформить возврат/ }).first();
    test.skip((await rmaButton.count()) === 0, 'No existing returnable customer order is available for RMA smoke.');
    await rmaButton.click();
    await expect(page.getByRole('dialog', { name: 'Заявка на возврат' })).toBeVisible();

    const firstItem = page.getByRole('checkbox').first();
    test.skip((await firstItem.count()) === 0, 'The selected returnable order has no RMA-selectable items.');
    await firstItem.check();
    await page.getByLabel('Причина').fill('Staging smoke RMA request');
    await page.getByLabel('Желаемое решение').selectOption('Связаться со мной');
    await page.getByRole('button', { name: 'Отправить заявку' }).click();
    await expect(page.getByText('Заявка на возврат создана')).toBeVisible();
  });
});

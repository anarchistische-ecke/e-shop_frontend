function encodeBase64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createAdminToken(overrides = {}) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 'admin-e2e-user',
    preferred_username: 'admin@example.com',
    email: 'admin@example.com',
    email_verified: true,
    acr: '1',
    roles: ['admin'],
    realm_access: { roles: ['admin'] },
    iat: issuedAt,
    exp: issuedAt + 60 * 60,
    ...overrides
  };

  return [
    encodeBase64Url({ alg: 'HS256', typ: 'JWT' }),
    encodeBase64Url(payload),
    'signature'
  ].join('.');
}

async function seedAdminSession(page, overrides = {}) {
  const token = createAdminToken(overrides);
  await page.addInitScript((authToken) => {
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem('authProfile');
    window.sessionStorage.setItem('authToken', authToken);
  }, token);
  return token;
}

function fulfillJson(route, payload, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload)
  });
}

async function mockAdminApi(page, overrides = {}) {
  const brands = overrides.brands || [
    {
      id: 'brand-e2e-1',
      name: 'KAZANOV.A.',
      slug: 'kazanova',
      description: 'Тестовый бренд для проверки админки'
    }
  ];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;
    const method = request.method();

    if (pathname === '/brands' && method === 'GET') {
      return fulfillJson(route, brands);
    }

    return route.continue();
  });
}

module.exports = {
  mockAdminApi,
  seedAdminSession
};

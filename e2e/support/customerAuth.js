function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createCustomerToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  return [
    base64Url({ alg: 'none', typ: 'JWT' }),
    base64Url({
      sub: 'customer-e2e-1',
      email: 'buyer@example.com',
      name: 'Иван Петров',
      given_name: 'Иван',
      family_name: 'Петров',
      preferred_username: 'buyer@example.com',
      realm_access: { roles: ['customer'] },
      email_verified: true,
      exp: now + 3600,
      ...overrides,
    }),
    'signature',
  ].join('.');
}

async function seedCustomerSession(page, { tokenOverrides = {}, profile = {} } = {}) {
  const token = createCustomerToken(tokenOverrides);
  const storedProfile = {
    id: 'customer-e2e-1',
    firstName: 'Иван',
    lastName: 'Петров',
    email: 'buyer@example.com',
    phone: '+79990000000',
    ...profile,
  };

  await page.addInitScript(
    ({ authToken, authProfile }) => {
      window.sessionStorage.setItem('authToken', authToken);
      window.sessionStorage.setItem('authProfile', JSON.stringify(authProfile));
    },
    { authToken: token, authProfile: storedProfile }
  );

  return { token, profile: storedProfile };
}

module.exports = {
  createCustomerToken,
  seedCustomerSession,
};

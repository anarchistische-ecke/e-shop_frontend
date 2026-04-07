jest.mock('./keycloak', () => ({
  getAccessToken: jest.fn(),
  isKeycloakConfigured: jest.fn()
}));

import {
  clearAllAuthStorage,
  getAccessToken as getSessionAccessToken,
  getStoredProfile,
  setSession
} from './session';
import {
  getAccessToken as getKeycloakAccessToken,
  isKeycloakConfigured
} from './keycloak';

function createToken(payload = {}) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: 'user-1',
      ...payload
    }),
    'signature'
  ].join('.');
}

describe('auth session storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAllAuthStorage();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('stores session data outside localStorage when Keycloak is configured', () => {
    isKeycloakConfigured.mockReturnValue(true);

    setSession({
      token: createToken(),
      profile: { email: 'buyer@example.com' }
    });

    expect(window.localStorage.getItem('authToken')).toBeNull();
    expect(window.localStorage.getItem('authProfile')).toBeNull();
    expect(window.sessionStorage.getItem('authToken')).toBeNull();
    expect(window.sessionStorage.getItem('authProfile')).toBe(
      JSON.stringify({ email: 'buyer@example.com' })
    );
  });

  it('falls back to sessionStorage token when Keycloak is disabled', async () => {
    const token = createToken({ preferred_username: 'buyer@example.com' });
    isKeycloakConfigured.mockReturnValue(false);

    setSession({ token });

    expect(window.localStorage.getItem('authToken')).toBeNull();
    expect(window.sessionStorage.getItem('authToken')).toBe(token);
    await expect(getSessionAccessToken()).resolves.toBe(token);
  });

  it('prefers the live Keycloak token and clears stale stored fallback tokens', async () => {
    const storedToken = createToken({ preferred_username: 'legacy@example.com' });
    const keycloakToken = createToken({ preferred_username: 'keycloak@example.com' });

    isKeycloakConfigured.mockReturnValue(true);
    getKeycloakAccessToken.mockResolvedValue(keycloakToken);
    window.sessionStorage.setItem('authToken', storedToken);

    await expect(getSessionAccessToken()).resolves.toBe(keycloakToken);
    expect(window.sessionStorage.getItem('authToken')).toBeNull();
  });

  it('migrates legacy localStorage profile data into sessionStorage', () => {
    window.localStorage.setItem('authProfile', JSON.stringify({ email: 'legacy@example.com' }));

    expect(getStoredProfile()).toEqual({ email: 'legacy@example.com' });
    expect(window.localStorage.getItem('authProfile')).toBeNull();
    expect(window.sessionStorage.getItem('authProfile')).toBe(
      JSON.stringify({ email: 'legacy@example.com' })
    );
  });
});

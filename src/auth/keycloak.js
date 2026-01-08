import Keycloak from 'keycloak-js';
import { notifyAuthChange } from '../utils/auth';

const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL,
  realm: process.env.REACT_APP_KEYCLOAK_REALM,
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID
};

const isConfigValid = () =>
  Boolean(keycloakConfig.url && keycloakConfig.realm && keycloakConfig.clientId);

let keycloakInstance = null;
let initPromise = null;

export function isKeycloakConfigured() {
  return isConfigValid();
}

export function getKeycloak() {
  return keycloakInstance;
}

export async function initKeycloak() {
  if (!isConfigValid()) {
    console.warn(
      'Keycloak config is missing. Set REACT_APP_KEYCLOAK_URL, REACT_APP_KEYCLOAK_REALM, REACT_APP_KEYCLOAK_CLIENT_ID.'
    );
    return null;
  }

  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
    keycloakInstance.onAuthSuccess = () => {
      notifyAuthChange({ type: 'user', action: 'login' });
    };
    keycloakInstance.onAuthLogout = () => {
      notifyAuthChange({ type: 'user', action: 'logout' });
    };
    keycloakInstance.onAuthRefreshSuccess = () => {
      notifyAuthChange({ type: 'user', action: 'refresh' });
    };
    keycloakInstance.onAuthError = (err) => {
      console.error('Keycloak auth error', err);
      notifyAuthChange({ type: 'user', action: 'error' });
    };
    keycloakInstance.onTokenExpired = () => {
      keycloakInstance
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            notifyAuthChange({ type: 'user', action: 'refresh' });
          }
        })
        .catch((err) => {
          console.warn('Keycloak token refresh failed', err);
          keycloakInstance.clearToken();
          notifyAuthChange({ type: 'user', action: 'expired' });
        });
    };
  }

  if (!initPromise) {
    initPromise = keycloakInstance
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri:
          typeof window !== 'undefined'
            ? `${window.location.origin}/silent-check-sso.html`
            : undefined,
        checkLoginIframe: false
      })
      .then(() => keycloakInstance)
      .catch((err) => {
        console.error('Keycloak init failed', err);
        return keycloakInstance;
      });
  }

  return initPromise;
}

export async function getAccessToken() {
  const kc = await initKeycloak();
  if (!kc || !kc.authenticated) return null;
  try {
    await kc.updateToken(30);
  } catch (err) {
    console.warn('Keycloak token update failed', err);
  }
  return kc.token || null;
}

export async function login(options = {}) {
  const kc = await initKeycloak();
  if (!kc) {
    throw new Error('Keycloak is not configured');
  }
  return kc.login(options);
}

export async function logout(options = {}) {
  const kc = await initKeycloak();
  if (!kc) {
    throw new Error('Keycloak is not configured');
  }
  return kc.logout(options);
}

export function clearToken(detail = { type: 'user', action: 'logout' }) {
  if (!keycloakInstance) return;
  keycloakInstance.clearToken();
  notifyAuthChange(detail);
}

export function hasRole(role, { clientId } = {}) {
  if (!keycloakInstance || !keycloakInstance.authenticated) return false;
  if (clientId) {
    return keycloakInstance.hasResourceRole(role, clientId);
  }
  return keycloakInstance.hasRealmRole(role);
}

export function getTokenParsed() {
  return keycloakInstance ? keycloakInstance.tokenParsed : null;
}

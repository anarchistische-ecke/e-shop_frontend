import { notifyAuthChange } from '../utils/auth';
import { getAccessToken as getKeycloakAccessToken, isKeycloakConfigured } from './keycloak';

const TOKEN_KEY = 'authToken';
const PROFILE_KEY = 'authProfile';
const LEGACY_TOKEN_KEYS = ['adminToken', 'userToken'];
const memorySession = new Map();

const getStorage = (kind) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window[kind] || null;
  } catch (err) {
    return null;
  }
};

const readStorageItem = (storage, key) => {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (err) {
    return null;
  }
};

const writeStorageItem = (storage, key, value) => {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (err) {
    return false;
  }
};

const removeStorageItem = (storage, key) => {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch (err) {
  }
};

const getSessionStorage = () => getStorage('sessionStorage');
const getLegacyStorage = () => getStorage('localStorage');

const readSessionValue = (key) => {
  const sessionValue = readStorageItem(getSessionStorage(), key);
  if (sessionValue !== null) {
    return sessionValue;
  }

  return memorySession.has(key) ? memorySession.get(key) : null;
};

const persistSessionValue = (key, value) => {
  const sessionStorage = getSessionStorage();
  const didPersist = writeStorageItem(sessionStorage, key, value);
  if (!didPersist) {
    memorySession.set(key, value);
  } else {
    memorySession.delete(key);
  }
  removeStorageItem(getLegacyStorage(), key);
};

const removeStoredValue = (key) => {
  removeStorageItem(getSessionStorage(), key);
  removeStorageItem(getLegacyStorage(), key);
  memorySession.delete(key);
};

const readStoredValue = (key) => {
  const sessionValue = readSessionValue(key);
  if (sessionValue !== null) {
    return sessionValue;
  }

  const legacyValue = readStorageItem(getLegacyStorage(), key);
  if (legacyValue === null) {
    return null;
  }

  persistSessionValue(key, legacyValue);
  return legacyValue;
};

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
};

const decodeBase64Url = (value) => {
  if (!value) return null;
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      const decoded = window.atob(padded);
      return decodeURIComponent(
        Array.from(decoded, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
      );
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(padded, 'base64').toString('utf-8');
    }
  } catch (err) {
    return null;
  }
  return null;
};

export const parseJwtPayload = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const decoded = decodeBase64Url(parts[1]);
  return safeJsonParse(decoded);
};

export const getStoredProfile = () => {
  return safeJsonParse(readStoredValue(PROFILE_KEY));
};

const normalizeToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  const trimmed = token.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
  return trimmed;
};

const isTokenValid = (token) => {
  const normalized = normalizeToken(token);
  if (!normalized) return false;
  if (normalized.split('.').length !== 3) return false;
  const payload = parseJwtPayload(normalized);
  if (!payload) return false;
  if (payload.exp && Date.now() >= payload.exp * 1000) return false;
  return true;
};

const clearStoredToken = () => {
  removeStoredValue(TOKEN_KEY);
};

export const getStoredToken = () => {
  const token = normalizeToken(readStoredValue(TOKEN_KEY));
  if (isTokenValid(token)) return token;
  clearStoredToken();
  return null;
};

export const setSession = ({ token, profile } = {}) => {
  if (token && !isKeycloakConfigured()) {
    persistSessionValue(TOKEN_KEY, token);
  } else if (token !== undefined) {
    clearStoredToken();
  }

  if (profile === null) {
    removeStoredValue(PROFILE_KEY);
  } else if (profile) {
    persistSessionValue(PROFILE_KEY, JSON.stringify(profile));
  }

  notifyAuthChange({ type: 'session', action: 'login' });
};

export const clearSession = () => {
  clearStoredToken();
  removeStoredValue(PROFILE_KEY);
  notifyAuthChange({ type: 'session', action: 'logout' });
};

export const clearLegacyAuthStorage = () => {
  const sessionStorage = getSessionStorage();
  const legacyStorage = getLegacyStorage();

  LEGACY_TOKEN_KEYS.forEach((key) => {
    removeStorageItem(sessionStorage, key);
    removeStorageItem(legacyStorage, key);
    memorySession.delete(key);
  });
};

export const clearAllAuthStorage = () => {
  clearLegacyAuthStorage();
  clearSession();
};

export const getAccessToken = async () => {
  if (typeof window !== 'undefined' && isKeycloakConfigured()) {
    clearStoredToken();
    try {
      const keycloakToken = await getKeycloakAccessToken();
      if (isTokenValid(keycloakToken)) return keycloakToken;
    } catch (err) {
      console.warn('Failed to read Keycloak token', err);
    }
    return null;
  }

  return getStoredToken();
};

export const buildTokenProfile = ({ profile, payload }) => {
  if (!profile && !payload) return null;
  const firstName = profile?.firstName || payload?.given_name || '';
  const lastName = profile?.lastName || payload?.family_name || '';
  const name = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    : payload?.name || '';
  return {
    email: profile?.email || payload?.email || payload?.sub || '',
    preferred_username: payload?.preferred_username || profile?.email || payload?.sub || '',
    given_name: firstName,
    family_name: lastName,
    name: name || [firstName, lastName].filter(Boolean).join(' '),
    phone_number: profile?.phone || payload?.phone || payload?.phone_number || '',
    role: payload?.role || payload?.roles || payload?.realm_access?.roles
  };
};

import { notifyAuthChange } from '../utils/auth';
import { getAccessToken as getKeycloakAccessToken, isKeycloakConfigured } from './keycloak';

const TOKEN_KEY = 'authToken';
const PROFILE_KEY = 'authProfile';
const LEGACY_TOKEN_KEYS = ['adminToken', 'userToken'];

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage || null;
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
  const storage = getStorage();
  return safeJsonParse(storage ? storage.getItem(PROFILE_KEY) : null);
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

export const getStoredToken = () => {
  const storage = getStorage();
  const token = normalizeToken(storage ? storage.getItem(TOKEN_KEY) : null);
  if (isTokenValid(token)) return token;
  if (storage) {
    storage.removeItem(TOKEN_KEY);
  }
  return null;
};

export const setSession = ({ token, profile } = {}) => {
  const storage = getStorage();
  if (token) {
    storage?.setItem(TOKEN_KEY, token);
  }
  if (profile === null) {
    storage?.removeItem(PROFILE_KEY);
  } else if (profile) {
    storage?.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
  notifyAuthChange({ type: 'session', action: 'login' });
};

export const clearSession = () => {
  const storage = getStorage();
  storage?.removeItem(TOKEN_KEY);
  storage?.removeItem(PROFILE_KEY);
  notifyAuthChange({ type: 'session', action: 'logout' });
};

export const clearLegacyAuthStorage = () => {
  const storage = getStorage();
  if (!storage) return;
  LEGACY_TOKEN_KEYS.forEach((key) => storage.removeItem(key));
};

export const clearAllAuthStorage = () => {
  clearLegacyAuthStorage();
  clearSession();
};

export const getAccessToken = async () => {
  if (typeof window !== 'undefined' && isKeycloakConfigured()) {
    try {
      const keycloakToken = await getKeycloakAccessToken();
      if (isTokenValid(keycloakToken)) return keycloakToken;
    } catch (err) {
      console.warn('Failed to read Keycloak token', err);
    }
  }
  return null;
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

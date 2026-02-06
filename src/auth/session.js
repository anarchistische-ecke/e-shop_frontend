import { notifyAuthChange } from '../utils/auth';
import { getAccessToken as getKeycloakAccessToken, isKeycloakConfigured } from './keycloak';

const TOKEN_KEY = 'authToken';
const PROFILE_KEY = 'authProfile';

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

export const getStoredProfile = () => safeJsonParse(localStorage.getItem(PROFILE_KEY));

export const getStoredToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;
  const legacyToken = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
  if (legacyToken) {
    localStorage.setItem(TOKEN_KEY, legacyToken);
  }
  return legacyToken;
};

export const setSession = ({ token, profile } = {}) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (profile === null) {
    localStorage.removeItem(PROFILE_KEY);
  } else if (profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
  notifyAuthChange({ type: 'session', action: 'login' });
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
  notifyAuthChange({ type: 'session', action: 'logout' });
};

export const getAccessToken = async () => {
  if (typeof window !== 'undefined' && isKeycloakConfigured()) {
    try {
      const keycloakToken = await getKeycloakAccessToken();
      if (keycloakToken) return keycloakToken;
    } catch (err) {
      console.warn('Failed to read Keycloak token', err);
    }
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem(TOKEN_KEY);
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

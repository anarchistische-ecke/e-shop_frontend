import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCustomerProfile } from '../api';
import { subscribeToAuthChanges } from '../utils/auth';
import {
  buildTokenProfile,
  clearSession,
  getAccessToken,
  getStoredProfile,
  parseJwtPayload,
  setSession
} from '../auth/session';
import { isKeycloakConfigured, logout as keycloakLogout } from '../auth/keycloak';

const AuthContext = createContext({
  isReady: false,
  isAuthenticated: false,
  tokenParsed: null,
  profile: null,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  hasRole: () => false,
  hasStrongAuth: () => false,
  refreshProfile: () => Promise.resolve()
});

const normalizeRole = (role) => {
  if (!role) return '';
  if (role.startsWith('ROLE_')) return role;
  return `ROLE_${role.toUpperCase()}`;
};

const isEmailVerified = (payload) => payload?.email_verified === true;

const hasMfa = (payload) => {
  if (!payload) return false;
  const acr = payload.acr;
  if (typeof acr === 'string' && acr.trim() && acr !== '0') {
    return true;
  }
  const amrValues = Array.isArray(payload.amr) ? payload.amr : [];
  const knownMfaMethods = new Set(['mfa', 'otp', 'totp', 'webauthn', 'hwk', 'sms']);
  return amrValues.some((method) => knownMfaMethods.has(String(method || '').toLowerCase()));
};

const collectRoles = (payload, { clientId } = {}) => {
  const roles = new Set();
  if (!payload) return roles;
  if (payload.role) roles.add(normalizeRole(payload.role));
  if (Array.isArray(payload.roles)) {
    payload.roles.forEach((entry) => roles.add(normalizeRole(entry)));
  }
  if (Array.isArray(payload?.realm_access?.roles)) {
    payload.realm_access.roles.forEach((entry) => roles.add(normalizeRole(entry)));
  }
  if (clientId && payload?.resource_access?.[clientId]?.roles) {
    payload.resource_access[clientId].roles.forEach((entry) => roles.add(normalizeRole(entry)));
  }
  return roles;
};

const resolveBasePath = () => {
  const raw = process.env.REACT_APP_BASENAME || process.env.PUBLIC_URL || '';
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) {
    try {
      const path = new URL(raw).pathname.replace(/\/$/, '');
      return path === '/' ? '' : path;
    } catch (err) {
      return '';
    }
  }
  const normalized = raw.replace(/\/$/, '');
  return normalized === '/' ? '' : normalized;
};

const buildRedirectUri = (path) => {
  if (typeof window === 'undefined') return undefined;
  const base = resolveBasePath();
  return `${window.location.origin}${base}${path}`;
};

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [tokenPayload, setTokenPayload] = useState(null);
  const [profile, setProfile] = useState(null);

  const syncState = useCallback(async () => {
    const token = await getAccessToken();
    const payload = token ? parseJwtPayload(token) : null;
    const exp = payload?.exp ? payload.exp * 1000 : null;
    if (exp && Date.now() >= exp) {
      clearSession();
      setTokenPayload(null);
      setProfile(null);
      setIsReady(true);
      return;
    }
    setTokenPayload(payload);
    setProfile(getStoredProfile());
    setIsReady(true);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return null;
    const payload = parseJwtPayload(token);
    const roles = collectRoles(payload);
    if (!roles.has('ROLE_CUSTOMER')) {
      return null;
    }
    const data = await getCustomerProfile();
    if (data) {
      setSession({ token, profile: data });
    }
    return data;
  }, []);

  useEffect(() => {
    syncState();
  }, [syncState]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(() => {
      syncState();
    });
    return unsubscribe;
  }, [syncState]);

  useEffect(() => {
    if (!tokenPayload || profile) return;
    refreshProfile().catch((err) => console.warn('Failed to refresh profile', err));
  }, [tokenPayload, profile, refreshProfile]);

  const login = useCallback(async ({ token, profile: nextProfile } = {}) => {
    if (!token) return;
    setSession({ token, profile: nextProfile || null });
    await syncState();
    return token;
  }, [syncState]);

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined' && isKeycloakConfigured()) {
      try {
        await keycloakLogout({ redirectUri: buildRedirectUri('/') });
        return;
      } catch (err) {
        console.warn('Keycloak logout failed, falling back to local logout', err);
      }
    }
    clearSession();
    await syncState();
  }, [syncState]);

  const hasRole = useCallback(
    (role, { clientId } = {}) => {
      if (!tokenPayload || !role) return false;
      const normalized = normalizeRole(role);
      const roles = collectRoles(tokenPayload, { clientId });
      return roles.has(normalized);
    },
    [tokenPayload]
  );

  const hasStrongAuth = useCallback(() => {
    return isEmailVerified(tokenPayload) && hasMfa(tokenPayload);
  }, [tokenPayload]);

  const tokenParsed = useMemo(
    () => buildTokenProfile({ profile, payload: tokenPayload }),
    [profile, tokenPayload]
  );

  const value = useMemo(
    () => ({
      isReady,
      isAuthenticated: Boolean(tokenPayload),
      tokenParsed,
      profile,
      login,
      logout,
      hasRole,
      hasStrongAuth,
      refreshProfile
    }),
    [isReady, tokenPayload, tokenParsed, profile, login, logout, hasRole, hasStrongAuth, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

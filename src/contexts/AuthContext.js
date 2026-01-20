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

const AuthContext = createContext({
  isReady: false,
  isAuthenticated: false,
  tokenParsed: null,
  profile: null,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  hasRole: () => false,
  refreshProfile: () => Promise.resolve()
});

const normalizeRole = (role) => {
  if (!role) return '';
  if (role.startsWith('ROLE_')) return role;
  return `ROLE_${role.toUpperCase()}`;
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

  const refreshProfile = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return null;
    const payload = parseJwtPayload(token);
    const roles = new Set();
    if (payload?.role) roles.add(normalizeRole(payload.role));
    if (Array.isArray(payload?.roles)) {
      payload.roles.forEach((role) => roles.add(normalizeRole(role)));
    }
    if (payload?.realm_access?.roles) {
      payload.realm_access.roles.forEach((role) => roles.add(normalizeRole(role)));
    }
    if (!roles.has('ROLE_CUSTOMER')) {
      return null;
    }
    const data = await getCustomerProfile();
    if (data) {
      setSession({ token, profile: data });
    }
    return data;
  }, []);

  const login = useCallback(async ({ token, profile: nextProfile } = {}) => {
    if (!token) return;
    setSession({ token, profile: nextProfile || null });
    await syncState();
    return token;
  }, [syncState]);

  const logout = useCallback(async () => {
    clearSession();
    await syncState();
  }, [syncState]);

  const hasRole = useCallback(
    (role) => {
      if (!tokenPayload || !role) return false;
      const normalized = normalizeRole(role);
      const roles = new Set();
      if (tokenPayload.role) roles.add(normalizeRole(tokenPayload.role));
      if (Array.isArray(tokenPayload.roles)) {
        tokenPayload.roles.forEach((entry) => roles.add(normalizeRole(entry)));
      }
      if (tokenPayload.realm_access?.roles) {
        tokenPayload.realm_access.roles.forEach((entry) => roles.add(normalizeRole(entry)));
      }
      if (tokenPayload.resource_access) {
        Object.values(tokenPayload.resource_access).forEach((clientAccess) => {
          if (clientAccess?.roles) {
            clientAccess.roles.forEach((entry) => roles.add(normalizeRole(entry)));
          }
        });
      }
      return roles.has(normalized);
    },
    [tokenPayload]
  );

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
      refreshProfile
    }),
    [isReady, tokenPayload, tokenParsed, profile, login, logout, hasRole, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

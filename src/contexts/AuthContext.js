import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getKeycloak,
  hasRole as keycloakHasRole,
  initKeycloak,
  isKeycloakConfigured,
  login as keycloakLogin,
  logout as keycloakLogout
} from '../auth/keycloak';
import { subscribeToAuthChanges } from '../utils/auth';

const AuthContext = createContext({
  isReady: false,
  isAuthenticated: false,
  tokenParsed: null,
  isConfigured: true,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  hasRole: () => false
});

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenParsed, setTokenParsed] = useState(null);
  const [isConfigured, setIsConfigured] = useState(isKeycloakConfigured());

  const syncState = useCallback((kc) => {
    setIsConfigured(isKeycloakConfigured());
    if (!kc) {
      setIsAuthenticated(false);
      setTokenParsed(null);
      setIsReady(true);
      return;
    }
    setIsAuthenticated(Boolean(kc.authenticated));
    setTokenParsed(kc.tokenParsed || null);
    setIsReady(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    initKeycloak().then((kc) => {
      if (!mounted) return;
      syncState(kc);
    });
    return () => {
      mounted = false;
    };
  }, [syncState]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(() => {
      syncState(getKeycloak());
    });
    return unsubscribe;
  }, [syncState]);

  const login = useCallback((options) => keycloakLogin(options), []);
  const logout = useCallback((options) => keycloakLogout(options), []);
  const hasRole = useCallback((role, options) => keycloakHasRole(role, options), []);

  const value = useMemo(
    () => ({
      isReady,
      isAuthenticated,
      tokenParsed,
      isConfigured,
      login,
      logout,
      hasRole
    }),
    [isReady, isAuthenticated, tokenParsed, isConfigured, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

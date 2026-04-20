import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { readEnv } from '../config/runtime';

function RequireAdmin({ children }) {
  const location = useLocation();
  const { isReady, isAuthenticated, hasRole, hasStrongAuth } = useAuth();
  const adminRole = readEnv('REACT_APP_KEYCLOAK_ADMIN_ROLE', 'admin') || 'admin';
  const adminRoleClient = readEnv('REACT_APP_KEYCLOAK_ADMIN_ROLE_CLIENT') || '';
  const isAdmin = isAuthenticated && (adminRoleClient
    ? hasRole(adminRole, { clientId: adminRoleClient })
    : hasRole(adminRole));
  const isStrongSession = isAuthenticated && hasStrongAuth();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  if (!isAdmin || !isStrongSession) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default RequireAdmin;

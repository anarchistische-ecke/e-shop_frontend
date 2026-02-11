import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function RequireAdmin({ children }) {
  const location = useLocation();
  const { isReady, isAuthenticated, hasRole, hasStrongAuth } = useAuth();
  const adminRole = process.env.REACT_APP_KEYCLOAK_ADMIN_ROLE || 'admin';
  const adminRoleClient = process.env.REACT_APP_KEYCLOAK_ADMIN_ROLE_CLIENT || '';
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

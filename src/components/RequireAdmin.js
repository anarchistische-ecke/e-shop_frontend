import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * RequireAdmin checks whether the admin user is authenticated by examining the presence of a JWT token.
 * If no admin token is found, the user is redirected to the admin login page.
 */
function RequireAdmin({ children }) {
  const location = useLocation();
  const isAuth = typeof window !== 'undefined' && localStorage.getItem('adminToken');
  if (!isAuth) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export default RequireAdmin;
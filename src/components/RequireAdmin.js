import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * RequireAdmin checks whether the admin user is authenticated by
 * examining a flag in localStorage.  If the flag is missing the user
 * is redirected to the admin login page.  When authentication is
 * implemented on the server this check should instead query your
 * authentication context or decode a JWT.
 */
function RequireAdmin({ children }) {
  const location = useLocation();
  const isAuth = typeof window !== 'undefined' && localStorage.getItem('adminAuth') === 'true';
  if (!isAuth) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export default RequireAdmin;
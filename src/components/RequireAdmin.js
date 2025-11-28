import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { subscribeToAuthChanges } from '../utils/auth';

/**
 * RequireAdmin checks whether the admin user is authenticated by examining the presence of a JWT token.
 * If no admin token is found, the user is redirected to the admin login page.
 */
function RequireAdmin({ children }) {
  const location = useLocation();
  const [isAuth, setIsAuth] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('adminToken'));
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(() => {
      setIsAuth(Boolean(localStorage.getItem('adminToken')));
    });
    return unsubscribe;
  }, []);

  if (!isAuth) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export default RequireAdmin;

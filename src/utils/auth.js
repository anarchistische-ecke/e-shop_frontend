export const AUTH_CHANGE_EVENT = 'auth:change';

export function notifyAuthChange(detail = {}) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail }));
}

export function subscribeToAuthChanges(callback) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => {
    callback();
  };

  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

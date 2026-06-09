import { readEnv } from '../config/runtime';

const DEFAULT_DIRECTUS_BASE_URL = 'http://localhost:8055';
const STOREFRONT_OPS_PATH = '/admin/storefront-ops';

function trimTrailingSlash(value = '') {
  return String(value || '').trim().replace(/\/+$/, '');
}

export function getDirectusBaseUrl() {
  return (
    trimTrailingSlash(readEnv('REACT_APP_DIRECTUS_BASE_URL')) ||
    trimTrailingSlash(readEnv('REACT_APP_DIRECTUS_URL')) ||
    DEFAULT_DIRECTUS_BASE_URL
  );
}

export function getDirectusAdminUrl() {
  return `${getDirectusBaseUrl()}/admin`;
}

export function getStorefrontOpsUrl() {
  return `${getDirectusBaseUrl()}${STOREFRONT_OPS_PATH}`;
}

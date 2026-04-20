function readProcessEnv(name) {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }
  return process.env[name];
}

function readImportMetaEnv(name) {
  try {
    return import.meta.env?.[name];
  } catch (error) {
    return undefined;
  }
}

function normalizeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

export function readEnv(name, fallback = '') {
  const processValue = normalizeString(readProcessEnv(name));
  if (processValue) {
    return processValue;
  }

  const importMetaValue = normalizeString(readImportMetaEnv(name));
  if (importMetaValue) {
    return importMetaValue;
  }

  return fallback;
}

export function readBooleanEnv(name, fallback = false) {
  const rawValue = readEnv(name);
  if (!rawValue) {
    return fallback;
  }

  const normalized = rawValue.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function readWindowConfig(key) {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const config = window.__APP_CONFIG__ || {};
  return config[key];
}

function normalizeBasePath(rawPath = '') {
  if (!rawPath) {
    return '';
  }

  const normalizedValue = String(rawPath).trim();

  if (/^https?:\/\//i.test(normalizedValue)) {
    try {
      const parsedPath = new URL(normalizedValue).pathname.replace(/\/$/, '');
      return parsedPath === '/' ? '' : parsedPath;
    } catch (error) {
      return '';
    }
  }

  const normalizedPath = normalizedValue.replace(/\/$/, '');
  if (!normalizedPath || normalizedPath === '/') {
    return '';
  }

  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
}

export function getRuntimeConfig() {
  const basePath =
    normalizeBasePath(readWindowConfig('basePath')) ||
    normalizeBasePath(readEnv('REACT_APP_BASENAME') || readEnv('PUBLIC_URL'));

  return {
    basePath,
    apiBase:
      normalizeString(readWindowConfig('apiBase')) ||
      normalizeString(typeof window !== 'undefined' ? window.__API_BASE__ : '') ||
      readEnv('REACT_APP_API_BASE'),
    imageBase:
      normalizeString(readWindowConfig('imageBase')) ||
      normalizeString(typeof window !== 'undefined' ? window.__IMAGE_BASE__ : '') ||
      readEnv('REACT_APP_IMAGE_BASE') ||
      readEnv('REACT_APP_STORAGE_BASE_URL') ||
      readEnv('REACT_APP_ASSET_BASE_URL'),
    keycloakUrl:
      normalizeString(readWindowConfig('keycloakUrl')) ||
      readEnv('REACT_APP_KEYCLOAK_URL'),
    keycloakRealm:
      normalizeString(readWindowConfig('keycloakRealm')) ||
      readEnv('REACT_APP_KEYCLOAK_REALM'),
    keycloakClientId:
      normalizeString(readWindowConfig('keycloakClientId')) ||
      readEnv('REACT_APP_KEYCLOAK_CLIENT_ID'),
    siteUrl:
      normalizeString(readWindowConfig('siteUrl')) ||
      readEnv('REACT_APP_SITE_URL') ||
      readEnv('REACT_APP_CANONICAL_ORIGIN'),
    publicUrl:
      normalizeString(readWindowConfig('publicUrl')) ||
      normalizeBasePath(readEnv('PUBLIC_URL')),
  };
}

export function isProductionEnvironment() {
  const mode = readEnv('NODE_ENV', 'development');
  return mode === 'production';
}

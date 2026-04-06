function parseBooleanEnv(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
    return false;
  }
  return defaultValue;
}

function normalizeProvider(value) {
  const normalized = String(value || 'YANDEX').trim().toUpperCase();
  return normalized || 'YANDEX';
}

export function getDeliveryClientConfig(env = process.env) {
  const provider = normalizeProvider(env.REACT_APP_DELIVERY_PROVIDER);
  const enabled = parseBooleanEnv(env.REACT_APP_DELIVERY_INTEGRATION_ENABLED, provider !== 'NONE');
  const mapsKey = String(
    env.REACT_APP_YANDEX_MAPS_JS_API_KEY || env.REACT_APP_YANDEX_MAPS_API_KEY || ''
  ).trim();
  const geocoderKey = String(env.REACT_APP_YANDEX_GEOCODER_API_KEY || '').trim();

  const missingClientKeys = [];
  if (enabled && provider === 'YANDEX') {
    if (!mapsKey) {
      missingClientKeys.push('maps');
    }
    if (!geocoderKey) {
      missingClientKeys.push('geocoder');
    }
  }

  return {
    provider,
    enabled,
    mapsKey,
    geocoderKey,
    hasMapsKey: Boolean(mapsKey),
    hasGeocoderKey: Boolean(geocoderKey),
    canRenderPickupMap: enabled && provider === 'YANDEX' && Boolean(mapsKey),
    canReverseGeocode: enabled && provider === 'YANDEX' && Boolean(geocoderKey),
    missingClientKeys
  };
}

export function getDeliveryConfigWarning(config = getDeliveryClientConfig()) {
  if (!config.enabled || config.provider !== 'YANDEX' || !config.missingClientKeys.length) {
    return null;
  }

  const issueLabels = config.missingClientKeys.map((issue) =>
    issue === 'maps' ? 'ключ карты' : 'ключ геокодера'
  );
  const issueText =
    issueLabels.length === 1
      ? issueLabels[0]
      : `${issueLabels.slice(0, -1).join(', ')} и ${issueLabels[issueLabels.length - 1]}`;

  return {
    code: 'delivery-client-config-warning',
    title: 'Конфигурация доставки неполная',
    message:
      `Интеграция Yandex Delivery включена, но отсутствует ${issueText}. ` +
      'Checkout перейдёт в безопасный ручной ввод города; автоподсказка города или карта могут быть недоступны.'
  };
}

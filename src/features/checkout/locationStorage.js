const LAST_PICKUP_LOCATION_KEY = 'checkout:last-confirmed-pickup-location';

function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

export function loadLastConfirmedPickupLocation() {
  const storage = getStorage();
  if (!storage) return '';

  try {
    const rawValue = storage.getItem(LAST_PICKUP_LOCATION_KEY);
    if (!rawValue) return '';
    const payload = JSON.parse(rawValue);
    return typeof payload?.city === 'string' ? payload.city.trim() : '';
  } catch (err) {
    storage.removeItem(LAST_PICKUP_LOCATION_KEY);
    return '';
  }
}

export function saveLastConfirmedPickupLocation(city) {
  const storage = getStorage();
  const normalizedCity = String(city || '').trim();
  if (!storage || !normalizedCity) return;

  storage.setItem(
    LAST_PICKUP_LOCATION_KEY,
    JSON.stringify({
      city: normalizedCity,
      savedAt: Date.now()
    })
  );
}

export function clearLastConfirmedPickupLocation() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(LAST_PICKUP_LOCATION_KEY);
}

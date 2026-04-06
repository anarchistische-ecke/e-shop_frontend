import { CHECKOUT_DRAFT_VERSION } from './constants';

const STORAGE_PREFIX = 'checkout-draft:v1:';

function getSessionStorage() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }
  return window.sessionStorage;
}

export function buildCheckoutDraftKey(cartId) {
  return `${STORAGE_PREFIX}${cartId || 'guest'}`;
}

export function loadCheckoutDraft(cartId) {
  const storage = getSessionStorage();
  if (!storage || !cartId) return null;

  try {
    const rawValue = storage.getItem(buildCheckoutDraftKey(cartId));
    if (!rawValue) return null;
    const payload = JSON.parse(rawValue);
    if (payload?.version !== CHECKOUT_DRAFT_VERSION) {
      storage.removeItem(buildCheckoutDraftKey(cartId));
      return null;
    }
    return payload;
  } catch (err) {
    storage.removeItem(buildCheckoutDraftKey(cartId));
    return null;
  }
}

export function saveCheckoutDraft(cartId, draft) {
  const storage = getSessionStorage();
  if (!storage || !cartId) return;
  storage.setItem(
    buildCheckoutDraftKey(cartId),
    JSON.stringify({
      version: CHECKOUT_DRAFT_VERSION,
      savedAt: Date.now(),
      ...draft
    })
  );
}

export function clearCheckoutDraft(cartId) {
  const storage = getSessionStorage();
  if (!storage || !cartId) return;
  storage.removeItem(buildCheckoutDraftKey(cartId));
}

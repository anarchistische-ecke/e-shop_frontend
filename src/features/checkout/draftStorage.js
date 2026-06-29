import { CHECKOUT_DRAFT_TTL_MS, CHECKOUT_DRAFT_VERSION } from './constants';

const STORAGE_PREFIX = 'checkout-draft:v1:';

function getDraftStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

export function buildCheckoutDraftKey(cartId) {
  return `${STORAGE_PREFIX}${cartId || 'guest'}`;
}

export function loadCheckoutDraft(cartId) {
  const storage = getDraftStorage();
  if (!storage || !cartId) return null;

  try {
    const draftKey = buildCheckoutDraftKey(cartId);
    const rawValue = storage.getItem(draftKey);
    if (!rawValue) return null;
    const payload = JSON.parse(rawValue);
    if (payload?.version !== CHECKOUT_DRAFT_VERSION) {
      storage.removeItem(draftKey);
      return null;
    }
    const savedAt = Number(payload?.savedAt || 0);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > CHECKOUT_DRAFT_TTL_MS) {
      storage.removeItem(draftKey);
      return null;
    }
    return payload;
  } catch (err) {
    storage.removeItem(buildCheckoutDraftKey(cartId));
    return null;
  }
}

export function saveCheckoutDraft(cartId, draft) {
  const storage = getDraftStorage();
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
  const storage = getDraftStorage();
  if (!storage || !cartId) return;
  storage.removeItem(buildCheckoutDraftKey(cartId));
}

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
    const migrated = migrateCheckoutDraft(payload);
    if (!migrated) {
      storage.removeItem(draftKey);
      return null;
    }
    const savedAt = Number(migrated?.savedAt || 0);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > CHECKOUT_DRAFT_TTL_MS) {
      storage.removeItem(draftKey);
      return null;
    }
    if (migrated.version !== payload.version) {
      storage.setItem(draftKey, JSON.stringify(migrated));
    }
    return migrated;
  } catch (err) {
    storage.removeItem(buildCheckoutDraftKey(cartId));
    return null;
  }
}

function hasValidContactAddress(form = {}) {
  const hasContact =
    /\S+@\S+\.\S+/.test(String(form.email || '').trim()) &&
    String(form.customerName || '').trim() &&
    String(form.phone || '').trim();
  const parts = form.addressParts || {};
  const hasStructuredAddress =
    String(parts.city || '').trim() &&
    String(parts.street || '').trim();
  return Boolean(hasContact && (hasStructuredAddress || String(form.homeAddress || '').trim()));
}

export function migrateCheckoutDraft(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.version === CHECKOUT_DRAFT_VERSION) return payload;
  if (payload.version !== 3) return null;

  const form = payload.form || {};
  const oldStep = Number(form.activeStep || 0);
  const canOpenReview = oldStep >= 2 && hasValidContactAddress(form);
  return {
    ...payload,
    version: CHECKOUT_DRAFT_VERSION,
    form: {
      ...form,
      activeStep: canOpenReview ? 1 : 0,
      completedSteps: canOpenReview
        ? { contact_address: true }
        : {}
    }
  };
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

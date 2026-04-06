export function normalizeCartQuantity(quantity) {
  const parsedQuantity = Number(quantity);

  if (!Number.isFinite(parsedQuantity)) {
    return 1;
  }

  return Math.max(1, Math.trunc(parsedQuantity) || 1);
}

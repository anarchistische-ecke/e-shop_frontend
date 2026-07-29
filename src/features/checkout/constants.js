export const CHECKOUT_STEPS = [
  { key: 'contact_address', title: 'Контакты и адрес' },
  { key: 'review_payment', title: 'Проверка и оплата' }
];

export const CHECKOUT_STEP_INDEX = CHECKOUT_STEPS.reduce((acc, step, index) => {
  acc[step.key] = index;
  return acc;
}, {});

export const FIELD_TO_STEP = {
  email: CHECKOUT_STEP_INDEX.contact_address,
  customerName: CHECKOUT_STEP_INDEX.contact_address,
  phone: CHECKOUT_STEP_INDEX.contact_address,
  homeAddress: CHECKOUT_STEP_INDEX.contact_address
};

export const CHECKOUT_DRAFT_VERSION = 4;
export const CHECKOUT_DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const CHECKOUT_REQUEST_TIMEOUT_MS = 30000;

export const CHECKOUT_STEPS = [
  { key: 'contact', title: 'Контакты' },
  { key: 'address', title: 'Адрес' },
  { key: 'review', title: 'Подтверждение' }
];

export const CHECKOUT_STEP_INDEX = CHECKOUT_STEPS.reduce((acc, step, index) => {
  acc[step.key] = index;
  return acc;
}, {});

export const FIELD_TO_STEP = {
  email: CHECKOUT_STEP_INDEX.contact,
  customerName: CHECKOUT_STEP_INDEX.contact,
  phone: CHECKOUT_STEP_INDEX.contact,
  homeAddress: CHECKOUT_STEP_INDEX.address
};

export const CHECKOUT_DRAFT_VERSION = 2;
export const CHECKOUT_REQUEST_TIMEOUT_MS = 30000;

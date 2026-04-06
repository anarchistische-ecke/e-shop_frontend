export const CHECKOUT_STEPS = [
  { key: 'contact', title: 'Контакт' },
  { key: 'recipient', title: 'Получатель' },
  { key: 'delivery', title: 'Доставка' },
  { key: 'review', title: 'Подтверждение' }
];

export const CHECKOUT_STEP_INDEX = CHECKOUT_STEPS.reduce((acc, step, index) => {
  acc[step.key] = index;
  return acc;
}, {});

export const FIELD_TO_STEP = {
  email: CHECKOUT_STEP_INDEX.contact,
  recipientFirstName: CHECKOUT_STEP_INDEX.recipient,
  recipientPhone: CHECKOUT_STEP_INDEX.recipient,
  deliveryAddress: CHECKOUT_STEP_INDEX.delivery,
  pickupLocation: CHECKOUT_STEP_INDEX.delivery,
  selectedPickupPointId: CHECKOUT_STEP_INDEX.delivery,
  selectedOfferId: CHECKOUT_STEP_INDEX.delivery
};

export const CHECKOUT_DRAFT_VERSION = 1;
export const CHECKOUT_REQUEST_TIMEOUT_MS = 30000;

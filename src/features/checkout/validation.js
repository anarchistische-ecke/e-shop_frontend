import { FIELD_TO_STEP } from './constants';
import { inferFieldByMessage, isEmailValid, mapBackendField } from './utils';

export const CHECKOUT_VALIDATION_SCHEMA = {
  email: {
    step: 'contact',
    validate: ({ email }) => {
      const normalizedEmail = String(email || '').trim();
      if (!normalizedEmail) {
        return 'Укажите email для чека и подтверждения заказа.';
      }
      if (!isEmailValid(normalizedEmail)) {
        return 'Проверьте формат email, например name@example.com.';
      }
      return '';
    }
  },
  recipientFirstName: {
    step: 'recipient',
    validate: ({ recipientFirstName }) =>
      String(recipientFirstName || '').trim() ? '' : 'Укажите имя получателя.'
  },
  recipientPhone: {
    step: 'recipient',
    validate: ({ recipientPhone }) =>
      String(recipientPhone || '').trim() ? '' : 'Укажите телефон для связи по доставке.'
  },
  deliveryAddress: {
    step: 'delivery',
    validate: ({ deliveryType, fullDeliveryAddress }) =>
      deliveryType === 'COURIER' && !String(fullDeliveryAddress || '').trim()
        ? 'Укажите адрес доставки для расчёта интервалов.'
        : ''
  },
  pickupLocation: {
    step: 'delivery',
    validate: ({ deliveryType, pickupLocation, selectedPickupPointId }) =>
      deliveryType === 'PICKUP' && !String(pickupLocation || '').trim() && !String(selectedPickupPointId || '').trim()
        ? 'Укажите город или адрес, чтобы найти пункты выдачи.'
        : ''
  },
  selectedPickupPointId: {
    step: 'delivery',
    validate: ({ deliveryType, selectedPickupPointId }) =>
      deliveryType === 'PICKUP' && !String(selectedPickupPointId || '').trim()
        ? 'Выберите пункт выдачи из списка или на карте.'
        : ''
  },
  selectedOfferId: {
    step: 'delivery',
    validate: ({ selectedOfferId }) =>
      String(selectedOfferId || '').trim() ? '' : 'Рассчитайте и выберите подходящий интервал доставки.'
  }
};

export const STEP_FIELD_ORDER = {
  contact: ['email'],
  recipient: ['recipientFirstName', 'recipientPhone'],
  delivery: ['deliveryAddress', 'pickupLocation', 'selectedPickupPointId', 'selectedOfferId']
};

export function validateCheckoutStep(stepKey, draft) {
  const fieldNames = STEP_FIELD_ORDER[stepKey] || [];
  return fieldNames.reduce((acc, fieldName) => {
    const rule = CHECKOUT_VALIDATION_SCHEMA[fieldName];
    if (!rule) return acc;
    const message = rule.validate(draft);
    if (message) {
      acc[fieldName] = message;
    }
    return acc;
  }, {});
}

export function validateCheckoutForOfferFetch(draft) {
  const errors = {};
  if (draft.deliveryType === 'COURIER' && !String(draft.fullDeliveryAddress || '').trim()) {
    errors.deliveryAddress = 'Укажите адрес доставки.';
  }
  if (draft.deliveryType === 'PICKUP' && !String(draft.selectedPickupPointId || '').trim()) {
    errors.selectedPickupPointId = 'Сначала выберите пункт выдачи.';
  }
  return errors;
}

export function mapCheckoutBackendErrors(error) {
  const details = error?.details || null;
  const fieldErrors = Array.isArray(details?.fieldErrors) ? details.fieldErrors : [];
  const mappedErrors = {};

  fieldErrors.forEach((fieldError) => {
    const field = mapBackendField(fieldError?.field);
    if (!field) return;
    const message =
      typeof fieldError?.message === 'string' && fieldError.message.trim()
        ? fieldError.message.trim()
        : 'Проверьте это поле.';
    mappedErrors[field] = message;
  });

  if (!Object.keys(mappedErrors).length) {
    const fallbackMessage =
      typeof details?.message === 'string' && details.message.trim()
        ? details.message.trim()
        : error?.message || '';
    const inferredField = inferFieldByMessage(fallbackMessage);
    if (inferredField) {
      mappedErrors[inferredField] = fallbackMessage;
    }
  }

  const nextStep = Object.keys(mappedErrors)
    .map((field) => FIELD_TO_STEP[field])
    .filter((stepIndex) => Number.isInteger(stepIndex))
    .sort((a, b) => a - b)[0];

  return {
    fieldErrors: mappedErrors,
    nextStep: Number.isInteger(nextStep) ? nextStep : null
  };
}

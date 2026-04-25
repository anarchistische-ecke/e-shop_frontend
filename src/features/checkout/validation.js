import { FIELD_TO_STEP } from './constants';
import { inferFieldByMessage, isEmailValid, mapBackendField } from './utils';
import { sanitizeCustomerFieldMessage } from '../../utils/customerErrors';

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
  customerName: {
    step: 'contact',
    validate: ({ customerName }) =>
      String(customerName || '').trim() ? '' : 'Укажите имя получателя.'
  },
  phone: {
    step: 'contact',
    validate: ({ phone }) =>
      String(phone || '').trim() ? '' : 'Укажите телефон для связи.'
  },
  homeAddress: {
    step: 'address',
    validate: ({ homeAddress }) =>
      String(homeAddress || '').trim()
        ? ''
        : 'Укажите домашний адрес. Варианты и стоимость доставки согласует менеджер.'
  }
};

export const STEP_FIELD_ORDER = {
  contact: ['email', 'customerName', 'phone'],
  address: ['homeAddress']
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

export function mapCheckoutBackendErrors(error) {
  const details = error?.details || null;
  const fieldErrors = Array.isArray(details?.fieldErrors) ? details.fieldErrors : [];
  const mappedErrors = {};

  fieldErrors.forEach((fieldError) => {
    const field = mapBackendField(fieldError?.field);
    if (!field) return;
    const message =
      typeof fieldError?.message === 'string' && fieldError.message.trim()
        ? sanitizeCustomerFieldMessage(fieldError.message)
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
      mappedErrors[inferredField] = sanitizeCustomerFieldMessage(fallbackMessage);
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

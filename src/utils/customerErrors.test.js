import { ApiRequestError } from '../api';
import {
  getCustomerSafeErrorMessage,
  isCustomerSafeMessage,
  sanitizeCustomerFieldMessage
} from './customerErrors';

describe('customer error sanitizing', () => {
  it('keeps short user-facing field messages intact', () => {
    expect(sanitizeCustomerFieldMessage('Email is required')).toBe('Email is required');
    expect(isCustomerSafeMessage('Укажите телефон для доставки.')).toBe(true);
  });

  it('hides sensitive backend details from customer-facing messages', () => {
    const error = new ApiRequestError(
      'org.springframework.dao.DataIntegrityViolationException: duplicate key value violates unique constraint',
      {
        status: 500,
        details: {
          message:
            'org.springframework.dao.DataIntegrityViolationException: duplicate key value violates unique constraint'
        }
      }
    );

    expect(sanitizeCustomerFieldMessage(error.details.message)).toBe('Проверьте это поле.');
    expect(
      getCustomerSafeErrorMessage(error, {
        context: 'checkout'
      })
    ).toBe('Сервис оформления временно недоступен. Попробуйте позже.');
  });

  it('maps checkout conflicts to a safe retry message', () => {
    const error = new ApiRequestError('already processing', {
      status: 409,
      details: {
        message: 'Order is already processing for this idempotency key'
      }
    });

    expect(
      getCustomerSafeErrorMessage(error, {
        context: 'checkout'
      })
    ).toBe('Заказ уже обрабатывается. Подождите немного и выполните безопасную проверку ещё раз.');
  });
});

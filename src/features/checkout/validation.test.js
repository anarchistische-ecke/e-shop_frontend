import {
  mapCheckoutBackendErrors,
  validateCheckoutStep
} from './validation';

describe('checkout validation', () => {
  it('validates manual checkout contact fields', () => {
    expect(
      validateCheckoutStep('contact', {
        email: '',
        customerName: '',
        phone: ''
      })
    ).toEqual({
      email: 'Укажите email для чека и подтверждения заказа.',
      customerName: 'Укажите имя получателя.',
      phone: 'Укажите телефон для связи.'
    });
  });

  it('validates the manual home address step', () => {
    expect(validateCheckoutStep('address', { homeAddress: '' })).toEqual({
      homeAddress: 'Укажите домашний адрес. Варианты и стоимость доставки согласует менеджер.'
    });
  });

  it('maps backend field errors to checkout fields and steps', () => {
    expect(
      mapCheckoutBackendErrors({
        details: {
          fieldErrors: [
            { field: 'customerName', message: 'Customer name is required' },
            { field: 'homeAddress', message: 'Home address is required' }
          ]
        }
      })
    ).toEqual({
      fieldErrors: {
        customerName: 'Customer name is required',
        homeAddress: 'Home address is required'
      },
      nextStep: 0
    });
  });

  it('maps receipt email errors back to the contact step', () => {
    expect(
      mapCheckoutBackendErrors({
        details: {
          fieldErrors: [
            { field: 'receiptEmail', message: 'Email is required' }
          ]
        }
      })
    ).toEqual({
      fieldErrors: {
        email: 'Email is required'
      },
      nextStep: 0
    });
  });

  it('sanitizes sensitive backend field messages before showing them to customers', () => {
    expect(
      mapCheckoutBackendErrors({
        details: {
          fieldErrors: [
            {
              field: 'homeAddress',
              message: 'org.springframework.dao.DataIntegrityViolationException: duplicate key value violates unique constraint'
            }
          ]
        }
      })
    ).toEqual({
      fieldErrors: {
        homeAddress: 'Проверьте это поле.'
      },
      nextStep: 1
    });
  });

  it('infers a checkout field from a plain backend message', () => {
    expect(
      mapCheckoutBackendErrors({
        message: 'Delivery address is required'
      })
    ).toEqual({
      fieldErrors: {
        homeAddress: 'Delivery address is required'
      },
      nextStep: 1
    });
  });
});

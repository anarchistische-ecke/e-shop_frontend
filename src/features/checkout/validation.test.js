import {
  mapCheckoutBackendErrors,
  validateCheckoutForOfferFetch,
  validateCheckoutStep
} from './validation';

describe('checkout validation', () => {
  it('validates delivery fields from the schema', () => {
    expect(
      validateCheckoutStep('delivery', {
        deliveryType: 'COURIER',
        fullDeliveryAddress: '',
        pickupLocation: '',
        selectedPickupPointId: '',
        selectedOfferId: ''
      })
    ).toEqual({
      deliveryAddress: 'Укажите адрес доставки для расчёта интервалов.',
      selectedOfferId: 'Рассчитайте и выберите подходящий интервал доставки.'
    });
  });

  it('maps backend field errors to checkout fields and steps', () => {
    expect(
      mapCheckoutBackendErrors({
        details: {
          fieldErrors: [
            { field: 'delivery.pickupPointId', message: 'Pickup point is required' }
          ]
        }
      })
    ).toEqual({
      fieldErrors: {
        selectedPickupPointId: 'Pickup point is required'
      },
      nextStep: 2
    });
  });

  it('maps nested delivery email errors back to the contact step', () => {
    expect(
      mapCheckoutBackendErrors({
        details: {
          fieldErrors: [
            { field: 'delivery.email', message: 'Email is required' }
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

  it('infers a checkout field from a plain backend message', () => {
    expect(
      mapCheckoutBackendErrors({
        message: 'Delivery address is required'
      })
    ).toEqual({
      fieldErrors: {
        deliveryAddress: 'Delivery address is required'
      },
      nextStep: 2
    });
  });

  it('validates fields required before loading delivery offers', () => {
    expect(
      validateCheckoutForOfferFetch({
        deliveryType: 'PICKUP',
        fullDeliveryAddress: '',
        selectedPickupPointId: ''
      })
    ).toEqual({
      selectedPickupPointId: 'Сначала выберите пункт выдачи.'
    });
  });
});

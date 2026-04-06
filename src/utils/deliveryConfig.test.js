import { getDeliveryClientConfig, getDeliveryConfigWarning } from './deliveryConfig';

describe('deliveryConfig', () => {
  it('warns when Yandex delivery is enabled without client keys', () => {
    const config = getDeliveryClientConfig({
      REACT_APP_DELIVERY_INTEGRATION_ENABLED: 'true',
      REACT_APP_DELIVERY_PROVIDER: 'YANDEX',
      REACT_APP_YANDEX_MAPS_JS_API_KEY: '',
      REACT_APP_YANDEX_GEOCODER_API_KEY: ''
    });

    expect(config.missingClientKeys).toEqual(['maps', 'geocoder']);
    expect(getDeliveryConfigWarning(config)).toEqual(
      expect.objectContaining({
        code: 'delivery-client-config-warning',
        title: 'Конфигурация доставки неполная'
      })
    );
  });

  it('does not warn when Yandex delivery has both map and geocoder keys', () => {
    const config = getDeliveryClientConfig({
      REACT_APP_DELIVERY_INTEGRATION_ENABLED: 'true',
      REACT_APP_DELIVERY_PROVIDER: 'YANDEX',
      REACT_APP_YANDEX_MAPS_JS_API_KEY: 'maps-key',
      REACT_APP_YANDEX_GEOCODER_API_KEY: 'geocoder-key'
    });

    expect(config.canRenderPickupMap).toBe(true);
    expect(config.canReverseGeocode).toBe(true);
    expect(getDeliveryConfigWarning(config)).toBeNull();
  });

  it('does not warn when the client-side delivery integration is disabled', () => {
    const config = getDeliveryClientConfig({
      REACT_APP_DELIVERY_INTEGRATION_ENABLED: 'false',
      REACT_APP_DELIVERY_PROVIDER: 'YANDEX'
    });

    expect(config.enabled).toBe(false);
    expect(getDeliveryConfigWarning(config)).toBeNull();
  });
});

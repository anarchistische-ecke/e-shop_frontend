import {
  clearLastConfirmedPickupLocation,
  loadLastConfirmedPickupLocation,
  saveLastConfirmedPickupLocation
} from './locationStorage';

describe('locationStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores and restores the last confirmed pickup location', () => {
    saveLastConfirmedPickupLocation('Санкт-Петербург');

    expect(loadLastConfirmedPickupLocation()).toBe('Санкт-Петербург');
  });

  it('clears the stored pickup location', () => {
    saveLastConfirmedPickupLocation('Москва');

    clearLastConfirmedPickupLocation();

    expect(loadLastConfirmedPickupLocation()).toBe('');
  });
});

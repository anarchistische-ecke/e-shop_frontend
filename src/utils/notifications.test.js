import { createNotification, getNotificationAppearance } from './notifications';

describe('notifications utils', () => {
  it('creates a normalized notification shape', () => {
    expect(
      createNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Что-то пошло не так.'
      })
    ).toEqual({
      id: undefined,
      type: 'error',
      title: 'Ошибка',
      message: 'Что-то пошло не так.',
      action: null
    });
  });

  it('returns themed appearance tokens for known types', () => {
    expect(getNotificationAppearance('error').container).toContain('border-red-200');
    expect(getNotificationAppearance('success').container).toContain('border-green-200');
    expect(getNotificationAppearance('info').container).toContain('border-primary/20');
  });
});

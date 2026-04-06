import {
  FALLBACK_PAYMENT_CONFIG,
  getCheckoutPaymentDescription,
  getOrderPaymentNotice,
  getPaymentSummaryLabel,
  getReviewPaymentHint,
  normalizePaymentConfig
} from './payment';

describe('payment utils', () => {
  it('normalizes backend config and fills safe defaults', () => {
    expect(normalizePaymentConfig()).toEqual(FALLBACK_PAYMENT_CONFIG);

    expect(
      normalizePaymentConfig({
        providerCode: 'yookassa',
        providerName: 'YooKassa',
        methodSummary: 'карта / SberPay',
        checkoutDescription: '',
        resumePaymentLabel: ''
      })
    ).toEqual({
      enabled: true,
      providerCode: 'YOOKASSA',
      providerName: 'YooKassa',
      methodSummary: 'карта / SberPay',
      checkoutDescription:
        'Оплата на защищённой странице YooKassa. Данные карты не хранятся в браузере магазина.',
      resumePaymentLabel: 'Продолжить оплату через YooKassa'
    });
  });

  it('builds display copy for cart, checkout and review', () => {
    const paymentConfig = {
      providerName: 'ТестКасса',
      methodSummary: 'карта / СБП',
      checkoutDescription:
        'Оплата на защищённой странице ТестКасса. Данные карты не хранятся в браузере магазина.',
      resumePaymentLabel: 'Продолжить оплату через ТестКасса'
    };

    expect(getPaymentSummaryLabel(paymentConfig)).toBe('ТестКасса (карта / СБП)');
    expect(getCheckoutPaymentDescription(paymentConfig)).toBe(
      'Оплата на защищённой странице ТестКасса. Данные карты не хранятся в браузере магазина.'
    );
    expect(getReviewPaymentHint(paymentConfig)).toBe(
      'Или оплатите картой на следующем шаге через ТестКасса.'
    );
  });

  it('returns different order recovery copy for pending and processing orders', () => {
    const pendingNotice = getOrderPaymentNotice(
      { providerName: 'YooKassa', resumePaymentLabel: 'Продолжить оплату через YooKassa' },
      'PENDING'
    );
    const processingNotice = getOrderPaymentNotice(
      { providerName: 'YooKassa', resumePaymentLabel: 'Продолжить оплату через YooKassa' },
      'PROCESSING'
    );

    expect(pendingNotice.type).toBe('info');
    expect(processingNotice.type).toBe('warning');
    expect(pendingNotice.ctaLabel).toBe('Продолжить оплату через YooKassa');
    expect(processingNotice.message).toContain('автоматически проверяем');
  });
});

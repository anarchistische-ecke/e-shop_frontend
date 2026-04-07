import {
  FALLBACK_PAYMENT_CONFIG,
  getCheckoutPaymentDescription,
  getOrderPaymentNotice,
  getPaymentSummaryLabel,
  getReviewPaymentHint,
  hasEmbeddedPaymentSession,
  hasRedirectPaymentSession,
  normalizePaymentSession,
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
        resumePaymentLabel: '',
        confirmationMode: 'embedded',
        supportsEmbedded: true,
        widgetScriptUrl: ''
      })
    ).toEqual({
      enabled: true,
      providerCode: 'YOOKASSA',
      providerName: 'YooKassa',
      methodSummary: 'карта / SberPay',
      checkoutDescription:
        'Оплата во встроенной защищённой форме YooKassa. Данные карты не хранятся в браузере магазина.',
      resumePaymentLabel: 'Открыть форму оплаты через YooKassa',
      confirmationMode: 'EMBEDDED',
      supportsEmbedded: true,
      widgetScriptUrl: 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js'
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

  it('normalizes payment sessions for embedded and redirect flows', () => {
    const embeddedSession = normalizePaymentSession(
      {
        paymentId: 'payment-1',
        confirmationType: 'embedded',
        confirmationToken: 'ct-test'
      },
      { returnUrl: 'https://example.com/shop/order/token-1' }
    );
    const redirectSession = normalizePaymentSession({
      paymentId: 'payment-2',
      confirmationUrl: 'https://payments.example.test/checkout'
    });

    expect(embeddedSession).toEqual({
      paymentId: 'payment-1',
      confirmationUrl: '',
      confirmationType: 'EMBEDDED',
      confirmationToken: 'ct-test',
      returnUrl: 'https://example.com/shop/order/token-1'
    });
    expect(hasEmbeddedPaymentSession(embeddedSession)).toBe(true);
    expect(hasRedirectPaymentSession(embeddedSession)).toBe(false);
    expect(hasRedirectPaymentSession(redirectSession)).toBe(true);
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
    expect(
      getOrderPaymentNotice(
        {
          providerName: 'YooKassa',
          resumePaymentLabel: 'Продолжить оплату через YooKassa',
          confirmationMode: 'EMBEDDED'
        },
        'PENDING'
      ).message
    ).toContain('встроенная форма');
  });
});

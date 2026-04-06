export const FALLBACK_PAYMENT_CONFIG = {
  enabled: true,
  providerCode: 'GENERIC',
  providerName: 'Онлайн-оплата',
  methodSummary: 'банковская карта',
  checkoutDescription:
    'Оплата на защищённой странице платёжного партнёра. Данные карты не хранятся в браузере магазина.',
  resumePaymentLabel: 'Продолжить оплату'
};

function safeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizePaymentConfig(config = {}) {
  const providerName =
    safeString(config.providerName) || FALLBACK_PAYMENT_CONFIG.providerName;
  const methodSummary =
    safeString(config.methodSummary) || FALLBACK_PAYMENT_CONFIG.methodSummary;
  const providerCode =
    safeString(config.providerCode).toUpperCase() ||
    FALLBACK_PAYMENT_CONFIG.providerCode;
  const checkoutDescription =
    safeString(config.checkoutDescription) ||
    (providerName === FALLBACK_PAYMENT_CONFIG.providerName
      ? FALLBACK_PAYMENT_CONFIG.checkoutDescription
      : `Оплата на защищённой странице ${providerName}. Данные карты не хранятся в браузере магазина.`);
  const resumePaymentLabel =
    safeString(config.resumePaymentLabel) ||
    (providerName === FALLBACK_PAYMENT_CONFIG.providerName
      ? FALLBACK_PAYMENT_CONFIG.resumePaymentLabel
      : `Продолжить оплату через ${providerName}`);

  return {
    enabled: config.enabled !== false,
    providerCode,
    providerName,
    methodSummary,
    checkoutDescription,
    resumePaymentLabel
  };
}

export function getPaymentSummaryLabel(config = FALLBACK_PAYMENT_CONFIG) {
  const paymentConfig = normalizePaymentConfig(config);
  return paymentConfig.methodSummary
    ? `${paymentConfig.providerName} (${paymentConfig.methodSummary})`
    : paymentConfig.providerName;
}

export function getCheckoutPaymentDescription(config = FALLBACK_PAYMENT_CONFIG) {
  return normalizePaymentConfig(config).checkoutDescription;
}

export function getReviewPaymentHint(config = FALLBACK_PAYMENT_CONFIG) {
  const paymentConfig = normalizePaymentConfig(config);
  if (paymentConfig.providerName === FALLBACK_PAYMENT_CONFIG.providerName) {
    return 'Или оплатите картой на следующем шаге на защищённой странице оплаты.';
  }
  return `Или оплатите картой на следующем шаге через ${paymentConfig.providerName}.`;
}

export function getOrderPaymentNotice(config = FALLBACK_PAYMENT_CONFIG, orderStatus = 'PENDING') {
  const paymentConfig = normalizePaymentConfig(config);
  const resumeLabel = paymentConfig.resumePaymentLabel;

  if (orderStatus === 'PROCESSING') {
    return {
      type: 'warning',
      title: 'Платёж обрабатывается',
      message:
        `Мы автоматически проверяем ответ от ${paymentConfig.providerName}. ` +
        'Если банк уже подтвердил оплату, обновите статус вручную.',
      ctaLabel: resumeLabel
    };
  }

  return {
    type: 'info',
    title: 'Оплата ещё не подтверждена',
    message:
      `Если страница ${paymentConfig.providerName} закрылась или соединение оборвалось, ` +
      'можно безопасно вернуться к оплате и затем проверить статус заказа.',
    ctaLabel: resumeLabel
  };
}

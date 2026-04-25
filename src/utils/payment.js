export const FALLBACK_PAYMENT_CONFIG = {
  enabled: true,
  providerCode: 'GENERIC',
  providerName: 'Онлайн-оплата',
  methodSummary: 'банковская карта',
  checkoutDescription:
    'Оплата на защищённой странице платёжного партнёра. Данные карты не хранятся в браузере магазина.',
  resumePaymentLabel: 'Продолжить оплату',
  confirmationMode: 'REDIRECT',
  supportsEmbedded: false,
  widgetScriptUrl: 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js',
  methods: ['CARD', 'SBP'],
  fullPrepayment: true,
  splitPaymentsEnabled: false,
  cashOnDeliveryEnabled: false,
  fiscalConfig: null
};

function safeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeConfirmationMode(value) {
  return safeString(value).toUpperCase() === 'EMBEDDED' ? 'EMBEDDED' : 'REDIRECT';
}

export function normalizePaymentConfig(config = {}) {
  const providerName =
    safeString(config.providerName) || FALLBACK_PAYMENT_CONFIG.providerName;
  const methodSummary =
    safeString(config.methodSummary) || FALLBACK_PAYMENT_CONFIG.methodSummary;
  const providerCode =
    safeString(config.providerCode).toUpperCase() ||
    FALLBACK_PAYMENT_CONFIG.providerCode;
  const resumePaymentLabel =
    safeString(config.resumePaymentLabel) ||
    (normalizeConfirmationMode(config.confirmationMode) === 'EMBEDDED'
      ? providerName === FALLBACK_PAYMENT_CONFIG.providerName
        ? 'Открыть форму оплаты'
        : `Открыть форму оплаты через ${providerName}`
      : providerName === FALLBACK_PAYMENT_CONFIG.providerName
      ? FALLBACK_PAYMENT_CONFIG.resumePaymentLabel
      : `Продолжить оплату через ${providerName}`);
  const confirmationMode = normalizeConfirmationMode(config.confirmationMode);
  const supportsEmbedded =
    config.supportsEmbedded === true || confirmationMode === 'EMBEDDED';
  const widgetScriptUrl =
    safeString(config.widgetScriptUrl) || FALLBACK_PAYMENT_CONFIG.widgetScriptUrl;
  const methods = Array.isArray(config.methods) && config.methods.length
    ? config.methods.map((method) => safeString(method).toUpperCase()).filter(Boolean)
    : FALLBACK_PAYMENT_CONFIG.methods;
  const checkoutDescription =
    safeString(config.checkoutDescription) ||
    (confirmationMode === 'EMBEDDED'
      ? providerName === FALLBACK_PAYMENT_CONFIG.providerName
        ? 'Оплата во встроенной защищённой форме платёжного партнёра. Данные карты не хранятся в браузере магазина.'
        : `Оплата во встроенной защищённой форме ${providerName}. Данные карты не хранятся в браузере магазина.`
      : providerName === FALLBACK_PAYMENT_CONFIG.providerName
      ? FALLBACK_PAYMENT_CONFIG.checkoutDescription
      : `Оплата на защищённой странице ${providerName}. Данные карты не хранятся в браузере магазина.`);

  return {
    enabled: config.enabled !== false,
    providerCode,
    providerName,
    methodSummary,
    checkoutDescription,
    resumePaymentLabel,
    confirmationMode,
    supportsEmbedded,
    widgetScriptUrl,
    methods,
    fullPrepayment: config.fullPrepayment !== false,
    splitPaymentsEnabled: config.splitPaymentsEnabled === true,
    cashOnDeliveryEnabled: config.cashOnDeliveryEnabled === true,
    fiscalConfig: config.fiscalConfig || null
  };
}

export function normalizePaymentSession(session = {}, { returnUrl } = {}) {
  return {
    paymentId:
      safeString(session.paymentId) ||
      safeString(session.id),
    confirmationUrl: safeString(session.confirmationUrl),
    confirmationType: normalizeConfirmationMode(session.confirmationType),
    confirmationToken: safeString(session.confirmationToken),
    returnUrl: safeString(returnUrl) || safeString(session.returnUrl)
  };
}

export function hasEmbeddedPaymentSession(session = {}) {
  const normalizedSession = normalizePaymentSession(session);
  return (
    normalizedSession.confirmationType === 'EMBEDDED' &&
    Boolean(normalizedSession.confirmationToken)
  );
}

export function hasRedirectPaymentSession(session = {}) {
  return Boolean(normalizePaymentSession(session).confirmationUrl);
}

export function isEmbeddedPaymentMode(config = FALLBACK_PAYMENT_CONFIG) {
  return normalizePaymentConfig(config).confirmationMode === 'EMBEDDED';
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
  if (paymentConfig.confirmationMode === 'EMBEDDED') {
    return paymentConfig.providerName === FALLBACK_PAYMENT_CONFIG.providerName
      ? 'После подтверждения заказа откроется встроенная защищённая форма оплаты.'
      : `После подтверждения заказа откроется встроенная защищённая форма ${paymentConfig.providerName}.`;
  }
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
      paymentConfig.confirmationMode === 'EMBEDDED'
        ? `Если встроенная форма ${paymentConfig.providerName} закрылась или соединение оборвалось, ` +
          'можно безопасно открыть её снова и затем проверить статус заказа.'
        : `Если страница ${paymentConfig.providerName} закрылась или соединение оборвалось, ` +
          'можно безопасно вернуться к оплате и затем проверить статус заказа.',
    ctaLabel: resumeLabel
  };
}

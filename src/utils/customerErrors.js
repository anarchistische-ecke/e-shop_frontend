import { isApiRequestError } from '../api';

const SENSITIVE_MESSAGE_PATTERNS = [
  /exception/i,
  /\bstack\b/i,
  /\btrace\b/i,
  /\bsql\b/i,
  /\bselect\b/i,
  /\binsert\b/i,
  /\bupdate\b/i,
  /\bdelete\b/i,
  /\bdrop\b/i,
  /\bconstraint\b/i,
  /org\.[a-z]/i,
  /java\.[a-z]/i,
  /https?:\/\//i,
  /\blocalhost\b/i,
  /\b\d{2,5}\b.*\b(error|exception)\b/i
];

const CUSTOMER_ERROR_MESSAGES = {
  generic: {
    fallback: 'Попробуйте ещё раз.',
    validation: 'Проверьте данные и попробуйте снова.',
    unauthorized: 'Сессия устарела. Войдите снова и повторите попытку.',
    forbidden: 'Это действие сейчас недоступно.',
    notFound: 'Не удалось найти нужные данные.',
    conflict: 'Запрос уже обрабатывается. Подождите немного и попробуйте снова.',
    rateLimited: 'Слишком много попыток. Подождите немного и попробуйте снова.',
    timeout: 'Связь нестабильна. Попробуйте ещё раз.',
    server: 'Сервис временно недоступен. Попробуйте позже.'
  },
  addToCart: {
    fallback: 'Возможно, товар закончился или недоступен.',
    validation: 'Проверьте выбранный вариант и попробуйте снова.',
    notFound: 'Товар больше недоступен для добавления в корзину.',
    conflict: 'Корзина уже обновляется. Попробуйте ещё раз через пару секунд.',
    timeout: 'Не удалось обновить корзину из-за нестабильного соединения. Попробуйте ещё раз.',
    server: 'Не удалось обновить корзину. Попробуйте позже.'
  },
  checkout: {
    fallback: 'Не удалось оформить заказ. Попробуйте ещё раз.',
    validation: 'Проверьте данные заказа и попробуйте снова.',
    conflict: 'Заказ уже обрабатывается. Подождите немного и выполните безопасную проверку ещё раз.',
    timeout: 'Связь нестабильна. Мы сохранили попытку оформления, повторная проверка не создаст дубль заказа.',
    server: 'Сервис оформления временно недоступен. Попробуйте позже.'
  },
  checkoutDelivery: {
    fallback: 'Не удалось загрузить данные доставки. Попробуйте ещё раз.',
    validation: 'Проверьте город, адрес или пункт выдачи и попробуйте снова.',
    notFound: 'Не удалось найти подходящие варианты доставки для указанного места.',
    conflict: 'Расчёт доставки уже выполняется. Подождите немного и попробуйте снова.',
    timeout: 'Не удалось связаться со службой доставки. Попробуйте ещё раз.',
    server: 'Сервис доставки временно недоступен. Попробуйте позже.'
  },
  paymentWidget: {
    fallback: 'Не удалось подготовить форму оплаты. Можно безопасно запросить её ещё раз.',
    validation: 'Не удалось подготовить форму оплаты. Попробуйте запросить её ещё раз.',
    timeout: 'Форма оплаты загружается слишком долго. Запросите её ещё раз.',
    server: 'Платёжный сервис временно недоступен. Попробуйте позже.'
  },
  documentLoad: {
    fallback: 'Не удалось загрузить документ. Попробуйте ещё раз позже.',
    notFound: 'Документ сейчас недоступен.',
    timeout: 'Не удалось загрузить документ из-за нестабильного соединения. Попробуйте ещё раз.',
    server: 'Документ временно недоступен. Попробуйте позже.'
  }
};

function normalizeMessage(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isCustomerSafeMessage(message = '') {
  const normalized = normalizeMessage(message);
  if (!normalized) {
    return false;
  }
  if (normalized.length > 180) {
    return false;
  }
  if (/[\r\n\t]/.test(normalized)) {
    return false;
  }
  return !SENSITIVE_MESSAGE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function sanitizeCustomerFieldMessage(message, fallback = 'Проверьте это поле.') {
  const normalized = normalizeMessage(message);
  if (!normalized) {
    return fallback;
  }
  return isCustomerSafeMessage(normalized) ? normalized : fallback;
}

function resolveContextMessages(context = 'generic') {
  return {
    ...CUSTOMER_ERROR_MESSAGES.generic,
    ...(CUSTOMER_ERROR_MESSAGES[context] || {})
  };
}

function resolveStatusMessage(status, messages) {
  if (!status) {
    return '';
  }
  if (status === 400 || status === 422) {
    return messages.validation || '';
  }
  if (status === 401) {
    return messages.unauthorized || '';
  }
  if (status === 403) {
    return messages.forbidden || '';
  }
  if (status === 404) {
    return messages.notFound || '';
  }
  if (status === 409) {
    return messages.conflict || '';
  }
  if (status === 429) {
    return messages.rateLimited || '';
  }
  if (status >= 500) {
    return messages.server || '';
  }
  return '';
}

export function getCustomerSafeErrorMessage(
  error,
  { context = 'generic', fallbackMessage = '', allowSafeMessage = false } = {}
) {
  const messages = resolveContextMessages(context);
  const normalizedFallback = normalizeMessage(fallbackMessage) || messages.fallback;

  if (error?.name === 'AbortError') {
    return messages.timeout || normalizedFallback;
  }

  if (isApiRequestError(error)) {
    const statusMessage = resolveStatusMessage(error.status, messages);
    if (statusMessage) {
      return statusMessage;
    }
  }

  const safeRawMessage = [
    normalizeMessage(error?.details?.userMessage),
    normalizeMessage(error?.details?.message),
    normalizeMessage(error?.message)
  ].find(isCustomerSafeMessage);

  if (allowSafeMessage && safeRawMessage) {
    return safeRawMessage;
  }

  return normalizedFallback;
}

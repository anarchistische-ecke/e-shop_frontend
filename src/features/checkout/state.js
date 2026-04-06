export function getStoredCartId() {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('cartId');
}

export function createTimeoutController(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timeoutId)
  };
}

export function createInitialCompletedSteps(draft = {}) {
  return draft.completedSteps && typeof draft.completedSteps === 'object'
    ? draft.completedSteps
    : {};
}

export function createInitialAttempt(draft = {}) {
  const attempt = draft.attempt;
  if (!attempt || typeof attempt !== 'object') {
    return { cartId: '', key: '', signature: '', orderToken: '' };
  }
  return {
    cartId: typeof attempt.cartId === 'string' ? attempt.cartId : '',
    key: typeof attempt.key === 'string' ? attempt.key : '',
    signature: typeof attempt.signature === 'string' ? attempt.signature : '',
    orderToken: typeof attempt.orderToken === 'string' ? attempt.orderToken : ''
  };
}

export function createSafeRetryState(kind, { orderToken = '', message = '' } = {}) {
  if (kind === 'conflict') {
    return {
      kind,
      orderToken,
      title: 'Заказ уже обрабатывается',
      message:
        message ||
        'Мы уже обрабатываем этот запрос. Повторная проверка безопасна и не создаст дубль заказа или платежа.',
      retryLabel: 'Проверить ещё раз'
    };
  }

  if (kind === 'missing_confirmation') {
    return {
      kind,
      orderToken,
      title: 'Заказ создан, но ссылка оплаты не получена',
      message:
        message ||
        'Попробуйте безопасно запросить ссылку оплаты ещё раз. Если заказ уже доступен, можно сразу открыть его статус.',
      retryLabel: 'Получить ссылку оплаты'
    };
  }

  return {
    kind,
    orderToken,
    title: 'Связь прервалась во время оформления',
    message:
      message ||
      'Не закрывайте страницу. Повторная проверка использует тот же запрос и не создаст дубль заказа или платежа.',
    retryLabel: 'Повторить безопасно'
  };
}

export function createInitialSafeRetryState(
  draft = {},
  attempt = createInitialAttempt(draft)
) {
  if (draft.safeRetryState && typeof draft.safeRetryState === 'object') {
    return draft.safeRetryState;
  }
  if (!attempt.key) {
    return null;
  }
  return createSafeRetryState('timeout', {
    orderToken: attempt.orderToken || '',
    message:
      'Оформление было уже отправлено. Выполните безопасную проверку, чтобы продолжить без дубля заказа или платежа.'
  });
}

export function createPickupLocationSuggestion(city, source = 'timezone') {
  const normalizedCity = String(city || '').trim();
  if (!normalizedCity) {
    return null;
  }

  if (source === 'geocoder') {
    return {
      city: normalizedCity,
      source,
      title: `Подтвердите город: ${normalizedCity}`,
      message:
        'Мы определили город по геопозиции устройства. Подтвердите его перед загрузкой пунктов выдачи и интервалов доставки.'
    };
  }

  return {
    city: normalizedCity,
    source,
    title: `Похоже, ваш город — ${normalizedCity}`,
    message:
      'Это предположение по часовому поясу. Подтвердите город или введите его вручную, прежде чем загружать пункты выдачи.'
  };
}

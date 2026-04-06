import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CartContext } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  checkoutCart,
  getYandexDeliveryOffers,
  getYandexPickupPoints,
  isApiRequestError
} from '../../api';
import { buildAbsoluteAppUrl } from '../../utils/url';
import { createNotification } from '../../utils/notifications';
import { moneyToNumber } from '../../utils/product';
import { METRIKA_GOALS, trackMetrikaGoal } from '../../utils/metrika';
import {
  CHECKOUT_REQUEST_TIMEOUT_MS,
  CHECKOUT_STEPS,
  DEFAULT_PICKUP_CITY
} from './constants';
import { clearCheckoutDraft, loadCheckoutDraft, saveCheckoutDraft } from './draftStorage';
import {
  mapCheckoutBackendErrors,
  STEP_FIELD_ORDER,
  validateCheckoutForOfferFetch,
  validateCheckoutStep
} from './validation';
import {
  buildCheckoutAttemptSignature,
  buildFullDeliveryAddress,
  detectCityByTimezone,
  extractCityFromGeocodeResponse,
  formatRub,
  isAbortError,
  isEmailValid,
  normalizeViewportBounds,
  pickupUiId,
  resolveCheckoutAttempt,
  uniqueCities,
  viewportToken
} from './utils';

function getStoredCartId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cartId');
}

function createTimeoutController(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timeoutId)
  };
}

function createInitialCompletedSteps(draft = {}) {
  return draft.completedSteps && typeof draft.completedSteps === 'object' ? draft.completedSteps : {};
}

function createInitialAttempt(draft = {}) {
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

function createInitialSafeRetryState(draft = {}, attempt = createInitialAttempt(draft)) {
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

function createSafeRetryState(kind, { orderToken = '', message = '' } = {}) {
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

export function useCheckoutState() {
  const { items: liveItems, cartId } = useContext(CartContext);
  const { tokenParsed, isAuthenticated, hasRole } = useAuth();
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);

  const initialCartIdRef = useRef(cartId || getStoredCartId());
  const initialDraftRef = useRef(loadCheckoutDraft(initialCartIdRef.current) || {});
  const initialDraft = initialDraftRef.current;
  const initialAttemptRef = useRef(createInitialAttempt(initialDraft));
  const initialAttempt = initialAttemptRef.current;
  const formDraft = initialDraft.form || {};

  const [activeStep, setActiveStep] = useState(
    Number.isInteger(formDraft.activeStep)
      ? initialAttempt.key
        ? Math.max(formDraft.activeStep, 3)
        : formDraft.activeStep
      : initialAttempt.key
      ? 3
      : 0
  );
  const [completedSteps, setCompletedSteps] = useState(createInitialCompletedSteps(formDraft));
  const [fieldErrors, setFieldErrors] = useState(formDraft.fieldErrors || {});

  const [email, setEmail] = useState(formDraft.email || '');
  const [recipientFirstName, setRecipientFirstName] = useState(formDraft.recipientFirstName || '');
  const [recipientLastName, setRecipientLastName] = useState(formDraft.recipientLastName || '');
  const [recipientPhone, setRecipientPhone] = useState(formDraft.recipientPhone || '');

  const [deliveryType, setDeliveryType] = useState(formDraft.deliveryType || 'COURIER');
  const [deliveryAddress, setDeliveryAddress] = useState(formDraft.deliveryAddress || '');
  const [deliveryAddressDetails, setDeliveryAddressDetails] = useState(formDraft.deliveryAddressDetails || '');
  const [showDeliveryAddressDetails, setShowDeliveryAddressDetails] = useState(
    Boolean(formDraft.showDeliveryAddressDetails)
  );
  const [pickupLocation, setPickupLocation] = useState(formDraft.pickupLocation || '');
  const [pickupGeoId, setPickupGeoId] = useState(formDraft.pickupGeoId ?? null);
  const [pickupPoints, setPickupPoints] = useState(Array.isArray(formDraft.pickupPoints) ? formDraft.pickupPoints : []);
  const [selectedPickupPointId, setSelectedPickupPointId] = useState(formDraft.selectedPickupPointId || '');
  const [selectedPickupPointUiId, setSelectedPickupPointUiId] = useState(formDraft.selectedPickupPointUiId || '');
  const [selectedPickupPointName, setSelectedPickupPointName] = useState(formDraft.selectedPickupPointName || '');

  const [deliveryOffers, setDeliveryOffers] = useState(Array.isArray(formDraft.deliveryOffers) ? formDraft.deliveryOffers : []);
  const [selectedOfferId, setSelectedOfferId] = useState(formDraft.selectedOfferId || '');

  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupAutoDetecting, setPickupAutoDetecting] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [status, setStatus] = useState(formDraft.status || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(Boolean(formDraft.savePaymentMethod));
  const [isPickupMapOpen, setIsPickupMapOpen] = useState(false);
  const [expressMessage, setExpressMessage] = useState(formDraft.expressMessage || '');
  const [submitPhase, setSubmitPhase] = useState('idle');
  const [safeRetryState, setSafeRetryState] = useState(
    createInitialSafeRetryState(initialDraft, initialAttempt)
  );
  const [attempt, setAttempt] = useState(initialAttempt);
  const [itemSnapshot, setItemSnapshot] = useState(
    Array.isArray(initialDraft.itemSnapshot) ? initialDraft.itemSnapshot : []
  );

  const beginCheckoutTrackedRef = useRef(false);
  const shippingTrackedOfferRef = useRef('');
  const paymentStepTrackedRef = useRef(false);
  const pickupViewportSyncRef = useRef({ inFlight: '', lastResolved: '' });
  const autoOfferFetchRef = useRef('');
  const deliveryDependencyRef = useRef('');
  const pickupLocationDependencyRef = useRef('');

  const effectiveCartId = cartId || initialCartIdRef.current || getStoredCartId() || null;
  const items = liveItems.length ? liveItems : itemSnapshot;

  useEffect(() => {
    if (!liveItems.length) {
      if (!attempt.key && !safeRetryState && itemSnapshot.length) {
        setItemSnapshot([]);
      }
      return;
    }
    setItemSnapshot(liveItems);
  }, [attempt.key, itemSnapshot.length, liveItems, safeRetryState]);

  useEffect(() => {
    if (!email) {
      const fallbackEmail =
        tokenParsed?.email ||
        tokenParsed?.preferred_username ||
        tokenParsed?.username ||
        '';
      if (fallbackEmail) {
        setEmail(fallbackEmail);
      }
    }
    if (!recipientFirstName && tokenParsed?.given_name) {
      setRecipientFirstName(tokenParsed.given_name);
    }
    if (!recipientLastName && tokenParsed?.family_name) {
      setRecipientLastName(tokenParsed.family_name);
    }
    if (!recipientPhone && tokenParsed?.phone_number) {
      setRecipientPhone(tokenParsed.phone_number);
    }
  }, [email, recipientFirstName, recipientLastName, recipientPhone, tokenParsed]);

  useEffect(() => {
    const dependencySignature = [
      deliveryType,
      deliveryAddress,
      deliveryAddressDetails,
      selectedPickupPointId
    ].join('|');
    if (!deliveryDependencyRef.current) {
      deliveryDependencyRef.current = dependencySignature;
      return;
    }
    if (deliveryDependencyRef.current === dependencySignature) {
      return;
    }
    deliveryDependencyRef.current = dependencySignature;
    setDeliveryOffers([]);
    setSelectedOfferId('');
    setDeliveryError('');
    shippingTrackedOfferRef.current = '';
    autoOfferFetchRef.current = '';
  }, [deliveryType, deliveryAddress, deliveryAddressDetails, selectedPickupPointId]);

  useEffect(() => {
    if (!pickupLocationDependencyRef.current) {
      pickupLocationDependencyRef.current = pickupLocation;
      return;
    }
    if (pickupLocationDependencyRef.current === pickupLocation) {
      return;
    }
    pickupLocationDependencyRef.current = pickupLocation;
    setPickupPoints([]);
    setSelectedPickupPointId('');
    setSelectedPickupPointUiId('');
    setSelectedPickupPointName('');
    setPickupGeoId(null);
    pickupViewportSyncRef.current = { inFlight: '', lastResolved: '' };
  }, [pickupLocation]);

  const enrichedPickupPoints = useMemo(
    () => pickupPoints.map((point, index) => ({ ...point, __uiId: pickupUiId(point, index) })),
    [pickupPoints]
  );

  const selectedPickupPoint = useMemo(() => {
    if (!enrichedPickupPoints.length) return null;
    if (selectedPickupPointId) {
      const byServerId = enrichedPickupPoints.find((point) => point.id === selectedPickupPointId);
      if (byServerId) return byServerId;
    }
    if (selectedPickupPointUiId) {
      return enrichedPickupPoints.find((point) => point.__uiId === selectedPickupPointUiId) || null;
    }
    return null;
  }, [enrichedPickupPoints, selectedPickupPointId, selectedPickupPointUiId]);

  const itemsCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce(
      (sum, item) => sum + (item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity,
      0
    ),
    [items]
  );

  const selectedOffer = useMemo(
    () => deliveryOffers.find((offer) => offer.offerId === selectedOfferId),
    [deliveryOffers, selectedOfferId]
  );

  const deliveryAmount = useMemo(() => {
    const price = selectedOffer?.pricingTotal || selectedOffer?.pricing;
    return price ? moneyToNumber(price) : 0;
  }, [selectedOffer]);

  const fullDeliveryAddress = useMemo(
    () => buildFullDeliveryAddress(deliveryAddress, deliveryAddressDetails),
    [deliveryAddress, deliveryAddressDetails]
  );

  const totalWithDelivery = total + deliveryAmount;
  const deliveryLabel = selectedOfferId ? formatRub(deliveryAmount) : 'Рассчитаем после выбора адреса';
  const payableTotal = selectedOfferId ? totalWithDelivery : total;

  const formatInterval = useCallback((offer) => {
    if (!offer?.intervalFrom || !offer?.intervalTo) return 'Интервал уточняется';
    const from = new Date(offer.intervalFrom);
    const to = new Date(offer.intervalTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 'Интервал уточняется';
    const dateLabel = from.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
    const fromTime = from.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const toTime = to.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${dateLabel}, ${fromTime}–${toTime}`;
  }, []);

  const reviewDeliveryLabel = selectedOffer
    ? `${deliveryType === 'PICKUP' ? 'Самовывоз' : 'Курьер'}, ${formatInterval(selectedOffer)}`
    : 'Не выбрано';

  const processingNotice = isSubmitting
    ? createNotification({
        type: 'info',
        title: submitPhase === 'redirecting' ? 'Открываем оплату' : 'Оформляем заказ',
        message:
          submitPhase === 'redirecting'
            ? 'Сейчас откроется защищённая страница оплаты.'
            : 'Не закрывайте страницу. Если связь прервётся, можно безопасно повторить попытку с тем же заказом.'
      })
    : null;

  const topNotification = processingNotice || status;

  const draftPayload = useMemo(
    () => ({
      cartId: effectiveCartId,
      form: {
        activeStep,
        completedSteps,
        email,
        recipientFirstName,
        recipientLastName,
        recipientPhone,
        deliveryType,
        deliveryAddress,
        deliveryAddressDetails,
        showDeliveryAddressDetails,
        pickupLocation,
        pickupGeoId,
        pickupPoints,
        selectedPickupPointId,
        selectedPickupPointUiId,
        selectedPickupPointName,
        deliveryOffers,
        selectedOfferId,
        savePaymentMethod,
        expressMessage
      },
      itemSnapshot: liveItems.length ? liveItems : attempt.key || safeRetryState ? itemSnapshot : [],
      attempt,
      safeRetryState
    }),
    [
      activeStep,
      attempt,
      completedSteps,
      deliveryAddress,
      deliveryAddressDetails,
      deliveryOffers,
      deliveryType,
      effectiveCartId,
      email,
      expressMessage,
      itemSnapshot,
      liveItems,
      pickupGeoId,
      pickupLocation,
      pickupPoints,
      recipientFirstName,
      recipientLastName,
      recipientPhone,
      safeRetryState,
      savePaymentMethod,
      selectedOfferId,
      selectedPickupPointId,
      selectedPickupPointName,
      selectedPickupPointUiId,
      showDeliveryAddressDetails
    ]
  );

  useEffect(() => {
    if (!effectiveCartId) return;
    const hasContent = Boolean(
      draftPayload.itemSnapshot.length ||
      email.trim() ||
      recipientFirstName.trim() ||
      recipientLastName.trim() ||
      recipientPhone.trim() ||
      deliveryAddress.trim() ||
      pickupLocation.trim() ||
      selectedOfferId ||
      attempt.key ||
      safeRetryState
    );
    if (!hasContent) {
      clearCheckoutDraft(effectiveCartId);
      return;
    }
    saveCheckoutDraft(effectiveCartId, draftPayload);
  }, [
    attempt.key,
    deliveryAddress,
    draftPayload,
    effectiveCartId,
    email,
    recipientFirstName,
    recipientLastName,
    recipientPhone,
    pickupLocation,
    safeRetryState,
    selectedOfferId
  ]);

  useEffect(() => {
    if (!itemsCount || beginCheckoutTrackedRef.current) return;
    trackMetrikaGoal(METRIKA_GOALS.BEGIN_CHECKOUT, {
      cart_items: itemsCount,
      cart_total: Math.round(total)
    });
    beginCheckoutTrackedRef.current = true;
  }, [itemsCount, total]);

  useEffect(() => {
    const step = CHECKOUT_STEPS[activeStep];
    if (!step) return;
    trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_VIEW, {
      step: step.key,
      cart_items: itemsCount,
      cart_total: Math.round(payableTotal)
    });
  }, [activeStep, itemsCount, payableTotal]);

  useEffect(() => {
    if (!selectedOfferId || shippingTrackedOfferRef.current === selectedOfferId) return;
    shippingTrackedOfferRef.current = selectedOfferId;
    trackMetrikaGoal(METRIKA_GOALS.ADD_SHIPPING_INFO, {
      delivery_type: deliveryType,
      shipping_cost: Math.round(deliveryAmount),
      cart_total: Math.round(payableTotal)
    });
    trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_SHIPPING_SELECT, {
      delivery_type: deliveryType,
      offer_id: selectedOfferId,
      shipping_cost: Math.round(deliveryAmount)
    });
  }, [deliveryAmount, deliveryType, payableTotal, selectedOfferId]);

  useEffect(() => {
    if (activeStep !== 3 || paymentStepTrackedRef.current) return;
    trackMetrikaGoal(METRIKA_GOALS.ADD_PAYMENT_INFO, {
      delivery_type: deliveryType,
      cart_total: Math.round(payableTotal)
    });
    paymentStepTrackedRef.current = true;
  }, [activeStep, deliveryType, payableTotal]);

  useEffect(() => {
    if (activeStep !== 3 && expressMessage) {
      setExpressMessage('');
    }
  }, [activeStep, expressMessage]);

  const currentAttemptSignature = useMemo(() => {
    return buildCheckoutAttemptSignature({
      cartId: effectiveCartId,
      receiptEmail: email.trim(),
      returnUrl: buildAbsoluteAppUrl('/order/{token}'),
      orderPageUrl: buildAbsoluteAppUrl('/order/{token}'),
      savePaymentMethod: isAuthenticated ? savePaymentMethod : false,
      delivery: {
        deliveryType,
        offerId: selectedOfferId,
        address: deliveryType === 'COURIER' ? fullDeliveryAddress : null,
        pickupPointId: deliveryType === 'PICKUP' ? selectedPickupPointId : null,
        pickupPointName: deliveryType === 'PICKUP' ? selectedPickupPointName : null,
        intervalFrom: selectedOffer?.intervalFrom || null,
        intervalTo: selectedOffer?.intervalTo || null,
        firstName: recipientFirstName.trim(),
        lastName: recipientLastName.trim() || null,
        phone: recipientPhone.trim(),
        email: email.trim()
      }
    });
  }, [
    deliveryType,
    effectiveCartId,
    email,
    fullDeliveryAddress,
    isAuthenticated,
    recipientFirstName,
    recipientLastName,
    recipientPhone,
    savePaymentMethod,
    selectedOffer,
    selectedOfferId,
    selectedPickupPointId,
    selectedPickupPointName
  ]);

  useEffect(() => {
    if (!safeRetryState || !attempt.signature) return;
    if (currentAttemptSignature !== attempt.signature) {
      setSafeRetryState(null);
    }
  }, [attempt.signature, currentAttemptSignature, safeRetryState]);

  const clearFieldError = useCallback((field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: '' };
    });
  }, []);

  const applyStepFieldErrors = useCallback((keys, errors) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      keys.forEach((key) => {
        next[key] = errors[key] || '';
      });
      return next;
    });
  }, []);

  const markCompleted = useCallback((stepKey) => {
    setCompletedSteps((prev) => ({ ...prev, [stepKey]: true }));
  }, []);

  const validateStep = useCallback((stepKey) => {
    const errors = validateCheckoutStep(stepKey, {
      email,
      recipientFirstName,
      recipientPhone,
      deliveryType,
      fullDeliveryAddress,
      pickupLocation,
      selectedPickupPointId,
      selectedOfferId
    });
    const fields = STEP_FIELD_ORDER[stepKey] || [];
    applyStepFieldErrors(fields, errors);
    const firstErrorField = fields.find((field) => Boolean(errors[field]));
    if (firstErrorField) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_FIELD_ERROR, {
        step: stepKey,
        field: firstErrorField
      });
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }, [
    applyStepFieldErrors,
    deliveryType,
    email,
    fullDeliveryAddress,
    pickupLocation,
    recipientFirstName,
    recipientPhone,
    selectedOfferId,
    selectedPickupPointId
  ]);

  const applyBackendErrors = useCallback((error) => {
    const mapped = mapCheckoutBackendErrors({
      details: isApiRequestError(error) ? error.details : null,
      message: error?.message || ''
    });
    if (!Object.keys(mapped.fieldErrors).length) {
      return false;
    }
    setFieldErrors((prev) => ({ ...prev, ...mapped.fieldErrors }));
    if (Number.isInteger(mapped.nextStep)) {
      setActiveStep(mapped.nextStep);
    }
    return true;
  }, []);

  const applyPickupSelection = useCallback((point) => {
    if (!point) return;
    setSelectedPickupPointId(point.id || '');
    setSelectedPickupPointUiId(point.__uiId || pickupUiId(point, 0));
    setSelectedPickupPointName(point.name || point.address || '');
    setDeliveryError('');
    clearFieldError('selectedPickupPointId');
  }, [clearFieldError]);

  const getBrowserPosition = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          reject(new Error('Geolocation is unavailable'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      }),
    []
  );

  const resolveCityFromCoordinates = useCallback(async (latitude, longitude) => {
    const apiKey =
      process.env.REACT_APP_YANDEX_GEOCODER_API_KEY ||
      process.env.REACT_APP_YANDEX_MAPS_API_KEY ||
      process.env.REACT_APP_YANDEX_MAPS_JS_API_KEY ||
      '';
    if (!apiKey) {
      return detectCityByTimezone();
    }

    const query = new URLSearchParams({
      apikey: apiKey,
      format: 'json',
      lang: 'ru_RU',
      geocode: `${longitude},${latitude}`,
      results: '1'
    });

    const response = await fetch(`https://geocode-maps.yandex.ru/1.x/?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to reverse geocode location (${response.status})`);
    }

    const payload = await response.json();
    const city = extractCityFromGeocodeResponse(payload);
    return city || detectCityByTimezone();
  }, []);

  const populatePickupPoints = useCallback((response, options = {}) => {
    const { autoSelectFirst = true, preserveSelection = true } = options;
    const points = Array.isArray(response?.points) ? response.points : [];
    const pointsWithUi = points.map((point, index) => ({ ...point, __uiId: pickupUiId(point, index) }));

    setPickupPoints(points);
    setPickupGeoId(response?.geoId ?? null);

    if (!pointsWithUi.length) {
      setSelectedPickupPointId('');
      setSelectedPickupPointUiId('');
      setSelectedPickupPointName('');
      return 0;
    }

    const preservedByServerId = preserveSelection && selectedPickupPointId
      ? pointsWithUi.find((point) => point.id === selectedPickupPointId)
      : null;
    const preservedByUiId = preserveSelection && selectedPickupPointUiId
      ? pointsWithUi.find((point) => point.__uiId === selectedPickupPointUiId)
      : null;
    const preservedSelection = preservedByServerId || preservedByUiId || null;

    if (preservedSelection) {
      applyPickupSelection(preservedSelection);
      return pointsWithUi.length;
    }

    if (autoSelectFirst) {
      const firstSelectable = pointsWithUi.find((point) => Boolean(point.id)) || pointsWithUi[0];
      applyPickupSelection(firstSelectable);
      return pointsWithUi.length;
    }

    setSelectedPickupPointId('');
    setSelectedPickupPointUiId('');
    setSelectedPickupPointName('');
    return pointsWithUi.length;
  }, [applyPickupSelection, selectedPickupPointId, selectedPickupPointUiId]);

  const fetchPickupPointsByLocation = useCallback(async (locationLabel, options = {}) => {
    const trimmedLocation = (locationLabel || '').trim();
    if (!trimmedLocation) {
      throw new Error('Location is required');
    }
    const response = await getYandexPickupPoints({ location: trimmedLocation });
    return populatePickupPoints(response, options);
  }, [populatePickupPoints]);

  const fetchPickupPointsByViewport = useCallback(async (bounds, options = {}) => {
    const normalizedBounds = normalizeViewportBounds(bounds);
    if (!normalizedBounds) {
      throw new Error('Viewport bounds are required');
    }
    const response = await getYandexPickupPoints(normalizedBounds);
    return populatePickupPoints(response, options);
  }, [populatePickupPoints]);

  const preloadPickupPointsByCities = useCallback(async (cities = []) => {
    const candidates = uniqueCities(cities);
    for (const city of candidates) {
      try {
        const pointsCount = await fetchPickupPointsByLocation(city);
        if (pointsCount > 0) {
          return { ok: true, city };
        }
      } catch (err) {
        console.warn(`Failed to preload pickup points for city "${city}":`, err);
      }
    }
    return { ok: false, city: candidates[candidates.length - 1] || '' };
  }, [fetchPickupPointsByLocation]);

  const handleMapViewportChange = useCallback(async (bounds) => {
    if (!isPickupMapOpen) return;
    const normalizedBounds = normalizeViewportBounds(bounds);
    if (!normalizedBounds) return;
    const token = viewportToken(normalizedBounds);

    if (pickupViewportSyncRef.current.inFlight === token || pickupViewportSyncRef.current.lastResolved === token) {
      return;
    }

    pickupViewportSyncRef.current.inFlight = token;
    setDeliveryError('');
    setPickupLoading(true);

    try {
      const pointsCount = await fetchPickupPointsByViewport(normalizedBounds, {
        autoSelectFirst: false,
        preserveSelection: true
      });
      pickupViewportSyncRef.current.lastResolved = token;
      if (pointsCount <= 0) {
        setDeliveryError('В текущей зоне карты не найдено пунктов выдачи. Измените масштаб или переместите карту.');
      }
    } catch (err) {
      console.error('Failed to refresh pickup points for current map viewport:', err);
      if (isApiRequestError(err) && typeof err.details?.message === 'string' && err.details.message.trim()) {
        setDeliveryError(err.details.message.trim());
      } else {
        setDeliveryError('Не удалось обновить пункты выдачи для текущей области карты.');
      }
    } finally {
      if (pickupViewportSyncRef.current.inFlight === token) {
        pickupViewportSyncRef.current.inFlight = '';
      }
      setPickupLoading(false);
    }
  }, [fetchPickupPointsByViewport, isPickupMapOpen]);

  const handleExpressCheckout = useCallback((providerLabel) => {
    setExpressMessage(
      `${providerLabel} будет доступен на защищённой платёжной странице, если поддерживается вашим устройством и банком.`
    );
  }, []);

  const handleContactNext = useCallback(() => {
    setStatus(null);
    const result = validateStep('contact');
    if (!result.valid) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'contact', outcome: 'fail' });
      setActiveStep(0);
      return;
    }

    trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'contact', outcome: 'success' });
    markCompleted('contact');
    setActiveStep(1);
  }, [markCompleted, validateStep]);

  const handleRecipientNext = useCallback(() => {
    setStatus(null);
    if (!validateStep('contact').valid) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'recipient', outcome: 'fail', reason: 'contact' });
      setActiveStep(0);
      return;
    }
    if (!validateStep('recipient').valid) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'recipient', outcome: 'fail', reason: 'recipient' });
      setActiveStep(1);
      return;
    }

    trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'recipient', outcome: 'success' });
    markCompleted('recipient');
    setActiveStep(2);
  }, [markCompleted, validateStep]);

  const handleDeliveryNext = useCallback(() => {
    setStatus(null);
    if (!validateStep('contact').valid) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'delivery', outcome: 'fail', reason: 'contact' });
      setActiveStep(0);
      return;
    }
    if (!validateStep('recipient').valid) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'delivery', outcome: 'fail', reason: 'recipient' });
      setActiveStep(1);
      return;
    }
    if (!validateStep('delivery').valid) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'delivery', outcome: 'fail', reason: 'delivery' });
      setActiveStep(2);
      return;
    }

    trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'delivery', outcome: 'success' });
    markCompleted('delivery');
    setActiveStep(3);
  }, [markCompleted, validateStep]);

  const handlePickupSearch = useCallback(async () => {
    setDeliveryError('');

    if (!pickupLocation.trim()) {
      applyStepFieldErrors(['pickupLocation'], {
        pickupLocation: 'Укажите город или адрес для поиска пунктов выдачи.'
      });
      return;
    }

    setPickupLoading(true);
    try {
      const city = pickupLocation.trim();
      const pointsCount = await fetchPickupPointsByLocation(city);
      clearFieldError('pickupLocation');
      if (pointsCount <= 0) {
        setDeliveryError('По указанному городу не найдено пунктов выдачи. Уточните запрос.');
      }
    } catch (err) {
      console.error('Failed to load pickup points:', err);
      if (isApiRequestError(err) && typeof err.details?.message === 'string' && err.details.message.trim()) {
        setDeliveryError(err.details.message.trim());
      } else {
        setDeliveryError('Не удалось загрузить пункты выдачи. Попробуйте ещё раз.');
      }
    } finally {
      setPickupLoading(false);
    }
  }, [applyStepFieldErrors, clearFieldError, fetchPickupPointsByLocation, pickupLocation]);

  const handleOpenPickupMap = useCallback(async () => {
    setIsPickupMapOpen(true);
    setDeliveryError('');
    pickupViewportSyncRef.current = { inFlight: '', lastResolved: '' };

    if (pickupPoints.length || pickupLoading || pickupAutoDetecting) {
      return;
    }

    const typedLocation = pickupLocation.trim();
    if (typedLocation) {
      setPickupLoading(true);
      try {
        const pointsCount = await fetchPickupPointsByLocation(typedLocation);
        if (pointsCount <= 0) {
          setDeliveryError('В выбранном городе не найдены пункты выдачи. Уточните город или выберите другой.');
        }
      } catch (err) {
        console.error('Failed to preload pickup points:', err);
        if (isApiRequestError(err) && typeof err.details?.message === 'string' && err.details.message.trim()) {
          setDeliveryError(err.details.message.trim());
        } else {
          setDeliveryError('Не удалось загрузить пункты выдачи. Проверьте город или попробуйте позже.');
        }
      } finally {
        setPickupLoading(false);
      }
      return;
    }

    setPickupAutoDetecting(true);
    try {
      const position = await getBrowserPosition();
      const detectedCity = await resolveCityFromCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );
      setPickupLoading(true);
      try {
        const preloadResult = await preloadPickupPointsByCities([
          detectedCity,
          detectCityByTimezone(),
          DEFAULT_PICKUP_CITY
        ]);
        if (!preloadResult.ok) {
          setDeliveryError('Карта открыта. Не удалось определить город, используем Москву по умолчанию.');
        }
      } finally {
        setPickupLoading(false);
      }
    } catch (err) {
      console.warn('Could not detect city automatically:', err);
      setPickupLoading(true);
      try {
        const preloadResult = await preloadPickupPointsByCities([
          detectCityByTimezone(),
          DEFAULT_PICKUP_CITY
        ]);
        if (!preloadResult.ok) {
          setDeliveryError('Карта открыта. Используем Москву по умолчанию, укажите город вручную при необходимости.');
        }
      } finally {
        setPickupLoading(false);
      }
    } finally {
      setPickupAutoDetecting(false);
    }
  }, [
    fetchPickupPointsByLocation,
    getBrowserPosition,
    pickupAutoDetecting,
    pickupLoading,
    pickupLocation,
    pickupPoints.length,
    preloadPickupPointsByCities,
    resolveCityFromCoordinates
  ]);

  const handleFetchOffers = useCallback(async () => {
    setDeliveryError('');

    if (!items.length) {
      setDeliveryError('Корзина пуста. Добавьте товары перед оформлением заказа.');
      return;
    }
    if (!validateStep('contact').valid) {
      setActiveStep(0);
      return;
    }
    if (!validateStep('recipient').valid) {
      setActiveStep(1);
      return;
    }

    const deliveryFieldErrors = validateCheckoutForOfferFetch({
      deliveryType,
      fullDeliveryAddress,
      selectedPickupPointId
    });
    if (Object.keys(deliveryFieldErrors).length) {
      applyStepFieldErrors(['deliveryAddress', 'selectedPickupPointId'], deliveryFieldErrors);
      return;
    }

    setDeliveryLoading(true);
    try {
      const id = effectiveCartId || getStoredCartId();
      const response = await getYandexDeliveryOffers({
        cartId: id,
        deliveryType,
        address: deliveryType === 'COURIER' ? fullDeliveryAddress : null,
        pickupPointId: deliveryType === 'PICKUP' ? selectedPickupPointId : null,
        pickupPointName: deliveryType === 'PICKUP' ? selectedPickupPointName : null,
        firstName: recipientFirstName.trim(),
        lastName: recipientLastName.trim(),
        phone: recipientPhone.trim(),
        email: email.trim()
      });

      const offers = Array.isArray(response?.offers) ? response.offers : [];
      setDeliveryOffers(offers);
      setSelectedOfferId(offers.length ? offers[0].offerId : '');

      if (!offers.length) {
        setDeliveryError('Нет доступных интервалов. Проверьте адрес или выберите другой пункт выдачи.');
      } else {
        clearFieldError('selectedOfferId');
      }
    } catch (err) {
      console.error('Failed to load delivery offers:', err);
      if (isApiRequestError(err) && typeof err.details?.message === 'string' && err.details.message.trim()) {
        setDeliveryError(err.details.message.trim());
      } else {
        setDeliveryError('Не удалось рассчитать доставку. Попробуйте ещё раз.');
      }
      setDeliveryOffers([]);
      setSelectedOfferId('');
    } finally {
      setDeliveryLoading(false);
    }
  }, [
    applyStepFieldErrors,
    clearFieldError,
    deliveryType,
    effectiveCartId,
    email,
    fullDeliveryAddress,
    items.length,
    recipientFirstName,
    recipientLastName,
    recipientPhone,
    selectedPickupPointId,
    selectedPickupPointName,
    validateStep
  ]);

  useEffect(() => {
    if (activeStep !== 2) return;
    if (!items.length) return;
    if (!isEmailValid(email.trim())) return;
    if (!recipientFirstName.trim() || !recipientPhone.trim()) return;
    if (deliveryType === 'COURIER' && !fullDeliveryAddress) return;
    if (deliveryType === 'PICKUP' && !selectedPickupPointId) return;

    const signature = [
      deliveryType,
      fullDeliveryAddress,
      selectedPickupPointId,
      recipientFirstName.trim(),
      recipientLastName.trim(),
      recipientPhone.trim(),
      email.trim(),
      items.length
    ].join('|');

    if (autoOfferFetchRef.current === signature) return;

    const timer = setTimeout(() => {
      autoOfferFetchRef.current = signature;
      handleFetchOffers();
    }, 420);

    return () => clearTimeout(timer);
  }, [
    activeStep,
    deliveryType,
    email,
    fullDeliveryAddress,
    handleFetchOffers,
    items,
    recipientFirstName,
    recipientLastName,
    recipientPhone,
    selectedPickupPointId
  ]);

  const clearRecoveryState = useCallback(() => {
    setSafeRetryState(null);
  }, []);

  const clearStatus = useCallback(() => {
    setStatus(null);
  }, []);

  const handlePickupPointSelect = useCallback((point) => {
    clearStatus();
    clearRecoveryState();
    applyPickupSelection(point);
  }, [applyPickupSelection, clearRecoveryState, clearStatus]);

  const handleEmailBlur = useCallback(() => {
    validateStep('contact');
  }, [validateStep]);

  const submitCheckout = useCallback(async ({ retrying = false } = {}) => {
    setStatus(null);

    if (!items.length) {
      setStatus(createNotification({
        type: 'error',
        title: 'Корзина пуста',
        message: 'Добавьте товары перед оформлением заказа.'
      }));
      return;
    }

    if (!retrying) {
      if (!validateStep('contact').valid) {
        setActiveStep(0);
        return;
      }
      if (!validateStep('recipient').valid) {
        setActiveStep(1);
        return;
      }
      if (!validateStep('delivery').valid) {
        setActiveStep(2);
        return;
      }
    }

    const payload = {
      cartId: effectiveCartId || getStoredCartId(),
      receiptEmail: email.trim(),
      returnUrl: buildAbsoluteAppUrl('/order/{token}'),
      orderPageUrl: buildAbsoluteAppUrl('/order/{token}'),
      savePaymentMethod: isAuthenticated ? savePaymentMethod : false,
      delivery: {
        deliveryType,
        offerId: selectedOfferId,
        address: deliveryType === 'COURIER' ? fullDeliveryAddress : null,
        pickupPointId: deliveryType === 'PICKUP' ? selectedPickupPointId : null,
        pickupPointName: deliveryType === 'PICKUP' ? selectedPickupPointName : null,
        intervalFrom: selectedOffer?.intervalFrom || null,
        intervalTo: selectedOffer?.intervalTo || null,
        firstName: recipientFirstName.trim(),
        lastName: recipientLastName.trim() || null,
        phone: recipientPhone.trim(),
        email: email.trim()
      }
    };

    const signature = buildCheckoutAttemptSignature(payload);
    const nextAttempt = resolveCheckoutAttempt({
      cartId: payload.cartId,
      signature,
      existingAttempt: attempt.key ? attempt : null
    });

    setAttempt(nextAttempt);
    setSafeRetryState(null);
    setSubmitPhase('submitting');
    setIsSubmitting(true);

    const timeoutController = createTimeoutController(CHECKOUT_REQUEST_TIMEOUT_MS);

    try {
      const response = await checkoutCart({
        ...payload,
        idempotencyKey: nextAttempt.key,
        signal: timeoutController.signal
      });

      const orderToken = response?.order?.publicToken || nextAttempt.orderToken || '';
      if (orderToken) {
        setAttempt((prev) => ({ ...prev, orderToken }));
      }

      const confirmationUrl = response?.payment?.confirmationUrl;
      if (confirmationUrl) {
        trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_PAYMENT_RESULT, {
          outcome: 'success',
          delivery_type: deliveryType,
          cart_total: Math.round(payableTotal)
        });
        clearCheckoutDraft(payload.cartId);
        setSubmitPhase('redirecting');
        window.location.href = confirmationUrl;
        return;
      }

      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_PAYMENT_RESULT, {
        outcome: 'fail',
        reason: 'missing_confirmation_url'
      });
      setActiveStep(3);
      setSafeRetryState(createSafeRetryState('missing_confirmation', {
        orderToken,
        message: 'Заказ уже создан, но платёжная ссылка не пришла. Попробуйте безопасно запросить её ещё раз.'
      }));
      setStatus(createNotification({
        type: 'error',
        title: 'Не удалось открыть оплату',
        message: 'Заказ уже создан. Повторите безопасную проверку или откройте страницу заказа.'
      }));
    } catch (err) {
      console.error('Checkout failed:', err);
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_PAYMENT_RESULT, {
        outcome: 'fail',
        reason: isApiRequestError(err) ? `http_${err.status}` : isAbortError(err) ? 'timeout' : 'client_error'
      });

      const handled = applyBackendErrors(err);
      if (handled) {
        setStatus(createNotification({
          type: 'error',
          title: 'Проверьте форму',
          message: 'Исправьте отмеченные поля и попробуйте снова.'
        }));
        setSafeRetryState(null);
      } else if (isApiRequestError(err) && err.status === 409) {
        setActiveStep(3);
        setSafeRetryState(createSafeRetryState('conflict', {
          orderToken: nextAttempt.orderToken || attempt.orderToken || '',
          message: typeof err.details?.message === 'string' && err.details.message.trim()
            ? err.details.message.trim()
            : ''
        }));
        setStatus(createNotification({
          type: 'warning',
          title: 'Заказ уже обрабатывается',
          message: 'Подождите немного и выполните безопасную проверку ещё раз.'
        }));
      } else if (
        isAbortError(err) ||
        !isApiRequestError(err) ||
        (isApiRequestError(err) && err.status >= 500 && err.details?.recoverable !== false)
      ) {
        setActiveStep(3);
        setSafeRetryState(createSafeRetryState('timeout', {
          orderToken: nextAttempt.orderToken || attempt.orderToken || ''
        }));
        setStatus(createNotification({
          type: 'warning',
          title: 'Связь нестабильна',
          message: 'Мы сохранили попытку оформления. Повторная проверка не создаст дубль заказа.'
        }));
      } else if (isApiRequestError(err) && typeof err.details?.message === 'string' && err.details.message.trim()) {
        setStatus(createNotification({
          type: 'error',
          title: 'Не удалось оформить заказ',
          message: err.details.message.trim()
        }));
      } else if (typeof err?.message === 'string' && err.message.trim()) {
        setStatus(createNotification({
          type: 'error',
          title: 'Не удалось оформить заказ',
          message: err.message.trim()
        }));
      } else {
        setStatus(createNotification({
          type: 'error',
          title: 'Не удалось оформить заказ',
          message: 'Попробуйте ещё раз.'
        }));
      }
    } finally {
      timeoutController.cancel();
      setSubmitPhase('idle');
      setIsSubmitting(false);
    }
  }, [
    applyBackendErrors,
    attempt,
    deliveryType,
    email,
    effectiveCartId,
    fullDeliveryAddress,
    isAuthenticated,
    items.length,
    payableTotal,
    recipientFirstName,
    recipientLastName,
    recipientPhone,
    savePaymentMethod,
    selectedOffer,
    selectedOfferId,
    selectedPickupPointId,
    selectedPickupPointName,
    validateStep
  ]);

  const handleSubmit = useCallback(async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    await submitCheckout({ retrying: false });
  }, [submitCheckout]);

  const handleSafeRetry = useCallback(async () => {
    await submitCheckout({ retrying: true });
  }, [submitCheckout]);

  const mobileAction = activeStep === 0
    ? {
        label: 'Продолжить',
        subtitle: 'Шаг 1 из 4 · Контакт',
        action: handleContactNext,
        disabled: isSubmitting
      }
    : activeStep === 1
    ? {
        label: 'К доставке',
        subtitle: 'Шаг 2 из 4 · Получатель',
        action: handleRecipientNext,
        disabled: isSubmitting
      }
    : activeStep === 2
    ? {
        label: 'К подтверждению',
        subtitle: 'Шаг 3 из 4 · Доставка',
        action: handleDeliveryNext,
        disabled: deliveryLoading || isSubmitting
      }
    : {
        label: isSubmitting
          ? 'Оформляем заказ…'
          : safeRetryState?.retryLabel || 'Перейти к оплате',
        subtitle: safeRetryState
          ? 'Шаг 4 из 4 · Безопасная проверка'
          : 'Шаг 4 из 4 · Подтверждение',
        action: safeRetryState
          ? handleSafeRetry
          : () => {
              const form = document.getElementById('checkout-form');
              if (form) form.requestSubmit();
            },
        disabled: isSubmitting
      };

  return {
    isManager,
    activeStep,
    setActiveStep,
    completedSteps,
    fieldErrors,
    clearFieldError,
    email,
    setEmail,
    recipientFirstName,
    setRecipientFirstName,
    recipientLastName,
    setRecipientLastName,
    recipientPhone,
    setRecipientPhone,
    deliveryType,
    setDeliveryType: (nextType) => {
      setDeliveryType(nextType);
      if (nextType === 'COURIER') {
        clearFieldError('selectedPickupPointId');
      } else {
        clearFieldError('deliveryAddress');
      }
    },
    deliveryAddress,
    setDeliveryAddress,
    deliveryAddressDetails,
    setDeliveryAddressDetails,
    showDeliveryAddressDetails,
    setShowDeliveryAddressDetails,
    pickupLocation,
    setPickupLocation,
    pickupGeoId,
    selectedPickupPoint,
    selectedPickupPointId,
    selectedPickupPointName,
    deliveryOffers,
    selectedOfferId,
    setSelectedOfferId: (offerId) => {
      setSelectedOfferId(offerId);
      clearFieldError('selectedOfferId');
    },
    pickupLoading,
    pickupAutoDetecting,
    deliveryLoading,
    deliveryError,
    topNotification,
    isSubmitting,
    savePaymentMethod,
    setSavePaymentMethod,
    isPickupMapOpen,
    setIsPickupMapOpen,
    expressMessage,
    submitLabel: isSubmitting ? 'Оформляем заказ…' : 'Перейти к оплате',
    mobileAction,
    processingNotice,
    safeRetryState,
    handleSafeRetry,
    items,
    itemsCount,
    total,
    deliveryLabel,
    payableTotal,
    reviewDeliveryLabel,
    fullDeliveryAddress,
    enrichedPickupPoints,
    handleMapViewportChange,
    handlePickupSearch,
    handleOpenPickupMap,
    handleFetchOffers,
    handleExpressCheckout,
    handleContactNext,
    handleRecipientNext,
    handleDeliveryNext,
    handleSubmit,
    formatInterval,
    formatRub,
    moneyToNumber,
    isAuthenticated,
    clearStatus,
    clearRecoveryState,
    handlePickupPointSelect,
    handleEmailBlur
  };
}

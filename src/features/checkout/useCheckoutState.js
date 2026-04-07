import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePaymentConfig } from '../../contexts/PaymentConfigContext';
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
import { getDeliveryClientConfig } from '../../utils/deliveryConfig';
import {
  hasEmbeddedPaymentSession,
  isEmbeddedPaymentMode,
  normalizePaymentSession
} from '../../utils/payment';
import { CHECKOUT_REQUEST_TIMEOUT_MS, CHECKOUT_STEPS } from './constants';
import { clearCheckoutDraft, loadCheckoutDraft, saveCheckoutDraft } from './draftStorage';
import {
  loadLastConfirmedPickupLocation,
  saveLastConfirmedPickupLocation
} from './locationStorage';
import {
  createInitialAttempt,
  createInitialCompletedSteps,
  createInitialSafeRetryState,
  createPickupLocationSuggestion,
  createSafeRetryState,
  createTimeoutController,
  getStoredCartId
} from './state';
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
  viewportToken
} from './utils';

export function useCheckoutState() {
  const navigate = useNavigate();
  const { items: liveItems, cartId } = useContext(CartContext);
  const { tokenParsed, isAuthenticated, hasRole } = useAuth();
  const { paymentConfig, isPaymentConfigLoaded } = usePaymentConfig();
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);
  const deliveryClientConfig = useMemo(() => getDeliveryClientConfig(), []);

  const initialCartIdRef = useRef(cartId || getStoredCartId());
  const initialDraftRef = useRef(loadCheckoutDraft(initialCartIdRef.current) || {});
  const initialDraft = initialDraftRef.current;
  const initialAttemptRef = useRef(createInitialAttempt(initialDraft));
  const initialAttempt = initialAttemptRef.current;
  const formDraft = initialDraft.form || {};
  const initialStoredPickupLocationRef = useRef(loadLastConfirmedPickupLocation());
  const initialStoredPickupLocation = initialStoredPickupLocationRef.current;

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
  const [pickupLocation, setPickupLocation] = useState(
    formDraft.pickupLocation || initialStoredPickupLocation || ''
  );
  const [pickupGeoId, setPickupGeoId] = useState(formDraft.pickupGeoId ?? null);
  const [pickupPoints, setPickupPoints] = useState(Array.isArray(formDraft.pickupPoints) ? formDraft.pickupPoints : []);
  const [selectedPickupPointId, setSelectedPickupPointId] = useState(formDraft.selectedPickupPointId || '');
  const [selectedPickupPointUiId, setSelectedPickupPointUiId] = useState(formDraft.selectedPickupPointUiId || '');
  const [selectedPickupPointName, setSelectedPickupPointName] = useState(formDraft.selectedPickupPointName || '');
  const [pickupLocationSuggestion, setPickupLocationSuggestion] = useState(null);

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

  useEffect(() => {
    if (!pickupLocationSuggestion) {
      return;
    }
    const normalizedPickupLocation = pickupLocation.trim().toLowerCase();
    const normalizedSuggestedCity = String(pickupLocationSuggestion.city || '').trim().toLowerCase();
    if (normalizedPickupLocation && normalizedPickupLocation !== normalizedSuggestedCity) {
      setPickupLocationSuggestion(null);
    }
  }, [pickupLocation, pickupLocationSuggestion]);

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
  const checkoutSubmitLabel = isEmbeddedPaymentMode(paymentConfig)
    ? 'Создать заказ и открыть форму оплаты'
    : 'Перейти к оплате';

  const processingNotice = isSubmitting
    ? createNotification({
        type: 'info',
        title: submitPhase === 'redirecting' ? 'Открываем оплату' : 'Оформляем заказ',
        message:
          submitPhase === 'redirecting'
            ? isEmbeddedPaymentMode(paymentConfig)
              ? 'Сейчас откроется встроенная защищённая форма оплаты.'
              : 'Сейчас откроется защищённая страница оплаты.'
            : 'Не закрывайте страницу. Если связь прервётся, можно безопасно повторить попытку с тем же заказом.'
      })
    : null;

  const topNotification = processingNotice || status;

  const pickupLocationHint = useMemo(() => {
    if (deliveryType !== 'PICKUP' || pickupLocationSuggestion || pickupLocation.trim() || selectedPickupPointId) {
      return null;
    }

    if (!deliveryClientConfig.canReverseGeocode) {
      return {
        title: 'Введите ваш город',
        message: deliveryClientConfig.canRenderPickupMap
          ? 'Автоопределение города недоступно. Введите город вручную, затем загрузите пункты выдачи.'
          : 'Автоопределение и карта недоступны в текущей конфигурации. Введите город вручную, затем загрузите пункты выдачи.'
      };
    }

    return {
      title: 'Введите ваш город',
      message:
        'Введите город вручную или подтвердите предложенный город перед загрузкой пунктов выдачи.'
    };
  }, [
    deliveryClientConfig.canRenderPickupMap,
    deliveryClientConfig.canReverseGeocode,
    deliveryType,
    pickupLocation,
    pickupLocationSuggestion,
    selectedPickupPointId
  ]);

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

  useEffect(() => {
    if (deliveryType !== 'PICKUP' && pickupLocationSuggestion) {
      setPickupLocationSuggestion(null);
    }
  }, [deliveryType, pickupLocationSuggestion]);

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
    const apiKey = deliveryClientConfig.geocoderKey;
    if (!apiKey) {
      return '';
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
    return city || '';
  }, [deliveryClientConfig.geocoderKey]);

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

  const loadPickupPointsForLocation = useCallback(async (
    locationLabel,
    {
      openMap = false,
      autoSelectFirst = true,
      preserveSelection = true,
      emptyMessage = 'По указанному городу не найдено пунктов выдачи. Уточните запрос.',
      failureMessage = 'Не удалось загрузить пункты выдачи. Попробуйте ещё раз.'
    } = {}
  ) => {
    const normalizedLocation = String(locationLabel || '').trim();
    if (!normalizedLocation) {
      return 0;
    }

    if (openMap) {
      setIsPickupMapOpen(true);
    }

    setPickupLoading(true);
    try {
      const pointsCount = await fetchPickupPointsByLocation(normalizedLocation, {
        autoSelectFirst,
        preserveSelection
      });
      clearFieldError('pickupLocation');
      setPickupLocationSuggestion(null);
      saveLastConfirmedPickupLocation(normalizedLocation);
      if (pointsCount <= 0) {
        setDeliveryError(emptyMessage);
      }
      return pointsCount;
    } catch (err) {
      console.error('Failed to load pickup points:', err);
      if (isApiRequestError(err) && typeof err.details?.message === 'string' && err.details.message.trim()) {
        setDeliveryError(err.details.message.trim());
      } else {
        setDeliveryError(failureMessage);
      }
      return 0;
    } finally {
      setPickupLoading(false);
    }
  }, [clearFieldError, fetchPickupPointsByLocation]);

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
      isEmbeddedPaymentMode(paymentConfig)
        ? `${providerLabel} будет доступен во встроенной защищённой форме оплаты, если поддерживается вашим устройством и банком.`
        : `${providerLabel} будет доступен на защищённой платёжной странице, если поддерживается вашим устройством и банком.`
    );
  }, [paymentConfig]);

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

    await loadPickupPointsForLocation(pickupLocation, {
      preserveSelection: false,
      emptyMessage: 'По указанному городу не найдено пунктов выдачи. Уточните запрос.',
      failureMessage: 'Не удалось загрузить пункты выдачи. Попробуйте ещё раз.'
    });
  }, [applyStepFieldErrors, loadPickupPointsForLocation, pickupLocation]);

  const handleOpenPickupMap = useCallback(async () => {
    setDeliveryError('');
    pickupViewportSyncRef.current = { inFlight: '', lastResolved: '' };

    if (pickupLoading || pickupAutoDetecting) {
      return;
    }
    if (pickupPoints.length) {
      setIsPickupMapOpen(true);
      return;
    }

    const typedLocation = pickupLocation.trim();
    const rememberedLocation = loadLastConfirmedPickupLocation();
    if (typedLocation) {
      await loadPickupPointsForLocation(typedLocation, {
        openMap: true,
        autoSelectFirst: false,
        preserveSelection: false,
        emptyMessage: 'В выбранном городе не найдены пункты выдачи. Уточните город или выберите другой.',
        failureMessage: 'Не удалось загрузить пункты выдачи. Проверьте город или попробуйте позже.'
      });
      return;
    }
    if (rememberedLocation) {
      setPickupLocation(rememberedLocation);
      await loadPickupPointsForLocation(rememberedLocation, {
        openMap: true,
        autoSelectFirst: false,
        preserveSelection: false,
        emptyMessage: 'В последнем выбранном городе не найдены пункты выдачи. Уточните город или выберите другой.',
        failureMessage: 'Не удалось загрузить пункты выдачи. Проверьте город или попробуйте позже.'
      });
      return;
    }

    setPickupAutoDetecting(true);
    try {
      if (deliveryClientConfig.canReverseGeocode) {
        try {
          const position = await getBrowserPosition();
          const detectedCity = await resolveCityFromCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );
          if (detectedCity) {
            setPickupLocationSuggestion(createPickupLocationSuggestion(detectedCity, 'geocoder'));
            return;
          }
        } catch (err) {
          console.warn('Could not detect city automatically:', err);
        }
      }

      const timezoneCity = detectCityByTimezone();
      if (timezoneCity) {
        setPickupLocationSuggestion(createPickupLocationSuggestion(timezoneCity, 'timezone'));
      } else {
        setDeliveryError('Введите ваш город, чтобы увидеть пункты выдачи.');
      }
    } finally {
      setPickupAutoDetecting(false);
    }
  }, [
    detectCityByTimezone,
    getBrowserPosition,
    loadPickupPointsForLocation,
    deliveryClientConfig.canReverseGeocode,
    pickupAutoDetecting,
    pickupLoading,
    pickupLocation,
    pickupPoints.length,
    resolveCityFromCoordinates
  ]);

  const handleConfirmPickupLocationSuggestion = useCallback(async () => {
    const suggestedCity = String(pickupLocationSuggestion?.city || '').trim();
    if (!suggestedCity) {
      return;
    }

    setPickupLocation(suggestedCity);
    await loadPickupPointsForLocation(suggestedCity, {
      openMap: true,
      autoSelectFirst: false,
      preserveSelection: false,
      emptyMessage: 'В подтверждённом городе не найдены пункты выдачи. Уточните город или выберите другой.',
      failureMessage: 'Не удалось загрузить пункты выдачи. Проверьте город или попробуйте позже.'
    });
  }, [loadPickupPointsForLocation, pickupLocationSuggestion]);

  const handleDismissPickupLocationSuggestion = useCallback(() => {
    setPickupLocationSuggestion(null);
    setDeliveryError('Введите ваш город, чтобы увидеть пункты выдачи.');
  }, []);

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
    if (pickupLocation.trim()) {
      saveLastConfirmedPickupLocation(pickupLocation);
    }
    setPickupLocationSuggestion(null);
    applyPickupSelection(point);
  }, [applyPickupSelection, clearRecoveryState, clearStatus, pickupLocation]);

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
      confirmationMode: isPaymentConfigLoaded ? paymentConfig.confirmationMode : undefined,
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
      const paymentSession = normalizePaymentSession(response?.payment, {
        returnUrl: orderToken ? buildAbsoluteAppUrl(`/order/${orderToken}`) : ''
      });
      if (hasEmbeddedPaymentSession(paymentSession) && orderToken) {
        trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_PAYMENT_RESULT, {
          outcome: 'success',
          delivery_type: deliveryType,
          cart_total: Math.round(payableTotal)
        });
        clearCheckoutDraft(payload.cartId);
        setSubmitPhase('redirecting');
        navigate(`/order/${orderToken}`, {
          replace: true,
          state: {
            openEmbeddedPayment: true,
            paymentSession
          }
        });
        return;
      }
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
    isPaymentConfigLoaded,
    items.length,
    navigate,
    payableTotal,
    paymentConfig,
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
          : safeRetryState?.retryLabel || checkoutSubmitLabel,
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
    pickupLocationHint,
    pickupLocationSuggestion,
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
    submitLabel: isSubmitting ? 'Оформляем заказ…' : checkoutSubmitLabel,
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
    handleConfirmPickupLocationSuggestion,
    handleDismissPickupLocationSuggestion,
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

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import {
  checkoutCart,
  getYandexDeliveryOffers,
  getYandexPickupPoints,
  isApiRequestError
} from '../api';
import { moneyToNumber } from '../utils/product';
import { useAuth } from '../contexts/AuthContext';
import PickupMapModal from '../components/PickupMapModal';
import { METRIKA_GOALS, trackMetrikaGoal } from '../utils/metrika';

const CHECKOUT_STEPS = [
  { key: 'contact', title: 'Контакт' },
  { key: 'recipient', title: 'Получатель' },
  { key: 'delivery', title: 'Доставка' },
  { key: 'review', title: 'Подтверждение' }
];
const DEFAULT_PICKUP_CITY = 'Москва';
const MONEY_FORMATTER = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const FIELD_TO_STEP = {
  email: 0,
  recipientFirstName: 1,
  recipientPhone: 1,
  deliveryAddress: 2,
  pickupLocation: 2,
  selectedPickupPointId: 2,
  selectedOfferId: 2
};

function formatRub(value) {
  return `${MONEY_FORMATTER.format(Number.isFinite(value) ? value : 0)} ₽`;
}

function pickupUiId(point, index = 0) {
  const lat = Number(point?.latitude);
  const lon = Number(point?.longitude);
  const coordToken = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat}-${lon}` : `point-${index}`;
  return point?.id || `${coordToken}-${index}`;
}

function isEmailValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function createIdempotencyKey(seed = '') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `checkout-${seed}-${crypto.randomUUID()}`;
  }
  return `checkout-${seed}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mapBackendField(field = '') {
  const normalized = String(field || '').trim();
  if (!normalized) return '';
  if (normalized === 'receiptEmail' || normalized === 'email') return 'email';
  if (normalized === 'delivery.firstName' || normalized === 'firstName') return 'recipientFirstName';
  if (normalized === 'delivery.phone' || normalized === 'phone') return 'recipientPhone';
  if (normalized === 'delivery.address' || normalized === 'address') return 'deliveryAddress';
  if (normalized === 'delivery.pickupPointId' || normalized === 'pickupPointId') return 'selectedPickupPointId';
  if (normalized === 'delivery.offerId' || normalized === 'offerId') return 'selectedOfferId';
  if (normalized === 'delivery.pickupLocation' || normalized === 'pickupLocation') return 'pickupLocation';
  return '';
}

function inferFieldByMessage(message = '') {
  const source = String(message || '').toLowerCase();
  if (!source) return '';
  if (source.includes('email')) return 'email';
  if (source.includes('first name') || source.includes('имя')) return 'recipientFirstName';
  if (source.includes('phone') || source.includes('телефон')) return 'recipientPhone';
  if (source.includes('address') || source.includes('адрес')) return 'deliveryAddress';
  if (source.includes('pickup point') || source.includes('пункт')) return 'selectedPickupPointId';
  if (source.includes('offer') || source.includes('интервал')) return 'selectedOfferId';
  return '';
}

function CheckoutPage() {
  const { items, cartId, clearCart } = useContext(CartContext);
  const { tokenParsed, isAuthenticated, hasRole } = useAuth();
  const managerRole = process.env.REACT_APP_KEYCLOAK_MANAGER_ROLE || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const [email, setEmail] = useState('');
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [deliveryType, setDeliveryType] = useState('COURIER');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryAddressDetails, setDeliveryAddressDetails] = useState('');
  const [showDeliveryAddressDetails, setShowDeliveryAddressDetails] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupGeoId, setPickupGeoId] = useState(null);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [selectedPickupPointId, setSelectedPickupPointId] = useState('');
  const [selectedPickupPointUiId, setSelectedPickupPointUiId] = useState('');
  const [selectedPickupPointName, setSelectedPickupPointName] = useState('');

  const [deliveryOffers, setDeliveryOffers] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState('');

  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupAutoDetecting, setPickupAutoDetecting] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [isPickupMapOpen, setIsPickupMapOpen] = useState(false);
  const [expressMessage, setExpressMessage] = useState('');

  const beginCheckoutTrackedRef = useRef(false);
  const shippingTrackedOfferRef = useRef('');
  const paymentStepTrackedRef = useRef(false);
  const checkoutIdempotencyKeyRef = useRef('');
  const statusRef = useRef(null);
  const pickupViewportSyncRef = useRef({ inFlight: '', lastResolved: '' });
  const autoOfferFetchRef = useRef('');

  useEffect(() => {
    if (!email) {
      const fallbackEmail =
        tokenParsed?.email
        || tokenParsed?.preferred_username
        || tokenParsed?.username
        || '';
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
    setDeliveryOffers([]);
    setSelectedOfferId('');
    setDeliveryError('');
    shippingTrackedOfferRef.current = '';
    autoOfferFetchRef.current = '';
  }, [deliveryType, deliveryAddress, deliveryAddressDetails, selectedPickupPointId]);

  useEffect(() => {
    setPickupPoints([]);
    setSelectedPickupPointId('');
    setSelectedPickupPointUiId('');
    setSelectedPickupPointName('');
    setPickupGeoId(null);
    pickupViewportSyncRef.current = { inFlight: '', lastResolved: '' };
  }, [pickupLocation]);

  if (isManager) {
    return <Navigate to="/cart" replace />;
  }

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
    () => [deliveryAddress.trim(), deliveryAddressDetails.trim()].filter(Boolean).join(', '),
    [deliveryAddress, deliveryAddressDetails]
  );

  const totalWithDelivery = total + deliveryAmount;
  const deliveryLabel = selectedOfferId ? formatRub(deliveryAmount) : 'Рассчитаем после выбора адреса';
  const payableTotal = selectedOfferId ? totalWithDelivery : total;

  const formatInterval = (offer) => {
    if (!offer?.intervalFrom || !offer?.intervalTo) return 'Интервал уточняется';
    const from = new Date(offer.intervalFrom);
    const to = new Date(offer.intervalTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 'Интервал уточняется';
    const dateLabel = from.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
    const fromTime = from.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const toTime = to.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${dateLabel}, ${fromTime}–${toTime}`;
  };

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
  }, [selectedOfferId, deliveryType, deliveryAmount, payableTotal]);

  useEffect(() => {
    if (activeStep !== 3 || paymentStepTrackedRef.current) return;
    trackMetrikaGoal(METRIKA_GOALS.ADD_PAYMENT_INFO, {
      delivery_type: deliveryType,
      cart_total: Math.round(payableTotal)
    });
    paymentStepTrackedRef.current = true;
  }, [activeStep, deliveryType, payableTotal]);

  useEffect(() => {
    if (status?.type !== 'error') return;
    if (statusRef.current && typeof statusRef.current.focus === 'function') {
      statusRef.current.focus();
    }
  }, [status]);

  useEffect(() => {
    if (activeStep !== 3 && expressMessage) {
      setExpressMessage('');
    }
  }, [activeStep, expressMessage]);

  const applyStepFieldErrors = (keys, errors) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      keys.forEach((key) => {
        next[key] = errors[key] || '';
      });
      return next;
    });
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: '' };
    });
  };

  const markCompleted = (stepKey) => {
    setCompletedSteps((prev) => ({ ...prev, [stepKey]: true }));
  };

  const validateContactStep = () => {
    const errors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      errors.email = 'Укажите email для чека и подтверждения заказа.';
    } else if (!isEmailValid(normalizedEmail)) {
      errors.email = 'Проверьте формат email, например name@example.com.';
    }

    applyStepFieldErrors(['email'], errors);
    if (errors.email) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_FIELD_ERROR, {
        step: 'contact',
        field: 'email'
      });
    }
    return Object.keys(errors).length === 0;
  };

  const validateRecipientStep = () => {
    const errors = {};

    if (!recipientFirstName.trim()) {
      errors.recipientFirstName = 'Укажите имя получателя.';
    }
    if (!recipientPhone.trim()) {
      errors.recipientPhone = 'Укажите телефон для связи по доставке.';
    }

    applyStepFieldErrors(['recipientFirstName', 'recipientPhone'], errors);
    const errorField = errors.recipientFirstName ? 'recipientFirstName' : errors.recipientPhone ? 'recipientPhone' : '';
    if (errorField) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_FIELD_ERROR, {
        step: 'recipient',
        field: errorField
      });
    }
    return Object.keys(errors).length === 0;
  };

  const validateDeliveryStep = () => {
    const errors = {};

    if (deliveryType === 'COURIER' && !fullDeliveryAddress) {
      errors.deliveryAddress = 'Укажите адрес доставки для расчёта интервалов.';
    }
    if (deliveryType === 'PICKUP') {
      if (!pickupLocation.trim() && !selectedPickupPointId) {
        errors.pickupLocation = 'Укажите город или адрес, чтобы найти пункты выдачи.';
      }
      if (!selectedPickupPointId) {
        errors.selectedPickupPointId = 'Выберите пункт выдачи из списка или на карте.';
      }
    }
    if (!selectedOfferId) {
      errors.selectedOfferId = 'Рассчитайте и выберите подходящий интервал доставки.';
    }

    applyStepFieldErrors(
      ['deliveryAddress', 'pickupLocation', 'selectedPickupPointId', 'selectedOfferId'],
      errors
    );
    const firstDeliveryErrorField = ['deliveryAddress', 'pickupLocation', 'selectedPickupPointId', 'selectedOfferId']
      .find((field) => Boolean(errors[field]));
    if (firstDeliveryErrorField) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_FIELD_ERROR, {
        step: 'delivery',
        field: firstDeliveryErrorField
      });
    }
    return Object.keys(errors).length === 0;
  };

  const applyBackendErrors = (error) => {
    const details = isApiRequestError(error) ? error.details : null;
    const fieldErrors = Array.isArray(details?.fieldErrors) ? details.fieldErrors : [];
    const mappedErrors = {};

    fieldErrors.forEach((fieldError) => {
      const field = mapBackendField(fieldError?.field);
      if (!field) return;
      const message =
        typeof fieldError?.message === 'string' && fieldError.message.trim()
          ? fieldError.message.trim()
          : 'Проверьте это поле.';
      mappedErrors[field] = message;
    });

    if (!Object.keys(mappedErrors).length) {
      const fallbackMessage =
        typeof details?.message === 'string' && details.message.trim()
          ? details.message.trim()
          : error?.message || '';
      const inferredField = inferFieldByMessage(fallbackMessage);
      if (inferredField) {
        mappedErrors[inferredField] = fallbackMessage;
      }
    }

    if (!Object.keys(mappedErrors).length) {
      return false;
    }

    setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
    const nextStep = Object.keys(mappedErrors)
      .map((field) => FIELD_TO_STEP[field])
      .filter((stepIndex) => Number.isInteger(stepIndex))
      .sort((a, b) => a - b)[0];
    if (Number.isInteger(nextStep)) {
      setActiveStep(nextStep);
    }
    return true;
  };

  const applyPickupSelection = (point) => {
    if (!point) return;
    setSelectedPickupPointId(point.id || '');
    setSelectedPickupPointUiId(point.__uiId || pickupUiId(point, 0));
    setSelectedPickupPointName(point.name || point.address || '');
    setDeliveryError('');
    clearFieldError('selectedPickupPointId');
  };

  const extractCityFromGeocodeResponse = (payload) => {
    const feature = payload?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    if (!feature) return '';
    const components = feature?.metaDataProperty?.GeocoderMetaData?.Address?.Components || [];
    const city =
      components.find((item) => item.kind === 'locality')?.name
      || components.find((item) => item.kind === 'province')?.name
      || components.find((item) => item.kind === 'area')?.name
      || '';
    if (city) return city;
    return feature?.metaDataProperty?.GeocoderMetaData?.Address?.formatted || '';
  };

  const detectCityByTimezone = () => {
    if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') return '';
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const token = zone.split('/').pop() || '';
    return token.replace(/_/g, ' ').trim();
  };

  const getBrowserPosition = () =>
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
    });

  const resolveCityFromCoordinates = async (latitude, longitude) => {
    const apiKey = process.env.REACT_APP_YANDEX_MAPS_API_KEY || '';
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
      throw new Error('Failed to reverse geocode location');
    }

    const payload = await response.json();
    const city = extractCityFromGeocodeResponse(payload);
    return city || detectCityByTimezone();
  };

  const normalizeViewportBounds = (bounds) => {
    const latitudeFrom = Number(bounds?.latitudeFrom);
    const latitudeTo = Number(bounds?.latitudeTo);
    const longitudeFrom = Number(bounds?.longitudeFrom);
    const longitudeTo = Number(bounds?.longitudeTo);
    if (![latitudeFrom, latitudeTo, longitudeFrom, longitudeTo].every((value) => Number.isFinite(value))) {
      return null;
    }
    return {
      latitudeFrom: Math.min(latitudeFrom, latitudeTo),
      latitudeTo: Math.max(latitudeFrom, latitudeTo),
      longitudeFrom: Math.min(longitudeFrom, longitudeTo),
      longitudeTo: Math.max(longitudeFrom, longitudeTo)
    };
  };

  const viewportToken = (bounds) => [
    bounds.latitudeFrom.toFixed(4),
    bounds.latitudeTo.toFixed(4),
    bounds.longitudeFrom.toFixed(4),
    bounds.longitudeTo.toFixed(4)
  ].join('|');

  const populatePickupPoints = (response, options = {}) => {
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
  };

  const fetchPickupPointsByLocation = async (locationLabel, options = {}) => {
    const trimmedLocation = (locationLabel || '').trim();
    if (!trimmedLocation) {
      throw new Error('Location is required');
    }
    const response = await getYandexPickupPoints({ location: trimmedLocation });
    return populatePickupPoints(response, options);
  };

  const fetchPickupPointsByViewport = async (bounds, options = {}) => {
    const normalizedBounds = normalizeViewportBounds(bounds);
    if (!normalizedBounds) {
      throw new Error('Viewport bounds are required');
    }
    const response = await getYandexPickupPoints(normalizedBounds);
    return populatePickupPoints(response, options);
  };

  const uniqueCities = (cities = []) =>
    Array.from(
      new Set(
        cities
          .map((city) => (city || '').trim())
          .filter(Boolean)
      )
    );

  const preloadPickupPointsByCities = async (cities = []) => {
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
  };

  const handleMapViewportChange = async (bounds) => {
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
  };

  const handleExpressCheckout = (providerLabel) => {
    setExpressMessage(
      `${providerLabel} будет доступен на защищённой платёжной странице, если поддерживается вашим устройством и банком.`
    );
  };

  const handleContactNext = () => {
    setStatus(null);
    if (!validateContactStep()) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'contact', outcome: 'fail' });
      setActiveStep(0);
      return;
    }

    trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'contact', outcome: 'success' });
    markCompleted('contact');
    setActiveStep(1);
  };

  const handleRecipientNext = () => {
    setStatus(null);
    if (!validateContactStep()) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'recipient', outcome: 'fail', reason: 'contact' });
      setActiveStep(0);
      return;
    }
    if (!validateRecipientStep()) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'recipient', outcome: 'fail', reason: 'recipient' });
      setActiveStep(1);
      return;
    }

    trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'recipient', outcome: 'success' });
    markCompleted('recipient');
    setActiveStep(2);
  };

  const handleDeliveryNext = () => {
    setStatus(null);
    if (!validateContactStep()) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'delivery', outcome: 'fail', reason: 'contact' });
      setActiveStep(0);
      return;
    }
    if (!validateRecipientStep()) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'delivery', outcome: 'fail', reason: 'recipient' });
      setActiveStep(1);
      return;
    }
    if (!validateDeliveryStep()) {
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'delivery', outcome: 'fail', reason: 'delivery' });
      setActiveStep(2);
      return;
    }

    trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'delivery', outcome: 'success' });
    markCompleted('delivery');
    setActiveStep(3);
  };

  const handlePickupSearch = async () => {
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
  };

  const handleOpenPickupMap = async () => {
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
  };

  const handleFetchOffers = async () => {
    setDeliveryError('');

    if (!items.length) {
      setDeliveryError('Корзина пуста. Добавьте товары перед оформлением заказа.');
      return;
    }
    if (!validateContactStep()) {
      setActiveStep(0);
      return;
    }
    if (!validateRecipientStep()) {
      setActiveStep(1);
      return;
    }

    const deliveryFieldErrors = {};
    if (deliveryType === 'COURIER' && !fullDeliveryAddress) {
      deliveryFieldErrors.deliveryAddress = 'Укажите адрес доставки.';
    }
    if (deliveryType === 'PICKUP' && !selectedPickupPointId) {
      deliveryFieldErrors.selectedPickupPointId = 'Сначала выберите пункт выдачи.';
    }
    if (Object.keys(deliveryFieldErrors).length) {
      applyStepFieldErrors(['deliveryAddress', 'selectedPickupPointId'], deliveryFieldErrors);
      return;
    }

    setDeliveryLoading(true);
    try {
      const id = cartId || localStorage.getItem('cartId');
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
      setDeliveryError('Не удалось рассчитать доставку. Попробуйте ещё раз.');
      setDeliveryOffers([]);
      setSelectedOfferId('');
    } finally {
      setDeliveryLoading(false);
    }
  };

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
    items,
    email,
    recipientFirstName,
    recipientLastName,
    recipientPhone,
    deliveryType,
    fullDeliveryAddress,
    selectedPickupPointId
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!items.length) {
      setStatus({ type: 'error', message: 'Корзина пуста. Добавьте товары перед оформлением заказа.' });
      return;
    }

    if (!validateContactStep()) {
      setActiveStep(0);
      return;
    }
    if (!validateRecipientStep()) {
      setActiveStep(1);
      return;
    }
    if (!validateDeliveryStep()) {
      setActiveStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const id = cartId || localStorage.getItem('cartId');
      if (!checkoutIdempotencyKeyRef.current) {
        checkoutIdempotencyKeyRef.current = createIdempotencyKey(id || 'guest');
      }
      const response = await checkoutCart({
        cartId: id,
        receiptEmail: email.trim(),
        returnUrl: `${window.location.origin}/order/{token}`,
        orderPageUrl: `${window.location.origin}/order/{token}`,
        savePaymentMethod: isAuthenticated ? savePaymentMethod : false,
        idempotencyKey: checkoutIdempotencyKeyRef.current,
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

      clearCart();
      const confirmationUrl = response?.payment?.confirmationUrl;
      if (confirmationUrl) {
        trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_PAYMENT_RESULT, {
          outcome: 'success',
          delivery_type: deliveryType,
          cart_total: Math.round(payableTotal)
        });
        window.location.href = confirmationUrl;
        return;
      }

      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_PAYMENT_RESULT, {
        outcome: 'fail',
        reason: 'missing_confirmation_url'
      });
      setStatus({ type: 'error', message: 'Не удалось получить ссылку оплаты. Попробуйте ещё раз.' });
    } catch (err) {
      console.error('Checkout failed:', err);
      trackMetrikaGoal(METRIKA_GOALS.CHECKOUT_PAYMENT_RESULT, {
        outcome: 'fail',
        reason: isApiRequestError(err) ? `http_${err.status}` : 'client_error'
      });
      const handled = applyBackendErrors(err);
      if (handled) {
        setStatus({ type: 'error', message: 'Проверьте поля с ошибками и попробуйте снова.' });
      } else if (isApiRequestError(err) && err.status === 409) {
        setStatus({
          type: 'error',
          message: 'Заказ с этим запросом уже обрабатывается. Подождите пару секунд и повторите попытку.'
        });
      } else if (isApiRequestError(err) && typeof err.details?.message === 'string' && err.details.message.trim()) {
        setStatus({ type: 'error', message: err.details.message.trim() });
      } else if (typeof err?.message === 'string' && err.message.trim()) {
        setStatus({ type: 'error', message: err.message.trim() });
      } else {
        setStatus({ type: 'error', message: 'Не удалось оформить заказ. Попробуйте ещё раз.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <div className="checkout-page py-10">
        <div className="container mx-auto px-4">
          <div className="soft-card p-8 text-center">
            <h1 className="text-2xl font-semibold">Корзина пуста</h1>
            <p className="mt-2 text-sm text-muted">Добавьте товары в корзину, чтобы перейти к оформлению заказа.</p>
            <Link to="/cart" className="button mt-5">Вернуться в корзину</Link>
          </div>
        </div>
      </div>
    );
  }

  const mobileAction =
    activeStep === 0
      ? {
          label: 'Продолжить',
          subtitle: 'Шаг 1 из 4 · Контакт',
          action: handleContactNext,
          disabled: false
        }
      : activeStep === 1
      ? {
          label: 'К доставке',
          subtitle: 'Шаг 2 из 4 · Получатель',
          action: handleRecipientNext,
          disabled: false
        }
      : activeStep === 2
      ? {
          label: 'К подтверждению',
          subtitle: 'Шаг 3 из 4 · Доставка',
          action: handleDeliveryNext,
          disabled: deliveryLoading
        }
      : {
          label: isSubmitting ? 'Переходим к оплате…' : 'Перейти к оплате',
          subtitle: 'Шаг 4 из 4 · Подтверждение',
          action: () => {
            const form = document.getElementById('checkout-form');
            if (form) form.requestSubmit();
          },
          disabled: isSubmitting
        };

  const reviewDeliveryLabel = selectedOffer
    ? `${deliveryType === 'PICKUP' ? 'Самовывоз' : 'Курьер'}, ${formatInterval(selectedOffer)}`
    : 'Не выбрано';

  return (
    <div className="checkout-page py-7 pb-28 md:py-10 lg:pb-10">
      <div className="container mx-auto px-4">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Оформление заказа</p>
            <h1 className="text-3xl sm:text-4xl font-semibold">Быстрое оформление без лишних шагов</h1>
            <p className="mt-1 text-sm text-muted">Вы выбираете доставку и полную стоимость до оплаты. Регистрация не обязательна.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/info/delivery" className="button-ghost text-sm">Поддержка и доставка</Link>
            <Link to="/cart" className="button-ghost text-sm">← Вернуться в корзину</Link>
          </div>
        </div>

        {status && (
          <div
            ref={statusRef}
            role={status.type === 'error' ? 'alert' : 'status'}
            tabIndex={-1}
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="mb-5 rounded-[24px] border border-primary/20 bg-white/90 p-4 shadow-[0_18px_36px_rgba(43,39,34,0.08)]">
          <p className="text-sm font-semibold text-ink">Оформление как гость</p>
          <p className="mt-1 text-xs text-muted">Достаточно email и контакта получателя. Аккаунт можно использовать только если вам так удобнее.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" className="button-gray w-full justify-start text-left !py-2.5">
              Оформить как гость
            </button>
            <Link to="/login" className="button-ghost w-full justify-start text-left !py-2.5">
              Войти в аккаунт
            </Link>
          </div>
        </div>

        <div className="mb-6 soft-card p-4 md:p-5">
          <ol className="grid gap-2 sm:grid-cols-4" aria-label="Прогресс оформления заказа">
            {CHECKOUT_STEPS.map((step, index) => {
              const isActive = activeStep === index;
              const isDone = Boolean(completedSteps[step.key]) || index < activeStep;
              return (
                <li
                  key={step.key}
                  aria-current={isActive ? 'step' : undefined}
                  className={`rounded-2xl border px-3 py-3 text-sm transition ${
                    isActive
                      ? 'border-primary/35 bg-primary/10'
                      : isDone
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-ink/10 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-primary text-white' : 'bg-secondary text-muted'
                      }`}
                    >
                      {isDone ? '✓' : index + 1}
                    </span>
                    <span className="font-semibold">{step.title}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="lg:hidden mb-6">
          <details className="soft-card p-4">
            <summary className="cursor-pointer text-sm font-semibold">Сводка заказа · {formatRub(payableTotal)}</summary>
            <div className="mt-3 space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.productInfo?.name || 'Товар'}</div>
                    <div className="text-xs text-muted">{item.quantity} шт.</div>
                  </div>
                  <div className="whitespace-nowrap font-semibold">
                    {formatRub((item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity)}
                  </div>
                </div>
              ))}
              <hr className="my-2 border-ink/10" />
              <div className="flex justify-between"><span>Товары</span><span>{formatRub(total)}</span></div>
              <div className="flex justify-between"><span>Доставка</span><span>{deliveryLabel}</span></div>
              <div className="flex justify-between font-semibold"><span>К оплате</span><span>{formatRub(payableTotal)}</span></div>
            </div>
          </details>
        </div>

        <div className="sr-only" aria-live="polite">
          Текущая сумма к оплате: {formatRub(payableTotal)}
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
            <p className="text-xs text-muted">Поля с пометкой «обязательно» нужно заполнить для продолжения.</p>
            <section className="soft-card p-6 md:p-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">1</span>
                  <div>
                    <h2 className="text-2xl font-semibold">Контакт для чека</h2>
                    <p className="text-sm text-muted">Письмо с заказом придёт на этот email.</p>
                  </div>
                </div>
                {activeStep !== 0 && (
                  <button type="button" className="button-ghost text-xs" onClick={() => setActiveStep(0)}>Изменить</button>
                )}
              </div>

              {activeStep === 0 ? (
                <>
                  <label className="block text-sm">
                    <span className="text-muted">Электронная почта (обязательно)</span>
                    <input
                      id="checkout-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearFieldError('email');
                      }}
                      onBlur={validateContactStep}
                      placeholder="email@example.ru"
                      className={`mt-2 w-full ${fieldErrors.email ? 'input-error' : ''}`}
                      autoComplete="email"
                      inputMode="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-errormessage={fieldErrors.email ? 'checkout-email-error' : undefined}
                      required
                    />
                    {fieldErrors.email && (
                      <p id="checkout-email-error" className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
                        <span aria-hidden="true">⚠</span>
                        <span>{fieldErrors.email}</span>
                      </p>
                    )}
                  </label>

                  {isAuthenticated && (
                    <label className="mt-3 flex items-center gap-3 text-sm text-ink/90">
                      <input
                        type="checkbox"
                        checked={savePaymentMethod}
                        onChange={(event) => setSavePaymentMethod(event.target.checked)}
                      />
                      <span>Сохранить карту для будущих покупок</span>
                    </label>
                  )}

                  <button type="button" className="button mt-5" onClick={handleContactNext}>
                    Продолжить
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted">{email}</p>
              )}
            </section>

            <section className="soft-card p-6 md:p-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">2</span>
                  <div>
                    <h2 className="text-2xl font-semibold">Получатель</h2>
                    <p className="text-sm text-muted">Нужны только данные для доставки.</p>
                  </div>
                </div>
                {activeStep !== 1 && (
                  <button type="button" className="button-ghost text-xs" onClick={() => setActiveStep(1)}>Изменить</button>
                )}
              </div>

              {activeStep === 1 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="text-muted">Имя (обязательно)</span>
                      <input
                        id="checkout-recipient-first-name"
                        type="text"
                        value={recipientFirstName}
                        onChange={(event) => {
                          setRecipientFirstName(event.target.value);
                          clearFieldError('recipientFirstName');
                        }}
                        placeholder="Имя"
                        className={`mt-2 w-full ${fieldErrors.recipientFirstName ? 'input-error' : ''}`}
                        autoComplete="shipping given-name"
                        aria-invalid={Boolean(fieldErrors.recipientFirstName)}
                        aria-errormessage={fieldErrors.recipientFirstName ? 'checkout-recipient-first-name-error' : undefined}
                        required
                      />
                      {fieldErrors.recipientFirstName && (
                        <p id="checkout-recipient-first-name-error" className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
                          <span aria-hidden="true">⚠</span>
                          <span>{fieldErrors.recipientFirstName}</span>
                        </p>
                      )}
                    </label>
                    <label className="block text-sm">
                      <span className="text-muted">Фамилия (необязательно)</span>
                      <input
                        id="checkout-recipient-last-name"
                        type="text"
                        value={recipientLastName}
                        onChange={(event) => setRecipientLastName(event.target.value)}
                        placeholder="Фамилия"
                        className="mt-2 w-full"
                        autoComplete="shipping family-name"
                      />
                    </label>
                    <label className="block text-sm sm:col-span-2">
                      <span className="text-muted">Телефон (обязательно)</span>
                      <input
                        id="checkout-recipient-phone"
                        type="tel"
                        value={recipientPhone}
                        onChange={(event) => {
                          setRecipientPhone(event.target.value);
                          clearFieldError('recipientPhone');
                        }}
                        placeholder="+7 900 000-00-00"
                        className={`mt-2 w-full ${fieldErrors.recipientPhone ? 'input-error' : ''}`}
                        autoComplete="shipping tel"
                        inputMode="tel"
                        aria-invalid={Boolean(fieldErrors.recipientPhone)}
                        aria-errormessage={fieldErrors.recipientPhone ? 'checkout-recipient-phone-error' : undefined}
                        required
                      />
                      {fieldErrors.recipientPhone && (
                        <p id="checkout-recipient-phone-error" className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
                          <span aria-hidden="true">⚠</span>
                          <span>{fieldErrors.recipientPhone}</span>
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted">Номер нужен, чтобы курьер мог уточнить детали доставки.</p>
                    </label>
                  </div>

                  <button type="button" className="button mt-5" onClick={handleRecipientNext}>
                    Продолжить
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted">
                  {recipientFirstName} {recipientLastName} · {recipientPhone}
                </p>
              )}
            </section>

            <section className="soft-card p-6 md:p-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">3</span>
                  <div>
                    <h2 className="text-2xl font-semibold">Доставка</h2>
                    <p className="text-sm text-muted">Сначала выбираете интервал и стоимость, потом переходите к оплате.</p>
                  </div>
                </div>
                {activeStep !== 2 && (
                  <button type="button" className="button-ghost text-xs" onClick={() => setActiveStep(2)}>Изменить</button>
                )}
              </div>

              {activeStep === 2 ? (
                <>
                  <div className="rounded-2xl border border-ink/10 bg-secondary/55 p-1 inline-flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryType('COURIER');
                        clearFieldError('selectedPickupPointId');
                      }}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        deliveryType === 'COURIER'
                          ? 'bg-white text-ink shadow-[0_10px_20px_rgba(43,39,34,0.12)]'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      Курьер
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryType('PICKUP');
                        clearFieldError('deliveryAddress');
                      }}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        deliveryType === 'PICKUP'
                          ? 'bg-white text-ink shadow-[0_10px_20px_rgba(43,39,34,0.12)]'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      Пункт выдачи
                    </button>
                  </div>

                  {deliveryType === 'COURIER' ? (
                    <div className="mt-4">
                      <label className="block text-sm">
                        <span className="text-muted">Адрес доставки (обязательно)</span>
                        <input
                          id="checkout-delivery-address"
                          type="text"
                          value={deliveryAddress}
                          onChange={(event) => {
                            setDeliveryAddress(event.target.value);
                            clearFieldError('deliveryAddress');
                          }}
                          placeholder="Город, улица, дом"
                          className={`mt-2 w-full ${fieldErrors.deliveryAddress ? 'input-error' : ''}`}
                          autoComplete="shipping street-address"
                          aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                          aria-errormessage={fieldErrors.deliveryAddress ? 'checkout-delivery-address-error' : undefined}
                          required
                        />
                        {fieldErrors.deliveryAddress && (
                          <p id="checkout-delivery-address-error" className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
                            <span aria-hidden="true">⚠</span>
                            <span>{fieldErrors.deliveryAddress}</span>
                          </p>
                        )}
                      </label>

                      <button
                        type="button"
                        className="button-ghost mt-2 text-xs"
                        aria-expanded={showDeliveryAddressDetails}
                        aria-controls="checkout-delivery-address-details"
                        onClick={() => setShowDeliveryAddressDetails((prev) => !prev)}
                      >
                        {showDeliveryAddressDetails ? 'Скрыть доп. адресные данные' : 'Добавить квартиру, подъезд или код домофона'}
                      </button>

                      {showDeliveryAddressDetails && (
                        <label id="checkout-delivery-address-details" className="mt-2 block text-sm">
                          <span className="text-muted">Дополнительная строка адреса (необязательно)</span>
                          <input
                            id="checkout-delivery-address-line2"
                            type="text"
                            value={deliveryAddressDetails}
                            onChange={(event) => setDeliveryAddressDetails(event.target.value)}
                            placeholder="Кв/офис, подъезд, этаж, домофон"
                            className="mt-2 w-full"
                            autoComplete="shipping address-line2"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm">
                        <span className="text-muted">Город или адрес (обязательно)</span>
                        <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                          <input
                            id="checkout-pickup-location"
                            type="text"
                            value={pickupLocation}
                            onChange={(event) => {
                              setPickupLocation(event.target.value);
                              clearFieldError('pickupLocation');
                            }}
                            placeholder="Например, Санкт-Петербург"
                            className={`w-full ${fieldErrors.pickupLocation ? 'input-error' : ''}`}
                            aria-invalid={Boolean(fieldErrors.pickupLocation)}
                            aria-errormessage={fieldErrors.pickupLocation ? 'checkout-pickup-location-error' : undefined}
                          />
                          <button
                            type="button"
                            className="button-gray text-sm whitespace-nowrap"
                            onClick={handlePickupSearch}
                            disabled={pickupLoading}
                          >
                            {pickupLoading ? 'Ищем…' : 'Найти пункты'}
                          </button>
                          <button
                            type="button"
                            className="button-ghost text-sm whitespace-nowrap"
                            onClick={handleOpenPickupMap}
                          >
                            {pickupAutoDetecting ? 'Определяем город…' : 'Открыть карту'}
                          </button>
                        </div>
                        {fieldErrors.pickupLocation && (
                          <p id="checkout-pickup-location-error" className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
                            <span aria-hidden="true">⚠</span>
                            <span>{fieldErrors.pickupLocation}</span>
                          </p>
                        )}
                      </label>

                      {pickupGeoId && (
                        <div className="text-xs text-muted">GeoID региона: {pickupGeoId}</div>
                      )}

                      {selectedPickupPoint ? (
                        <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-ink">{selectedPickupPoint.name || 'Пункт выдачи'}</div>
                              <div className="mt-1 text-xs text-muted">{selectedPickupPoint.address || 'Адрес уточняется'}</div>
                            </div>
                            <button
                              type="button"
                              className="button-ghost !px-2 !py-1 text-xs"
                              onClick={handleOpenPickupMap}
                            >
                              Изменить
                            </button>
                          </div>
                          {!selectedPickupPoint.id && (
                            <div className="mt-2 text-xs text-red-600">
                              Для этой точки нет идентификатора. Выберите другой пункт.
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted">Сначала найдите пункт выдачи по адресу или городу.</p>
                      )}

                      {fieldErrors.selectedPickupPointId && (
                        <p className="text-xs text-red-700">{fieldErrors.selectedPickupPointId}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-5 rounded-2xl border border-ink/10 bg-white/80 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">Варианты доставки</h3>
                        <p className="text-xs text-muted mt-1">Стоимость обновляется автоматически после заполнения адреса.</p>
                      </div>
                      <button
                        type="button"
                        className="button-gray text-sm"
                        onClick={handleFetchOffers}
                        disabled={deliveryLoading}
                      >
                        {deliveryLoading ? 'Рассчитываем…' : 'Рассчитать'}
                      </button>
                    </div>

                    {deliveryError && (
                      <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {deliveryError}
                      </div>
                    )}

                    {fieldErrors.selectedOfferId && (
                      <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden="true">⚠</span>
                          <span>{fieldErrors.selectedOfferId}</span>
                        </span>
                      </div>
                    )}

                    {deliveryOffers.length > 0 ? (
                      <div className="space-y-2">
                        {deliveryOffers.map((offer) => {
                          const price = offer.pricingTotal || offer.pricing;
                          const priceValue = price ? moneyToNumber(price) : 0;
                          const expiresAt = offer.expiresAt ? new Date(offer.expiresAt) : null;
                          const expiresLabel =
                            expiresAt && !Number.isNaN(expiresAt.getTime())
                              ? expiresAt.toLocaleString('ru-RU')
                              : null;

                          return (
                            <label
                              key={offer.offerId}
                              className={`flex cursor-pointer items-start justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                                selectedOfferId === offer.offerId
                                  ? 'border-primary/35 bg-primary/10 shadow-[0_14px_24px_rgba(182,91,74,0.16)]'
                                  : 'border-ink/10 bg-white hover:border-primary/30 hover:bg-secondary/35'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  name="deliveryOffer"
                                  checked={selectedOfferId === offer.offerId}
                                  onChange={() => {
                                    setSelectedOfferId(offer.offerId);
                                    clearFieldError('selectedOfferId');
                                  }}
                                />
                                <div>
                                  <div className="text-sm font-semibold text-ink">
                                    {deliveryType === 'PICKUP' ? 'Самовывоз' : 'Курьер'} · {formatInterval(offer)}
                                  </div>
                                  {expiresLabel && (
                                    <div className="mt-1 text-xs text-muted">Актуально до {expiresLabel}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-semibold">{formatRub(priceValue)}</div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted">
                        Нажмите «Рассчитать», чтобы получить доступные интервалы и финальную стоимость.
                      </p>
                    )}
                  </div>

                  <button type="button" className="button mt-5" onClick={handleDeliveryNext}>
                    Продолжить
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted">{reviewDeliveryLabel}</p>
              )}
            </section>

            <section className="soft-card p-6 md:p-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">4</span>
                  <div>
                    <h2 className="text-2xl font-semibold">Проверка и оплата</h2>
                    <p className="text-sm text-muted">Проверьте данные. После этого откроется защищённая страница оплаты.</p>
                  </div>
                </div>
                {activeStep !== 3 && (
                  <button type="button" className="button-ghost text-xs" onClick={() => setActiveStep(3)}>Открыть</button>
                )}
              </div>

              {activeStep === 3 ? (
                <>
                  <div className="rounded-2xl border border-ink/10 bg-white/85 p-4 text-sm space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs uppercase tracking-[0.15em] text-muted">Контакт</div>
                        <div className="font-semibold">{email}</div>
                      </div>
                      <button type="button" className="button-ghost text-xs" onClick={() => setActiveStep(0)}>Изменить</button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.15em] text-muted">Получатель</div>
                        <div className="font-semibold">{recipientFirstName} {recipientLastName || ''}</div>
                        <div className="text-xs text-muted">{recipientPhone}</div>
                      </div>
                      <button type="button" className="button-ghost text-xs" onClick={() => setActiveStep(1)}>Изменить</button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.15em] text-muted">Доставка</div>
                        <div className="font-semibold">{reviewDeliveryLabel}</div>
                        <div className="text-xs text-muted">
                          {deliveryType === 'COURIER'
                            ? fullDeliveryAddress
                            : selectedPickupPointName || selectedPickupPoint?.address || 'Пункт выдачи'}
                        </div>
                      </div>
                      <button type="button" className="button-ghost text-xs" onClick={() => setActiveStep(2)}>Изменить</button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-ink/10 bg-white/90 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Быстрая оплата</p>
                    <div className="mt-2 grid gap-2">
                      {['Apple Pay', 'Google Pay', 'PayPal'].map((provider) => (
                        <button
                          key={provider}
                          type="button"
                          className="w-full min-h-[44px] rounded-xl border border-ink/15 bg-white text-sm font-semibold text-ink hover:border-primary/35 hover:text-primary transition"
                          onClick={() => handleExpressCheckout(provider)}
                        >
                          {provider}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted">Или оплатите картой на следующем шаге через ЮKassa.</p>
                    {expressMessage && <p className="mt-2 text-xs text-primary">{expressMessage}</p>}
                  </div>

                  <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-xs text-ink/90">
                    Нажимая «Перейти к оплате», вы подтверждаете заказ. Если банк запросит 3DS/SCA, вы увидите отдельный шаг подтверждения.
                  </div>

                  <button type="submit" className="button mt-5 w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Готовим оплату…' : 'Перейти к оплате'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted">Сначала завершите предыдущие шаги, затем подтвердите заказ.</p>
              )}
            </section>
          </form>

          <aside className="hidden lg:block space-y-4 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] self-start">
            <div className="soft-card p-5">
              <h2 className="text-2xl font-semibold mb-4">Ваш заказ</h2>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.productInfo?.name || 'Товар'}</div>
                      <div className="text-xs text-muted">{item.quantity} шт.</div>
                    </div>
                    <div className="font-semibold whitespace-nowrap">
                      {formatRub((item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <hr className="my-4 border-ink/10" />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Товары ({itemsCount})</dt>
                  <dd>{formatRub(total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Доставка</dt>
                  <dd>{deliveryLabel}</dd>
                </div>
              </dl>
              <hr className="my-4 border-ink/10" />
              <div className="flex justify-between text-lg font-semibold">
                <span>К оплате</span>
                <span>{formatRub(payableTotal)}</span>
              </div>
            </div>

            <div className="soft-card p-4 text-sm space-y-2">
              <p className="font-semibold">Доверие и безопасность</p>
              <p className="text-muted">Платёж проходит на защищённой странице ЮKassa. Данные карты не хранятся в браузере магазина.</p>
              <p className="text-muted">Доставка рассчитывается через интеграцию Яндекс и отображается до оплаты.</p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(43,39,34,0.12)] lg:hidden">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted">{mobileAction.subtitle}</div>
            <div className="text-sm font-semibold">К оплате: {formatRub(payableTotal)}</div>
          </div>
          <button
            type="button"
            className="button ml-auto !px-4 !py-2.5"
            onClick={mobileAction.action}
            disabled={mobileAction.disabled}
          >
            {mobileAction.label}
          </button>
        </div>
      </div>

      <PickupMapModal
        open={isPickupMapOpen}
        points={enrichedPickupPoints}
        selectedPointId={selectedPickupPointId}
        searchLabel={pickupLocation}
        errorMessage={deliveryError}
        isLoading={pickupLoading || pickupAutoDetecting}
        onRetry={() => (pickupLocation.trim() ? handlePickupSearch() : handleOpenPickupMap())}
        onMapViewportChange={handleMapViewportChange}
        onClose={() => setIsPickupMapOpen(false)}
        onSelect={(point) => {
          applyPickupSelection(point);
          setIsPickupMapOpen(false);
        }}
      />
    </div>
  );
}

export default CheckoutPage;

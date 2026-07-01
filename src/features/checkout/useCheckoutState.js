import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePaymentConfig } from '../../contexts/PaymentConfigContext';
import {
  checkoutCart,
  isApiRequestError
} from '../../api';
import { buildAbsoluteAppUrl } from '../../utils/url';
import { getCustomerSafeErrorMessage } from '../../utils/customerErrors';
import { createNotification } from '../../utils/notifications';
import { moneyToNumber } from '../../utils/product';
import {
  getAttributionSnapshot,
  METRIKA_GOALS,
  trackCheckoutStep,
  trackGoal
} from '../../utils/metrika';
import {
  hasEmbeddedPaymentSession,
  isEmbeddedPaymentMode,
  normalizePaymentSession
} from '../../utils/payment';
import {
  ACCOUNT_ORDERS_SECTION,
  buildAccountSectionPath,
  savePostCheckoutAccountBootstrap
} from '../../utils/account';
import { CHECKOUT_REQUEST_TIMEOUT_MS, CHECKOUT_STEPS } from './constants';
import { clearCheckoutDraft, loadCheckoutDraft, saveCheckoutDraft } from './draftStorage';
import {
  createInitialAttempt,
  createInitialCompletedSteps,
  createInitialSafeRetryState,
  createSafeRetryState,
  createTimeoutController,
  getStoredCartId
} from './state';
import {
  mapCheckoutBackendErrors,
  STEP_FIELD_ORDER,
  validateCheckoutStep
} from './validation';
import {
  buildCheckoutAttemptSignature,
  formatRub,
  isAbortError,
  isEmailValid,
  resolveCheckoutAttempt
} from './utils';
import { readEnv } from '../../config/runtime';

export const MANUAL_DELIVERY_NOTICE =
  'Финальную стоимость и варианты доставки согласует менеджер после оформления заказа.';

function clampStep(step, max = CHECKOUT_STEPS.length - 1) {
  if (!Number.isInteger(step)) return 0;
  return Math.max(0, Math.min(step, max));
}

function resolveNameFromToken(tokenParsed) {
  const fullName = [tokenParsed?.given_name, tokenParsed?.family_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || tokenParsed?.name || '';
}

function composeHomeAddress(parts = {}) {
  return [
    parts.postalCode ? `Индекс ${parts.postalCode}` : '',
    parts.city,
    parts.street,
    parts.address2
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ');
}

function splitHomeAddress(value = '') {
  const parts = String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const postalMatch = parts[0]?.match(/^Индекс\s+(.+)$/i);
  return {
    postalCode: postalMatch ? postalMatch[1] : '',
    city: postalMatch ? parts[1] || '' : parts[0] || '',
    street: postalMatch ? parts[2] || '' : parts[1] || '',
    address2: postalMatch ? parts.slice(3).join(', ') : parts.slice(2).join(', ')
  };
}

export function useCheckoutState() {
  const navigate = useNavigate();
  const { items: liveItems, cartId, pricing } = useContext(CartContext);
  const { tokenParsed, isAuthenticated, hasRole } = useAuth();
  const { paymentConfig, isPaymentConfigLoaded } = usePaymentConfig();
  const managerRole = readEnv('REACT_APP_KEYCLOAK_MANAGER_ROLE', 'manager') || 'manager';
  const isManager = isAuthenticated && hasRole(managerRole);

  const initialCartIdRef = useRef(cartId || getStoredCartId());
  const initialDraftRef = useRef(loadCheckoutDraft(initialCartIdRef.current) || {});
  const initialDraft = initialDraftRef.current;
  const initialAttemptRef = useRef(createInitialAttempt(initialDraft));
  const initialAttempt = initialAttemptRef.current;
  const formDraft = initialDraft.form || {};

  const [activeStep, setActiveStep] = useState(
    initialAttempt.key ? CHECKOUT_STEPS.length - 1 : clampStep(formDraft.activeStep)
  );
  const [completedSteps, setCompletedSteps] = useState(createInitialCompletedSteps(formDraft));
  const [fieldErrors, setFieldErrors] = useState(formDraft.fieldErrors || {});

  const [email, setEmail] = useState(formDraft.email || '');
  const [customerName, setCustomerName] = useState(formDraft.customerName || '');
  const [phone, setPhone] = useState(formDraft.phone || '');
  const [homeAddress, setHomeAddress] = useState(formDraft.homeAddress || '');
  const [addressParts, setAddressParts] = useState(
    formDraft.addressParts || splitHomeAddress(formDraft.homeAddress || '')
  );

  const [status, setStatus] = useState(formDraft.status || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(Boolean(formDraft.savePaymentMethod));
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
  const paymentStepTrackedRef = useRef(false);

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
    if (!customerName) {
      const fallbackName = resolveNameFromToken(tokenParsed);
      if (fallbackName) {
        setCustomerName(fallbackName);
      }
    }
    if (!phone) {
      const fallbackPhone =
        tokenParsed?.phone_number ||
        tokenParsed?.phone ||
        tokenParsed?.phoneNumber ||
        '';
      if (fallbackPhone) {
        setPhone(fallbackPhone);
      }
    }
  }, [customerName, email, phone, tokenParsed]);

  const itemsCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => pricing ? moneyToNumber(pricing.finalTotal) : items.reduce(
      (sum, item) => sum + (item.unitPriceValue || moneyToNumber(item.unitPrice)) * item.quantity,
      0
    ),
    [items, pricing]
  );

  const payableTotal = total;
  const deliveryLabel = 'Согласует менеджер';
  const confirmationDeliveryLabel = homeAddress.trim() || 'Адрес не указан';
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

  const draftPayload = useMemo(
    () => ({
      cartId: effectiveCartId,
      form: {
        activeStep,
        completedSteps,
        email,
        customerName,
        phone,
        homeAddress,
        addressParts,
        fieldErrors,
        savePaymentMethod,
        expressMessage
      },
      itemSnapshot: liveItems.length ? liveItems : attempt.key || safeRetryState ? itemSnapshot : [],
      attempt,
      safeRetryState
    }),
    [
      activeStep,
      addressParts,
      attempt,
      completedSteps,
      customerName,
      effectiveCartId,
      email,
      expressMessage,
      fieldErrors,
      homeAddress,
      itemSnapshot,
      liveItems,
      phone,
      safeRetryState,
      savePaymentMethod
    ]
  );

  useEffect(() => {
    if (!effectiveCartId) return;
    const hasContent = Boolean(
      draftPayload.itemSnapshot.length ||
      email.trim() ||
      customerName.trim() ||
      phone.trim() ||
      homeAddress.trim() ||
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
    customerName,
    draftPayload,
    effectiveCartId,
    email,
    homeAddress,
    phone,
    safeRetryState
  ]);

  const updateAddressPart = useCallback((field, value) => {
    setAddressParts((current) => {
      const next = { ...current, [field]: value };
      setHomeAddress(composeHomeAddress(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!itemsCount || beginCheckoutTrackedRef.current) return;
    trackGoal(METRIKA_GOALS.BEGIN_CHECKOUT, {
      cart_items: itemsCount,
      cart_total: Math.round(total)
    });
    beginCheckoutTrackedRef.current = true;
  }, [itemsCount, total]);

  useEffect(() => {
    const step = CHECKOUT_STEPS[activeStep];
    if (!step) return;
    trackCheckoutStep(activeStep + 1, {
      step: step.key,
      cart_items: itemsCount,
      cart_total: Math.round(payableTotal)
    }, items);
  }, [activeStep, items, itemsCount, payableTotal]);

  useEffect(() => {
    if (activeStep !== CHECKOUT_STEPS.length - 1 || paymentStepTrackedRef.current) return;
    trackGoal(METRIKA_GOALS.ADD_PAYMENT_INFO, {
      delivery_type: 'MANAGER',
      cart_total: Math.round(payableTotal)
    });
    paymentStepTrackedRef.current = true;
  }, [activeStep, payableTotal]);

  useEffect(() => {
    if (activeStep !== CHECKOUT_STEPS.length - 1 && expressMessage) {
      setExpressMessage('');
    }
  }, [activeStep, expressMessage]);

  const currentAttemptSignature = useMemo(() => {
    return buildCheckoutAttemptSignature({
      cartId: effectiveCartId,
      receiptEmail: email.trim().toLowerCase(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      homeAddress: homeAddress.trim(),
      returnUrl: buildAbsoluteAppUrl('/order/{token}'),
      orderPageUrl: buildAbsoluteAppUrl('/order/{token}'),
      confirmationMode: isPaymentConfigLoaded ? paymentConfig.confirmationMode : undefined,
      savePaymentMethod: isAuthenticated ? savePaymentMethod : false
    });
  }, [
    customerName,
    effectiveCartId,
    email,
    homeAddress,
    isAuthenticated,
    isPaymentConfigLoaded,
    paymentConfig.confirmationMode,
    phone,
    savePaymentMethod
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
      customerName,
      phone,
      homeAddress,
      addressParts
    });
    const fields = STEP_FIELD_ORDER[stepKey] || [];
    applyStepFieldErrors(fields, errors);
    const firstErrorField = fields.find((field) => Boolean(errors[field]));
    if (firstErrorField) {
      trackGoal(METRIKA_GOALS.CHECKOUT_FIELD_ERROR, {
        step: stepKey,
        field: firstErrorField
      });
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }, [
    applyStepFieldErrors,
    addressParts,
    customerName,
    email,
    homeAddress,
    phone
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

  const clearRecoveryState = useCallback(() => {
    setSafeRetryState(null);
  }, []);

  const clearStatus = useCallback(() => {
    setStatus(null);
  }, []);

  const handleEmailBlur = useCallback(() => {
    validateStep('contact');
  }, [validateStep]);

  const handleContactNext = useCallback(() => {
    setStatus(null);
    const result = validateStep('contact');
    if (!result.valid) {
      trackGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'contact', outcome: 'fail' });
      setActiveStep(0);
      return;
    }

    trackGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'contact', outcome: 'success' });
    markCompleted('contact');
    setActiveStep(1);
  }, [markCompleted, validateStep]);

  const handleAddressNext = useCallback(() => {
    setStatus(null);
    if (!validateStep('contact').valid) {
      trackGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'address', outcome: 'fail', reason: 'contact' });
      setActiveStep(0);
      return;
    }
    if (!validateStep('address').valid) {
      trackGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'address', outcome: 'fail', reason: 'address' });
      setActiveStep(1);
      return;
    }

    trackGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'address', outcome: 'success' });
    markCompleted('address');
    setActiveStep(2);
  }, [markCompleted, validateStep]);

  const handleDeliveryNext = useCallback(() => {
    setStatus(null);
    if (!validateStep('contact').valid) {
      setActiveStep(0);
      return;
    }
    if (!validateStep('address').valid) {
      setActiveStep(1);
      return;
    }
    trackGoal(METRIKA_GOALS.CHECKOUT_STEP_SUBMIT, { step: 'delivery', outcome: 'success' });
    markCompleted('delivery');
    setActiveStep(3);
  }, [markCompleted, validateStep]);

  const handleExpressCheckout = useCallback((providerLabel) => {
    setExpressMessage(
      isEmbeddedPaymentMode(paymentConfig)
        ? `${providerLabel} будет доступен во встроенной защищённой форме оплаты, если поддерживается вашим устройством и банком.`
        : `${providerLabel} будет доступен на защищённой платёжной странице, если поддерживается вашим устройством и банком.`
    );
  }, [paymentConfig]);

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
      if (!validateStep('address').valid) {
        setActiveStep(1);
        return;
      }
    }

    const payload = {
      cartId: effectiveCartId || getStoredCartId(),
      receiptEmail: email.trim().toLowerCase(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      homeAddress: homeAddress.trim(),
      returnUrl: buildAbsoluteAppUrl('/order/{token}'),
      orderPageUrl: buildAbsoluteAppUrl('/order/{token}'),
      accountRedirectUrl: buildAbsoluteAppUrl('/account?order={orderId}#orders'),
      confirmationMode: isPaymentConfigLoaded ? paymentConfig.confirmationMode : undefined,
      savePaymentMethod: isAuthenticated ? savePaymentMethod : false,
      addressParts,
      analyticsAttribution: getAttributionSnapshot()
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
    trackGoal(METRIKA_GOALS.CHECKOUT_SUBMIT, {
      cart_items: itemsCount,
      cart_total: Math.round(payableTotal),
      retrying
    });

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

      const order = response?.order || null;
      const orderId = order?.id || '';
      const accountRedirectPath =
        response?.account?.redirectPath ||
        (orderId
          ? buildAccountSectionPath(ACCOUNT_ORDERS_SECTION, { orderId })
          : '/account#orders');
      const paymentSession = normalizePaymentSession(response?.payment, {
        returnUrl: buildAbsoluteAppUrl(accountRedirectPath)
      });
      const savedBootstrap = savePostCheckoutAccountBootstrap({
        order,
        orderId,
        publicToken: orderToken,
        email: response?.account?.email || payload.receiptEmail,
        accountStatus: response?.account?.status || '',
        redirectPath: accountRedirectPath,
        payment: response?.payment || null,
        paymentSession
      });

      trackGoal(METRIKA_GOALS.CHECKOUT_PAYMENT_RESULT, {
        outcome: response?.payment ? 'success' : 'pending_account',
        delivery_type: 'MANAGER',
        cart_total: Math.round(payableTotal),
        account_status: response?.account?.status || ''
      });
      clearCheckoutDraft(payload.cartId);
      setSubmitPhase('redirecting');
      navigate(accountRedirectPath, {
        replace: true,
        state: {
          postCheckout: true,
          bootstrapSaved: Boolean(savedBootstrap),
          openEmbeddedPayment: hasEmbeddedPaymentSession(paymentSession),
          paymentSession
        }
      });
      return;
    } catch (err) {
      console.error('Checkout failed:', err);
      trackGoal(METRIKA_GOALS.CHECKOUT_PAYMENT_RESULT, {
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
        setActiveStep(CHECKOUT_STEPS.length - 1);
        setSafeRetryState(createSafeRetryState('conflict', {
          orderToken: nextAttempt.orderToken || attempt.orderToken || '',
          message: getCustomerSafeErrorMessage(err, {
            context: 'checkout',
            fallbackMessage: 'Подождите немного и выполните безопасную проверку ещё раз.'
          })
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
        setActiveStep(CHECKOUT_STEPS.length - 1);
        setSafeRetryState(createSafeRetryState('timeout', {
          orderToken: nextAttempt.orderToken || attempt.orderToken || ''
        }));
        setStatus(createNotification({
          type: 'warning',
          title: 'Связь нестабильна',
          message: 'Мы сохранили попытку оформления. Повторная проверка не создаст дубль заказа.'
        }));
      } else {
        setStatus(createNotification({
          type: 'error',
          title: 'Не удалось оформить заказ',
          message: getCustomerSafeErrorMessage(err, {
            context: 'checkout',
            fallbackMessage: 'Попробуйте ещё раз.'
          })
        }));
      }
    } finally {
      timeoutController.cancel();
      setSubmitPhase('idle');
      setIsSubmitting(false);
    }
  }, [
    applyBackendErrors,
    addressParts,
    attempt,
    customerName,
    effectiveCartId,
    email,
    homeAddress,
    isAuthenticated,
    isPaymentConfigLoaded,
    items.length,
    navigate,
    payableTotal,
    paymentConfig.confirmationMode,
    phone,
    savePaymentMethod,
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
        label: 'К адресу',
        subtitle: 'Шаг 1 из 4 · Контакты',
        action: handleContactNext,
        disabled: isSubmitting
      }
    : activeStep === 1
    ? {
        label: 'К доставке',
        subtitle: 'Шаг 2 из 4 · Адрес',
        action: handleAddressNext,
        disabled: isSubmitting
      }
    : activeStep === 2
    ? {
        label: 'К оплате',
        subtitle: 'Шаг 3 из 4 · Доставка',
        action: handleDeliveryNext,
        disabled: isSubmitting
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
    customerName,
    setCustomerName,
    phone,
    setPhone,
    homeAddress,
    setHomeAddress,
    addressParts,
    updateAddressPart,
    topNotification,
    isSubmitting,
    savePaymentMethod,
    setSavePaymentMethod,
    expressMessage,
    submitLabel: isSubmitting ? 'Оформляем заказ…' : checkoutSubmitLabel,
    mobileAction,
    processingNotice,
    safeRetryState,
    handleSafeRetry,
    items,
    itemsCount,
    pricing,
    total,
    deliveryLabel,
    payableTotal,
    confirmationDeliveryLabel,
    deliveryNotice: MANUAL_DELIVERY_NOTICE,
    handleExpressCheckout,
    handleContactNext,
    handleAddressNext,
    handleDeliveryNext,
    handleSubmit,
    formatRub,
    moneyToNumber,
    isAuthenticated,
    clearStatus,
    clearRecoveryState,
    handleEmailBlur
  };
}

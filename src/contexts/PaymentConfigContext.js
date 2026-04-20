import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getPublicPaymentConfig } from '../api';
import {
  FALLBACK_PAYMENT_CONFIG,
  normalizePaymentConfig
} from '../utils/payment';

const PaymentConfigContext = createContext({
  paymentConfig: FALLBACK_PAYMENT_CONFIG,
  isPaymentConfigLoaded: false
});

let cachedPaymentConfig = null;
let paymentConfigRequest = null;

function primePaymentConfig(config) {
  const normalized = normalizePaymentConfig(config);
  cachedPaymentConfig = normalized;
  return normalized;
}

function loadPaymentConfig() {
  if (cachedPaymentConfig) {
    return Promise.resolve(cachedPaymentConfig);
  }
  if (!paymentConfigRequest) {
    paymentConfigRequest = getPublicPaymentConfig()
      .then((response) => normalizePaymentConfig(response))
      .catch(() => normalizePaymentConfig(FALLBACK_PAYMENT_CONFIG))
      .then((config) => {
        cachedPaymentConfig = config;
        return config;
      });
  }
  return paymentConfigRequest;
}

export function PaymentConfigProvider({ children, initialConfig = null }) {
  const seededConfig = initialConfig ? primePaymentConfig(initialConfig) : cachedPaymentConfig;
  const [paymentConfig, setPaymentConfig] = useState(
    seededConfig || normalizePaymentConfig(FALLBACK_PAYMENT_CONFIG)
  );
  const [isPaymentConfigLoaded, setIsPaymentConfigLoaded] = useState(
    Boolean(seededConfig)
  );

  useEffect(() => {
    if (seededConfig) {
      return undefined;
    }

    let active = true;
    loadPaymentConfig()
      .then((config) => {
        if (!active) {
          return;
        }
        setPaymentConfig(config);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setIsPaymentConfigLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [seededConfig]);

  const value = useMemo(
    () => ({
      paymentConfig,
      isPaymentConfigLoaded
    }),
    [isPaymentConfigLoaded, paymentConfig]
  );

  return (
    <PaymentConfigContext.Provider value={value}>
      {children}
    </PaymentConfigContext.Provider>
  );
}

export function usePaymentConfig() {
  return useContext(PaymentConfigContext);
}

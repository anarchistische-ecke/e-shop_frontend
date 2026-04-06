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

export function PaymentConfigProvider({ children }) {
  const [paymentConfig, setPaymentConfig] = useState(
    cachedPaymentConfig || normalizePaymentConfig(FALLBACK_PAYMENT_CONFIG)
  );
  const [isPaymentConfigLoaded, setIsPaymentConfigLoaded] = useState(
    Boolean(cachedPaymentConfig)
  );

  useEffect(() => {
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
  }, []);

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

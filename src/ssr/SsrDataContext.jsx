import React, { createContext, useContext } from 'react';

const DEFAULT_SSR_DATA = {
  renderMode: 'csr',
  routeId: '',
  routeData: null,
  cms: null,
  directory: null,
  paymentConfig: null,
  runtimeConfig: null
};

const SsrDataContext = createContext(DEFAULT_SSR_DATA);

export function SsrDataProvider({ value, children }) {
  return (
    <SsrDataContext.Provider value={{ ...DEFAULT_SSR_DATA, ...(value || {}) }}>
      {children}
    </SsrDataContext.Provider>
  );
}

export function useSsrData() {
  return useContext(SsrDataContext);
}

import React, { createContext, useContext } from 'react';

const RenderContext = createContext({
  target: 'client',
  routeRenderMode: 'csr'
});

export function RenderContextProvider({ value, children }) {
  return <RenderContext.Provider value={value || { target: 'client', routeRenderMode: 'csr' }}>{children}</RenderContext.Provider>;
}

export function useRenderContext() {
  return useContext(RenderContext);
}

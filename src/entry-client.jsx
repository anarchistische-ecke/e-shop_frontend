import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import StorefrontApp from './app/StorefrontApp';
import { getRuntimeConfig } from './config/runtime';
import { initYandexMetrika } from './utils/metrika';
import { RenderContextProvider } from './ssr/RenderContext';
import { SsrDataProvider } from './ssr/SsrDataContext';

const ssrData = window.__SSR_DATA__ || {};
const runtimeConfig = getRuntimeConfig();
const rootElement = document.getElementById('root');

initYandexMetrika();

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <RenderContextProvider
        value={{
          target: 'client',
          routeRenderMode: ssrData.renderMode || 'csr'
        }}
      >
        <SsrDataProvider value={ssrData}>
          <BrowserRouter basename={runtimeConfig.basePath || undefined}>
            <StorefrontApp initialData={ssrData} />
          </BrowserRouter>
        </SsrDataProvider>
      </RenderContextProvider>
    </HelmetProvider>
  </React.StrictMode>
);

if ((ssrData.renderMode || 'csr') === 'ssr') {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}

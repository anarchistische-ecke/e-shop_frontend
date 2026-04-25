import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import StorefrontApp from './app/StorefrontApp';
import { RenderContextProvider } from './ssr/RenderContext';
import { SsrDataProvider } from './ssr/SsrDataContext';

export function render(url, ssrData = {}) {
  const helmetContext = {};
  const appHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <RenderContextProvider
        value={{
          target: 'server',
          routeRenderMode: ssrData.renderMode || 'csr'
        }}
      >
        <SsrDataProvider value={ssrData}>
          <StaticRouter location={url}>
            <StorefrontApp initialData={ssrData} />
          </StaticRouter>
        </SsrDataProvider>
      </RenderContextProvider>
    </HelmetProvider>
  );

  return {
    appHtml,
    helmet: helmetContext.helmet
  };
}

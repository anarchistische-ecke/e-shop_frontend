import React, { useEffect, useMemo, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Seo from '../components/Seo';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import { trackPageView } from '../utils/metrika';
import { useRenderContext } from '../ssr/RenderContext';
import { matchStorefrontRoute } from '../ssr/routeConfig';

function isChromeHiddenRoutePath(path = '') {
  return path === '/manager/login' || path.startsWith('/admin');
}

function ClientRouteShell({ isChromeHiddenRoute = false }) {
  return (
    <div
      className={
        isChromeHiddenRoute
          ? 'flex min-h-screen items-center justify-center px-4 py-10 text-sm text-muted'
          : 'page-shell page-section text-center text-sm text-muted'
      }
    >
      Загружаем страницу…
    </div>
  );
}

function RouteEntryRenderer({ route }) {
  const renderContext = useRenderContext();
  const isServerClientRoute =
    renderContext.target === 'server' && route.renderMode === 'csr';
  const isChromeHiddenRoute = isChromeHiddenRoutePath(route.path);

  if (isServerClientRoute) {
    return (
      <>
        {route.seo ? <Seo {...route.seo} /> : null}
        <ClientRouteShell isChromeHiddenRoute={isChromeHiddenRoute} />
      </>
    );
  }

  return route.renderElement();
}

function App({ routes = [] }) {
  const location = useLocation();
  const isChromeHiddenRoute = isChromeHiddenRoutePath(location.pathname);
  const mainRef = useRef(null);
  const resolvedRoutes = useMemo(() => routes, [routes]);

  useEffect(() => {
    if (isChromeHiddenRoute) {
      return;
    }
    const path = `${location.pathname}${location.search}${location.hash}`;
    const { route, params } = matchStorefrontRoute(location.pathname);
    trackPageView(path, typeof document !== 'undefined' ? document.title : undefined, {
      route_id: route?.id || 'not-found',
      page_type: route?.id || 'not-found',
      canonical_path: location.pathname,
      product_id: params?.id,
      category_slug: params?.slug,
      search_query: new URLSearchParams(location.search).get('q') || ''
    });
  }, [isChromeHiddenRoute, location.pathname, location.search, location.hash]);

  return (
    <>
      <ScrollToTop />
      <div
        className={
          isChromeHiddenRoute
            ? 'site-content-layer site-content-layer--standalone'
            : 'site-content-layer site-content-layer--public'
        }
      >
        {!isChromeHiddenRoute ? (
          <a
            href="#main-content"
            className="sr-only fixed left-3 top-3 z-[210] rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink shadow-[0_14px_28px_rgba(43,39,34,0.16)] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-primary/40"
            onClick={() => {
              window.requestAnimationFrame(() => {
                mainRef.current?.focus();
              });
            }}
          >
            Перейти к содержимому
          </a>
        ) : null}
        {!isChromeHiddenRoute && <Header />}
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className={isChromeHiddenRoute ? 'min-h-screen' : 'min-h-[80vh]'}
          style={
            isChromeHiddenRoute
              ? undefined
              : {
                  paddingTop: 'var(--site-header-height, 7rem)',
                  paddingBottom: 'var(--mobile-bottom-nav-offset, 0px)'
                }
          }
        >
          <Routes>
            {resolvedRoutes.map((route) => (
              <Route
                key={`${route.id}:${route.path}`}
                path={route.path}
                element={<RouteEntryRenderer route={route} />}
              />
            ))}
          </Routes>
        </main>
        {!isChromeHiddenRoute && <Footer />}
      </div>
    </>
  );
}

export default App;

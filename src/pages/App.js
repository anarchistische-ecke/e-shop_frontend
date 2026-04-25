import React, { useEffect, useMemo, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import { trackMetrikaHit } from '../utils/metrika';
import { useRenderContext } from '../ssr/RenderContext';
import { getAllStorefrontRoutes } from '../ssr/routeManifest';

function ClientRouteShell({ isAdminRoute = false }) {
  return (
    <div
      className={
        isAdminRoute
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

  if (isServerClientRoute) {
    return <ClientRouteShell isAdminRoute={route.path.startsWith('/admin')} />;
  }

  return route.renderElement();
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const mainRef = useRef(null);
  const routes = useMemo(() => getAllStorefrontRoutes(), []);

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }
    const path = `${location.pathname}${location.search}${location.hash}`;
    trackMetrikaHit(path, typeof document !== 'undefined' ? document.title : undefined);
  }, [isAdminRoute, location.pathname, location.search, location.hash]);

  return (
    <>
      <ScrollToTop />
      <div
        className={
          isAdminRoute
            ? 'site-content-layer site-content-layer--admin'
            : 'site-content-layer site-content-layer--public'
        }
      >
        {!isAdminRoute ? (
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
        {!isAdminRoute && <Header />}
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className={isAdminRoute ? 'min-h-screen' : 'min-h-[80vh]'}
          style={
            isAdminRoute
              ? undefined
              : {
                  paddingTop: 'var(--site-header-height, 7rem)',
                  paddingBottom: 'var(--mobile-bottom-nav-offset, 0px)'
                }
          }
        >
          <Routes>
            {routes.map((route) => (
              <Route
                key={`${route.id}:${route.path}`}
                path={route.path}
                element={<RouteEntryRenderer route={route} />}
              />
            ))}
          </Routes>
        </main>
        {!isAdminRoute && <Footer />}
      </div>
    </>
  );
}

export default App;

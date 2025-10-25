import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop resets the window scroll position to the top whenever
 * the current location's pathname changes.  Without this component,
 * React Router preserves the scroll position between navigations,
 * which caused the About page to open at the same scroll depth as
 * the previous page.  Including this component at the root of the
 * application ensures a consistent experience when navigating.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default ScrollToTop;
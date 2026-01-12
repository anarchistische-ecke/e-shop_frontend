import React, { useCallback } from 'react';
import LegalDocumentPage from './LegalDocumentPage';

function SalesTermsPage() {
  const handleReady = useCallback((root) => {
    const wrapper = root.querySelector('.terms_sale__wrapper');
    const toggleButton = root.querySelector('.terms_sale__btn');
    const linkSelector = '.terms_sale__link';

    if (!wrapper || !toggleButton) {
      return undefined;
    }

    const setExpanded = (value) => {
      if (value) {
        wrapper.classList.add('is-open');
      } else {
        wrapper.classList.remove('is-open');
      }
      toggleButton.setAttribute('aria-expanded', value ? 'true' : 'false');
    };

    setExpanded(wrapper.classList.contains('is-open'));

    const setActiveByHash = (hash) => {
      const targetHash = hash?.startsWith('#') ? hash : `#${hash}`;
      root.querySelectorAll(linkSelector).forEach((el) => {
        const href = el.getAttribute('href') || '';
        el.classList.toggle('--active', href === targetHash);
      });
    };

    const scrollToHash = (hash, behavior = 'smooth') => {
      if (!hash) return;
      const target = root.querySelector(hash);
      if (!target) return;
      target.scrollIntoView({ behavior, block: 'start' });
      setActiveByHash(hash);
    };

    const handleHashChange = () => {
      const { hash } = window.location;
      if (!hash) return;
      scrollToHash(hash, 'auto');
      if (window.innerWidth < 1024) {
        setExpanded(false);
      }
    };

    const onClick = (event) => {
      const button = event.target.closest('.terms_sale__btn');
      if (button) {
        event.preventDefault();
        setExpanded(!wrapper.classList.contains('is-open'));
        return;
      }

      const link = event.target.closest('.js-smooth-scroll');
      if (link) {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#')) {
          event.preventDefault();
          scrollToHash(href, 'smooth');
          window.history.replaceState(null, '', `${window.location.pathname}${href}`);
        }
        if (window.innerWidth < 1024) {
          setExpanded(false);
        }
      }
    };

    root.addEventListener('click', onClick);
    window.addEventListener('hashchange', handleHashChange);
    requestAnimationFrame(handleHashChange);
    return () => {
      root.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <LegalDocumentPage
      fileName="sales-terms.html"
      onContentReady={handleReady}
      className="legal-terms"
    />
  );
}

export default SalesTermsPage;

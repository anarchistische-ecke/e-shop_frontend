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
          const target = root.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        root.querySelectorAll(linkSelector).forEach((el) => {
          el.classList.remove('--active');
        });
        link.classList.add('--active');
        if (window.innerWidth < 1024) {
          setExpanded(false);
        }
      }
    };

    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
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

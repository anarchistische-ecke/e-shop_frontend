import React from 'react';
import { Link } from 'react-router-dom';
import {
  useCmsNavigation,
  useCmsSiteSettings,
} from '../contexts/CmsContentContext';

function isInternalUrl(url) {
  return typeof url === 'string' && url.startsWith('/');
}

function FooterLink({ item }) {
  if (!item?.label || !item?.url) {
    return null;
  }

  const className = 'touch-link min-h-11 text-sm leading-5 text-white/85 underline-offset-4 hover:text-white hover:underline focus-visible:ring-white';

  if (isInternalUrl(item.url)) {
    return (
      <Link to={item.url} className={className}>
        {item.label}
      </Link>
    );
  }

  return (
    <a
      href={item.url}
      className={className}
      rel={item.openInNewTab ? 'noreferrer' : undefined}
      target={item.openInNewTab ? '_blank' : undefined}
    >
      {item.label}
    </a>
  );
}

function Footer({ fixedBottom = false }) {
  const currentYear = new Date().getFullYear();
  const { siteSettings } = useCmsSiteSettings();
  const { navigation: groups } = useCmsNavigation({ placement: 'footer' });
  const phone = String(siteSettings.supportPhone || '').replace(/[^\d+]/g, '');
  const copyrightStartYear = Number(siteSettings?.copyrightStartYear || currentYear);
  const copyrightPeriod =
    copyrightStartYear && copyrightStartYear < currentYear
      ? `${copyrightStartYear}–${currentYear}`
      : currentYear;

  return (
    <footer className={`border-t border-white/15 bg-accent text-white ${fixedBottom ? 'pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-0' : ''}`}>
      <div className="page-shell py-8 md:py-12">
        <div
          data-testid="site-footer-content"
          className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(15rem,0.9fr)_minmax(0,2fr)] lg:gap-12"
        >
          <div className="min-w-0">
            <Link to="/" className="touch-link font-display text-2xl font-semibold tracking-tight text-white focus-visible:ring-white">
              {siteSettings.siteName}
            </Link>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/80">
              {siteSettings.brandDescription}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 text-sm">
              {phone ? <FooterLink item={{ label: siteSettings.supportPhone, url: `tel:${phone}` }} /> : null}
              {siteSettings.supportEmail ? <FooterLink item={{ label: siteSettings.supportEmail, url: `mailto:${siteSettings.supportEmail}` }} /> : null}
            </div>
          </div>

          <div
            data-testid="site-footer-link-grid"
            className="grid grid-cols-2 gap-x-5 gap-y-5 md:grid-cols-4"
          >
            {groups.map((grp) => (
              <div key={grp.key || grp.title} className="min-w-0">
                <h2 className="mb-1 font-sans text-sm font-extrabold text-white">{grp.title}</h2>
                <ul>
                  {(grp.items || []).map((item) => (
                    <li key={`${grp.key || grp.title}:${item.label}:${item.url}`}>
                      <FooterLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/20 py-4">
        <div className="page-shell">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-x-4 gap-y-2 text-xs leading-5 text-white/75">
            <p>© {siteSettings.siteName}, {copyrightPeriod}</p>
            <p>{siteSettings.legalEntityShort} · ИНН {siteSettings.legalInn} · ОГРНИП {siteSettings.legalOgrnip}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

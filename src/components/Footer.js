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

  if (isInternalUrl(item.url)) {
    return (
      <Link to={item.url} className="touch-link block leading-5 hover:text-white">
        {item.label}
      </Link>
    );
  }

  return (
    <a
      href={item.url}
      className="touch-link block leading-5 hover:text-white"
      rel={item.openInNewTab ? 'noreferrer' : undefined}
      target={item.openInNewTab ? '_blank' : undefined}
    >
      {item.label}
    </a>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();
  const { siteSettings } = useCmsSiteSettings();
  const { navigation: groups } = useCmsNavigation({ placement: 'footer' });
  const copyrightStartYear = Number(siteSettings?.copyrightStartYear || currentYear);
  const copyrightPeriod =
    copyrightStartYear && copyrightStartYear < currentYear
      ? `${copyrightStartYear}–${currentYear}`
      : currentYear;

  return (
    <footer className="bg-accent text-white border-t border-white/10">
      <div className="page-shell page-section--tight py-4 sm:py-5 lg:py-3 xl:py-4">
        <div
          data-testid="site-footer-content"
          className="mx-auto w-full max-w-[72rem]"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:gap-6 lg:items-start">
            <div className="space-y-3">
              <Link to="/" className="touch-link font-display text-[1.95rem] font-semibold tracking-tight text-white">
                {siteSettings.siteName}
              </Link>
              <p className="max-w-sm text-sm leading-6 text-white/72">
                {siteSettings.brandDescription}
              </p>
              <div className="flex flex-wrap gap-1.5 text-sm">
                <p className="m-0 inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-2.5 py-1">
                  Телефон: {siteSettings.supportPhone}
                </p>
                <p className="m-0 inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-2.5 py-1">
                  Почта: {siteSettings.supportEmail}
                </p>
              </div>
              <div className="grid gap-1.5 text-xs text-white/68">
                <p className="m-0 uppercase tracking-[0.22em] text-white/56">Реквизиты</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1">
                    {siteSettings.legalEntityShort}
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1">
                    ИНН {siteSettings.legalInn}
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1">
                    ОГРНИП {siteSettings.legalOgrnip}
                  </span>
                </div>
              </div>
            </div>

            <div
              data-testid="site-footer-link-grid"
              className="grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-x-5 lg:grid-cols-4"
            >
              {groups.map((grp) => (
                <div key={grp.key || grp.title} className="space-y-2 min-w-0">
                  <h4 className="mt-0 font-semibold text-white">{grp.title}</h4>
                  <ul className="space-y-1 text-sm text-white/74">
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
      </div>

      <div className="border-t border-white/10 py-2">
        <div className="page-shell">
          <div className="mx-auto flex w-full max-w-[72rem] flex-wrap items-center justify-between gap-1.5 text-xs text-white/60">
            <p className="m-0">© {siteSettings.siteName}, {copyrightPeriod}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5">Mir</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5">Visa</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5">Mastercard</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

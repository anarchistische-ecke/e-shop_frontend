import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';

function PromoBanners({ banners = [] }) {
  if (!banners.length) return null;

  return (
    <section aria-label="Акции" className="grid gap-3 sm:grid-cols-2">
      {banners.map((banner) => (
        <article key={banner.id} className="rounded-xl border border-ink/10 bg-white p-5">
          {banner.eyebrow ? <p className="text-xs font-medium text-muted">{banner.eyebrow}</p> : null}
          <h2 className="font-display text-2xl font-medium">{banner.title}</h2>
          {banner.description ? <p className="mt-2 text-sm text-muted">{banner.description}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-3">
            <Button as={Link} to={banner.link}>{banner.cta}</Button>
            {banner.secondaryCta && banner.secondaryLink ? (
              <Link to={banner.secondaryLink} className="focus-ring-soft inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4">
                {banner.secondaryCta}
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}

export default PromoBanners;

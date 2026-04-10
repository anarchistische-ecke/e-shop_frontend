import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../ui';

function PromoBanners({ banners = [] }) {
  if (!banners.length) {
    return null;
  }

  return (
    <section className="page-shell page-section">
      <div className="grid gap-4 lg:grid-cols-2">
        {banners.map((banner) => (
          <Card
            key={banner.id}
            padding="lg"
            className={`overflow-hidden rounded-[28px] border border-white/80 text-left ${banner.className || ''}`}
          >
            <p className="text-xs uppercase tracking-[0.28em] text-accent">{banner.eyebrow}</p>
            <h3 className="mt-3 text-2xl font-semibold text-ink">{banner.title}</h3>
            <p className="mt-3 max-w-xl text-sm text-muted">{banner.description}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button as={Link} to={banner.link}>
                {banner.cta}
              </Button>
              {banner.secondaryCta && banner.secondaryLink ? (
                <Button as={Link} to={banner.secondaryLink} variant="secondary">
                  {banner.secondaryCta}
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default PromoBanners;

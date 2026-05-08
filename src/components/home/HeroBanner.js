import React from 'react';
import { Link } from 'react-router-dom';
import ResponsiveImage from '../media/ResponsiveImage';
import { Button } from '../ui';

const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=82';

function HeroVisual({ imageUrl, media, alt, className = '' }) {
  const resolvedImage = imageUrl || FALLBACK_HERO_IMAGE;

  return (
    <div
      className={`relative min-h-[220px] overflow-hidden bg-sky/35 sm:min-h-[300px] lg:min-h-[31rem] ${className}`}
    >
      <ResponsiveImage
        media={media}
        src={resolvedImage}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        sizes="(min-width: 1024px) 52vw, 100vw"
        priority
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-white/10" />
    </div>
  );
}

function HeroBanner({
  imageUrl,
  imageMedia,
  title,
  accent,
  description,
  badge,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  highlights = [],
  featuredProduct
}) {
  const proofChips = highlights.slice(0, 3);
  const heroAlt = featuredProduct?.name || 'Уютный домашний текстиль';
  const featuredProductLink = featuredProduct ? (
    <Link
      to={featuredProduct.link}
      className="focus-ring-soft mt-3 flex min-h-[48px] items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink shadow-[0_10px_22px_rgba(43,39,34,0.08)]"
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold">
          Выбор недели: {featuredProduct.name}
        </span>
        <span className="block text-xs text-muted">
          от {featuredProduct.priceLabel}
        </span>
      </span>
      <span className="shrink-0 text-primary" aria-hidden="true">→</span>
    </Link>
  ) : null;

  return (
    <section className="page-shell page-section--tight">
      <div
        data-testid="home-hero"
        className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_22px_54px_rgba(43,39,34,0.14)] sm:rounded-[32px] lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
      >
        <div className="lg:order-2">
          <HeroVisual
            imageUrl={imageUrl}
            media={imageMedia}
            alt={heroAlt}
          />
          {featuredProductLink}
        </div>

        <div className="flex flex-col justify-center gap-4 px-4 py-5 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <div className="space-y-3">
            {badge ? (
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
                {badge}
              </p>
            ) : null}
            <h1 className="font-display text-[2rem] font-semibold leading-[1.02] text-ink sm:text-4xl lg:text-[3.4rem]">
              {title} {accent ? <span className="text-primary">{accent}</span> : null}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
              {ctaText && ctaLink ? (
                <Button as={Link} to={ctaLink} className="w-full sm:w-auto">
                  {ctaText}
                </Button>
              ) : null}
              {secondaryCtaText && secondaryCtaLink ? (
                <>
                  <Button
                    as={Link}
                    to={secondaryCtaLink}
                    variant="ghost"
                    className="w-full justify-center border border-ink/10 bg-white/45 text-ink/80 shadow-none sm:hidden"
                  >
                    {secondaryCtaText}
                  </Button>
                  <Button
                    as={Link}
                    to={secondaryCtaLink}
                    variant="secondary"
                    className="hidden sm:inline-flex sm:w-auto"
                  >
                    {secondaryCtaText}
                  </Button>
                </>
              ) : null}
          </div>

          {proofChips.length > 0 ? (
            <div className="hidden grid-cols-1 gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {proofChips.map((item) => (
                <Link
                  key={item.title}
                  to={item.link}
                  className="focus-ring-soft rounded-2xl border border-ink/10 bg-[#f6f8f3] px-3 py-2.5"
                >
                  <p className="m-0 text-sm font-semibold leading-5 text-ink">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                    {item.subtitle}
                  </p>
                </Link>
              ))}
            </div>
          ) : null}

        </div>
      </div>
    </section>
  );
}

export default HeroBanner;

import React from 'react';
import { Link } from 'react-router-dom';
import ResponsiveImage from '../media/ResponsiveImage';
import { Button } from '../ui';

export const HOME_HERO_FALLBACK_IMAGE = '/media/linen-bedroom.jpg';
const HOME_HERO_MOBILE_IMAGE = { src: '/media/linen-bedroom-small.jpg' };

function HeroBanner({
  imageUrl,
  imageMedia,
  title,
  accent,
  description,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  featuredProduct,
  anchorId,
  visual,
  actions,
  highlights = [],
}) {
  return (
    <section
      id={anchorId || undefined}
      data-testid="home-hero"
      className="grid overflow-hidden rounded-xl border border-ink/10 bg-white md:grid-cols-[0.94fr_1.06fr]"
    >
      <div className="relative order-first min-h-[9.75rem] overflow-hidden bg-[#e8e1d5] sm:min-h-[13rem] md:order-last md:min-h-[22rem]">
        {visual || (
          <ResponsiveImage
            media={imageMedia}
            mobileMedia={imageUrl ? null : HOME_HERO_MOBILE_IMAGE}
            src={imageUrl || HOME_HERO_FALLBACK_IMAGE}
            alt="Спальня с постельным бельём в натуральных оттенках"
            className="absolute inset-0 h-full w-full object-cover object-center"
            sizes="(min-width: 768px) 55vw, 100vw"
            priority
            loading="eager"
          />
        )}
      </div>
      <div className="flex flex-col items-start justify-center gap-3 bg-[#f2efe6] px-4 py-4 sm:gap-4 sm:px-7 sm:py-6 md:px-8 lg:px-12 lg:py-8">
        <h1 className="m-0 max-w-[24ch] font-display text-[1.75rem] font-medium leading-[1.07] tracking-tight text-ink sm:text-[2rem] lg:text-[clamp(2.2rem,3.4vw,3.55rem)]">
          {title}{accent ? <> <span className="text-primary">{accent}</span></> : null}
        </h1>
        {description ? <div className="max-w-[44ch] text-sm leading-[1.55] text-muted sm:text-base">{description}</div> : null}

        {actions || (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {ctaText && ctaLink ? <Button as={Link} to={ctaLink}>{ctaText}</Button> : null}
            {secondaryCtaText && secondaryCtaLink ? (
              <Link to={secondaryCtaLink} className="focus-ring-soft inline-flex min-h-11 items-center text-sm font-semibold text-primary underline decoration-primary/25 underline-offset-4">
                {secondaryCtaText}
              </Link>
            ) : null}
          </div>
        )}

        {featuredProduct ? (
          <Link to={featuredProduct.link} className="focus-ring-soft inline-flex min-h-11 max-w-full flex-wrap items-center gap-x-2 text-sm text-primary hover:underline">
            <span>{featuredProduct.name}</span>
            {featuredProduct.priceLabel ? <span className="whitespace-nowrap text-muted">{featuredProduct.priceLabel}</span> : null}
          </Link>
        ) : null}
        {highlights.length ? (
          <div className="hidden w-full flex-wrap gap-x-4 gap-y-1 border-t border-ink/10 pt-2 text-xs text-muted lg:flex">
            {highlights.slice(0, 3).map((item) => (
              item.link?.startsWith('/') ? (
                <Link key={item.title} to={item.link} className="focus-ring-soft inline-flex min-h-8 items-center hover:text-primary">{item.title}</Link>
              ) : <span key={item.title} className="inline-flex min-h-8 items-center">{item.title}</span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default HeroBanner;

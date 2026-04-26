import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../ui';

function HeroVisual({ imageUrl, alt, className = '', ratioClassName = 'pt-[60%]' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[26px] border border-white/80 bg-white/55 shadow-[0_22px_48px_rgba(43,39,34,0.16)] ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/65" />
      <div className={`relative ${ratioClassName}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-muted">
            Добавьте изображение для главного баннера
          </div>
        )}
      </div>
    </div>
  );
}

function HeroBanner({
  imageUrl,
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
  const mobileHighlights = highlights.slice(0, 2);
  const heroAlt = featuredProduct?.name || 'Уютный домашний текстиль';

  return (
    <section className="page-shell page-section--tight">
      <div
        data-testid="home-hero"
        className="catalog-hero relative overflow-hidden rounded-[26px] border border-white/70 px-4 py-3.5 shadow-[0_18px_38px_rgba(43,39,34,0.11)] sm:rounded-[32px] sm:px-5 sm:py-5 md:px-8 md:py-8 lg:px-10 lg:py-10"
      >
        <div className="page-grid--hero relative z-10 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-5">
            <div className="grid grid-cols-[minmax(0,1fr)_6.6rem] items-start gap-3 sm:block">
              <div className="space-y-2.5 sm:space-y-3">
                {badge ? (
                  <p className="text-[10px] uppercase tracking-[0.24em] text-accent sm:text-xs sm:tracking-[0.32em]">
                    {badge}
                  </p>
                ) : null}
                <div className="space-y-2 sm:space-y-3">
                  <h1 className="max-w-3xl text-[1.78rem] font-semibold leading-[0.98] sm:text-4xl md:text-5xl">
                    {title}{' '}
                    {accent ? <span className="text-primary">{accent}</span> : null}
                  </h1>
                  {description ? (
                    <p className="max-w-2xl text-[13px] leading-5 text-muted sm:text-base sm:leading-6">
                      {description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="relative self-start sm:hidden">
                <HeroVisual
                  imageUrl={imageUrl}
                  alt={heroAlt}
                  className="rounded-[22px]"
                  ratioClassName="pt-[138%]"
                />
              </div>
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

            {mobileHighlights.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:hidden">
                {mobileHighlights.map((item) => (
                  <Card
                    key={item.title}
                    as={Link}
                    to={item.link}
                    variant="quiet"
                    padding="sm"
                    interactive
                    className="min-h-[88px] rounded-[20px] p-2.5"
                  >
                    <p className="text-[13px] font-semibold leading-4 text-ink">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">
                      {item.subtitle}
                    </p>
                  </Card>
                ))}
              </div>
            ) : null}

            {highlights.length > 0 ? (
              <div className="hidden gap-3 sm:grid sm:grid-cols-2">
                {highlights.map((item) => (
                  <Card
                    key={item.title}
                    as={Link}
                    to={item.link}
                    variant="quiet"
                    padding="sm"
                    interactive
                    className="rounded-[24px]"
                  >
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">{item.subtitle}</p>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <HeroVisual
              imageUrl={imageUrl}
              alt={heroAlt}
              className="hidden sm:block rounded-[30px]"
              ratioClassName="pt-[95%]"
            />

            {featuredProduct ? (
              <Card
                variant="soft"
                padding="sm"
                className="mt-4 hidden rounded-[24px] border border-white/80 bg-white/92 backdrop-blur sm:absolute sm:-bottom-6 sm:left-5 sm:right-5 sm:mt-0 sm:block"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                  Выбор недели
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-ink">
                      {featuredProduct.name}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      от {featuredProduct.priceLabel}
                    </p>
                  </div>
                  <Button
                    as={Link}
                    to={featuredProduct.link}
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-primary"
                  >
                    Открыть →
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;

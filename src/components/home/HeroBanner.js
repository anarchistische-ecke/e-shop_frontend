import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../ui';

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
  return (
    <section className="page-shell page-section--tight">
      <div className="catalog-hero relative overflow-hidden rounded-[32px] border border-white/70 px-4 py-5 shadow-[0_24px_56px_rgba(43,39,34,0.14)] sm:px-5 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute -left-10 top-6 h-36 w-36 rounded-full bg-primary/18 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-sky/60 blur-3xl" />

        <div className="page-grid--hero relative z-10">
          <div className="space-y-5">
            {badge ? (
              <p className="text-xs uppercase tracking-[0.32em] text-accent">{badge}</p>
            ) : null}
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold leading-[1.02] sm:text-4xl md:text-5xl">
                {title}{' '}
                {accent ? <span className="text-primary">{accent}</span> : null}
              </h1>
              {description ? (
                <p className="max-w-2xl text-base text-muted">{description}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {ctaText && ctaLink ? (
                <Button as={Link} to={ctaLink} className="w-full sm:w-auto">
                  {ctaText}
                </Button>
              ) : null}
              {secondaryCtaText && secondaryCtaLink ? (
                <Button
                  as={Link}
                  to={secondaryCtaLink}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {secondaryCtaText}
                </Button>
              ) : null}
            </div>

            {highlights.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="absolute -top-4 right-4 h-20 w-20 rounded-full bg-white/60 blur-2xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-white/50 shadow-[0_28px_60px_rgba(43,39,34,0.18)]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-white/65" />
              <div className="relative pt-[110%] sm:pt-[95%]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={featuredProduct?.name || 'Уютный домашний текстиль'}
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

            {featuredProduct ? (
              <Card
                variant="soft"
                padding="sm"
                className="mt-4 rounded-[24px] border border-white/80 bg-white/92 backdrop-blur sm:absolute sm:-bottom-6 sm:left-5 sm:right-5 sm:mt-0"
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

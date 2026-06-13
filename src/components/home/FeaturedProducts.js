import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../ui';
import ProductCard from '../common/ProductCard';
import { trackProductList } from '../../utils/metrika';

function FeaturedProductsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`featured-mobile-skeleton-${index}`}
            className="rounded-[22px] border border-white/80 bg-white/88 p-2.5"
          >
            <div className="skeleton shimmer-safe h-[132px] rounded-[18px]" />
            <div className="mt-3 space-y-2">
              <div className="skeleton shimmer-safe h-4 w-4/5 rounded-full" />
              <div className="skeleton shimmer-safe h-3 w-1/2 rounded-full" />
              <div className="skeleton shimmer-safe h-5 w-1/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:grid page-grid--catalog">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`featured-desktop-skeleton-${index}`}
            className="rounded-[24px] border border-white/80 bg-white/88 p-3"
          >
            <div className="skeleton shimmer-safe h-[240px] rounded-[20px]" />
            <div className="mt-4 space-y-2">
              <div className="skeleton shimmer-safe h-4 w-4/5 rounded-full" />
              <div className="skeleton shimmer-safe h-3 w-1/2 rounded-full" />
              <div className="skeleton shimmer-safe h-5 w-1/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FeaturedProducts({
  eyebrow,
  title,
  description,
  products = [],
  loading = false,
  ctaText,
  ctaLink
}) {
  const slides = useMemo(() => products.slice(0, 8), [products]);

  useEffect(() => {
    if (!slides.length) return;
    trackProductList(slides, {
      listName: `home_${String(title || 'featured').toLowerCase().replace(/\s+/g, '_')}`,
      pageType: 'home'
    });
  }, [slides, title]);

  return (
    <section className="page-shell page-section">
      <div className="section-header">
        <div className="section-header__copy">
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.28em] text-accent">{eyebrow}</p>
          ) : null}
          <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {ctaText && ctaLink ? (
          <Button as={Link} to={ctaLink} variant="ghost" className="self-start text-primary">
            {ctaText}
          </Button>
        ) : null}
      </div>

      <div className="mt-5 lg:mt-4">
        {loading ? (
          <FeaturedProductsSkeleton />
        ) : slides.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {slides.slice(0, 6).map((product, index) => (
                <ProductCard
                  key={`${title}-${product.id}`}
                  product={product}
                  deferThumbnails
                  priority={index < 2}
                  imageSizes="(max-width: 767px) 48vw, 18rem"
                  listName={`home_${String(title || 'featured').toLowerCase().replace(/\s+/g, '_')}`}
                  position={index + 1}
                />
              ))}
            </div>

            <div className="hidden md:grid page-grid--catalog">
              {slides.slice(0, 4).map((product, index) => (
                <ProductCard
                  key={`${title}-desktop-${product.id}`}
                  product={product}
                  deferThumbnails
                  listName={`home_${String(title || 'featured').toLowerCase().replace(/\s+/g, '_')}`}
                  position={index + 1}
                />
              ))}
            </div>
          </>
        ) : (
          <Card padding="lg" className="text-center">
            <p className="text-lg font-semibold text-ink">Подборка появится после загрузки каталога</p>
            <p className="mt-2 text-sm text-muted">
              Добавьте товары в каталог, чтобы показать блок с карточками на главной.
            </p>
          </Card>
        )}
      </div>
    </section>
  );
}

export default FeaturedProducts;

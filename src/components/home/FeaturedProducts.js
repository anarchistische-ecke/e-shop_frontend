import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../ui';
import ProductCard from '../common/ProductCard';
import CarouselControls from './CarouselControls';

function FeaturedProductsSkeleton() {
  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`featured-mobile-skeleton-${index}`}
            className="w-[82vw] max-w-[20rem] flex-none rounded-[24px] border border-white/80 bg-white/88 p-3"
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
  const mobileScrollerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = useMemo(() => products.slice(0, 8), [products]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [slides.length, title]);

  useEffect(() => {
    const node = mobileScrollerRef.current;
    if (!node) {
      return undefined;
    }

    const handleScroll = () => {
      const items = Array.from(node.querySelectorAll('[data-carousel-item]'));
      if (!items.length) {
        setCurrentIndex(0);
        return;
      }

      const left = node.scrollLeft;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      items.forEach((item, index) => {
        const distance = Math.abs(item.offsetLeft - left);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setCurrentIndex(closestIndex);
    };

    node.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      node.removeEventListener('scroll', handleScroll);
    };
  }, [slides.length]);

  const scrollToIndex = (index) => {
    const node = mobileScrollerRef.current;
    if (!node) {
      return;
    }

    const items = Array.from(node.querySelectorAll('[data-carousel-item]'));
    const nextIndex = Math.max(0, Math.min(index, items.length - 1));
    const nextItem = items[nextIndex];
    if (!nextItem) {
      return;
    }

    nextItem.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start'
    });
    setCurrentIndex(nextIndex);
  };

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

      <div className="mt-6">
        {loading ? (
          <FeaturedProductsSkeleton />
        ) : slides.length > 0 ? (
          <>
            <div
              ref={mobileScrollerRef}
              className="flex gap-4 overflow-x-auto pb-2 pr-4 scrollbar-hide snap-x snap-mandatory md:hidden"
            >
              {slides.map((product) => (
                <div
                  key={`${title}-${product.id}`}
                  data-carousel-item
                  className="w-[82vw] max-w-[20rem] flex-none snap-start"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <div className="hidden md:grid page-grid--catalog">
              {slides.slice(0, 4).map((product) => (
                <ProductCard key={`${title}-desktop-${product.id}`} product={product} />
              ))}
            </div>

            <div className="md:hidden">
              <CarouselControls
                currentIndex={currentIndex}
                totalSlides={slides.length}
                label={title}
                onPrev={() => scrollToIndex(currentIndex - 1)}
                onNext={() => scrollToIndex(currentIndex + 1)}
                onSelect={(index) => scrollToIndex(index)}
              />
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

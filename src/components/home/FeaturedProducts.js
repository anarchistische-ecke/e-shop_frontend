import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../common/ProductCard';
import { trackProductList } from '../../utils/metrika';

function FeaturedProducts({ title, products = [], loading = false, ctaText, ctaLink }) {
  const listName = `home_${String(title || 'featured').toLowerCase().replace(/\s+/g, '_')}`;

  useEffect(() => {
    if (products.length > 0) trackProductList(products, { listName, pageType: 'home' });
  }, [listName, products]);

  if (!loading && !products.length) return null;

  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="font-display text-2xl font-medium sm:text-3xl">{title}</h2>
        {ctaText && ctaLink ? (
          <Link to={ctaLink} className="focus-ring-soft inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-sm font-semibold text-primary hover:underline">
            {ctaText}<span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>

      <div className="page-grid--catalog">
        {loading && !products.length
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="aspect-square rounded-lg bg-[#eee9df]" />
            ))
          : products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                deferThumbnails
                priority={index < 2}
                listName={listName}
                position={index + 1}
              />
            ))}
      </div>
    </section>
  );
}

export default FeaturedProducts;

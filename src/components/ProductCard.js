import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { reviews } from '../data/reviews';
import { getPrimaryVariant, getPrimaryImageUrl, getProductPrice, moneyToNumber } from '../utils/product';

const reviewStats = reviews.reduce((acc, review) => {
  const entry = acc[review.productId] || { total: 0, count: 0 };
  entry.total += review.rating;
  entry.count += 1;
  acc[review.productId] = entry;
  return acc;
}, {});

function ProductCard({ product }) {
  const primaryVariant = getPrimaryVariant(product);
  const currentPrice = primaryVariant?.price
    ? moneyToNumber(primaryVariant.price)
    : getProductPrice(product);
  const oldPrice = product.oldPrice ? moneyToNumber(product.oldPrice) : null;
  const discount = oldPrice
    ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : null;
  const imageUrl = getPrimaryImageUrl(product);
  const rating = product.rating || 0;
  const reviewCount =
    product.reviewCount ??
    product.reviewsCount ??
    product.reviews_count ??
    reviewStats[product.id]?.count ??
    0;
  const derivedRating = reviewStats[product.id]?.count
    ? reviewStats[product.id].total / reviewStats[product.id].count
    : rating;
  const displayRating = derivedRating || rating;

  const getStockCount = () => {
    if (!product) return 0;
    if (product.stock !== undefined || product.stockQuantity !== undefined) {
      return Number(product.stock ?? product.stockQuantity ?? 0);
    }
    const variants = Array.isArray(product.variants) ? product.variants : Array.from(product.variants || []);
    return variants.reduce(
      (sum, variant) => sum + Number(variant?.stock ?? variant?.stockQuantity ?? 0),
      0
    );
  };

  const stockCount = getStockCount();
  const isLowStock = stockCount > 0 && stockCount <= 3;

  return (
    <div className="product-card group border border-ink/10 rounded-[26px] bg-white/90 flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(43,39,34,0.14)]">
      <Link to={`/product/${product.id}`} className="block relative pt-[74%] overflow-hidden">
        <div className="absolute inset-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sand/60 to-white flex items-center justify-center text-muted text-sm">
              Нет фото
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          {discount && (
            <span className="bg-primary text-white text-xs px-3 py-1 rounded-full shadow">
              −{discount}%
            </span>
          )}
          {isLowStock && (
            <span className="ml-auto bg-white/90 text-ink text-xs px-3 py-1 rounded-full border border-ink/10 shadow-sm">
              Осталось {stockCount}
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h5 className="text-base font-semibold leading-snug">{product.name}</h5>
        <div className="flex items-center gap-2 text-sm text-muted">
          {displayRating > 0 ? (
            <>
              <span className="text-primary">
                {'★'.repeat(Math.round(displayRating))}
                {'☆'.repeat(5 - Math.round(displayRating))}
              </span>
              <span className="text-ink/70">{displayRating.toFixed(1)}</span>
              <span className="text-ink/50">({reviewCount})</span>
            </>
          ) : (
            <span className="text-ink/50">Нет отзывов</span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-accent font-semibold">
              {currentPrice.toLocaleString('ru-RU')} ₽
            </span>
            {oldPrice && (
              <span className="line-through text-muted text-sm">
                {oldPrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
          <AddToCartButton product={product} variantId={primaryVariant?.id} />
        </div>
      </div>
    </div>
  );
}

function AddToCartButton({ product, variantId }) {
  const { addItem } = useContext(CartContext);
  const [isBouncing, setIsBouncing] = React.useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    addItem(product, variantId);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);
  };

  return (
    <button
      className={`add-to-cart-btn inline-flex items-center gap-1 rounded-2xl bg-accent text-white px-3 py-2 text-xs font-semibold shadow-[0_10px_20px_rgba(47,61,50,0.24)] transition-transform transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${isBouncing ? 'animate-bounce' : ''}`}
      onClick={handleClick}
    >
      <span>В корзину</span>
    </button>
  );
}

export default ProductCard;

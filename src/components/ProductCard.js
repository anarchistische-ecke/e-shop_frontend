import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { getPrimaryVariant, getPrimaryImageUrl, getProductPrice, moneyToNumber } from '../utils/product';

/**
 * ProductCard displays a product summary with pricing, rating and an
 * add‑to‑cart button.  It gracefully handles both primitive price
 * values and Money objects returned by the backend.  When a user
 * clicks the cart icon the product is added to the cart via the
 * CartContext.
 */
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

  return (
    <div className="product-card border border-gray-200 rounded-xl bg-white flex flex-col overflow-hidden transition-transform transform hover:shadow-lg hover:-translate-y-1">
      <Link to={`/product/${product.id}`} className="block relative pt-[66.66%] overflow-hidden">
        <div className="absolute inset-0">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-white flex items-center justify-center text-muted text-sm">
              Нет фото
            </div>
          )}
        </div>
        {discount && (
          <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full shadow">
            −{discount}%
          </span>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1 gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-primary font-semibold">
            {currentPrice.toLocaleString('ru-RU')} ₽
          </span>
          {oldPrice && (
            <span className="line-through text-muted text-sm">
              {oldPrice.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>
        <h5 className="mt-1 mb-1 text-sm font-medium flex-1 overflow-hidden text-ellipsis">
          {product.name}
        </h5>
        <div className="flex items-center justify-between">
          <div className="text-sm text-primary">
            {'★'.repeat(Math.round(product.rating || 0))}
            {'☆'.repeat(5 - Math.round(product.rating || 0))}
            <span className="ml-1 text-muted">{(product.rating || 0).toFixed(1)}</span>
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
      className={`add-to-cart-btn bg-primary text-white px-2 py-1 rounded transition-transform transform hover:scale-105 active:scale-95 ${isBouncing ? 'animate-bounce' : ''}`}
      onClick={handleClick}
    >
      🛒
    </button>
  );
}

export default ProductCard;

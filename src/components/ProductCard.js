import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';

/**
 * ProductCard displays a product summary with pricing, rating and an
 * add‑to‑cart button.  It gracefully handles both primitive price
 * values and Money objects returned by the backend.  When a user
 * clicks the cart icon the product is added to the cart via the
 * CartContext.
 */
function ProductCard({ product }) {
  // Derive numeric price and old price from the product.  The API
  // may return price fields as Money objects (with amount and
  // currency) or as plain numbers.
  const currentPrice = typeof product.price === 'object'
    ? product.price.amount / 100
    : product.price || 0;
  const oldPrice = product.oldPrice
    ? (typeof product.oldPrice === 'object'
        ? product.oldPrice.amount / 100
        : product.oldPrice)
    : null;
  const discount = oldPrice
    ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : null;

  return (
    <div className="product-card border border-gray-200 rounded bg-white flex flex-col overflow-hidden transition-transform transform hover:shadow-lg hover:-translate-y-1">
      <Link
        to={`/product/${product.id}`}
        className="block relative pt-[66.66%]"
      >
        <div className="absolute inset-0 bg-[#e9e7e3]"></div>
      </Link>
      <div className="p-2 flex flex-col flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-primary font-semibold">
            {currentPrice.toLocaleString('ru-RU')} ₽
          </span>
          {oldPrice && (
            <span className="line-through text-muted text-sm">
              {oldPrice.toLocaleString('ru-RU')} ₽
            </span>
          )}
          {discount && (
            <span className="bg-primary text-white text-xs px-1 rounded">
              −{discount}%
            </span>
          )}
        </div>
        <h5 className="mt-2 mb-1 text-sm font-medium flex-1">
          {product.name}
        </h5>
        <div className="flex items-center justify-between">
          <div className="text-sm text-primary">
            {'★'.repeat(Math.round(product.rating || 0))}
            {'☆'.repeat(5 - Math.round(product.rating || 0))}
            <span className="ml-1 text-muted">{(product.rating || 0).toFixed(1)}</span>
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}

function AddToCartButton({ product }) {
  const { addItem } = useContext(CartContext);
  const [isBouncing, setIsBouncing] = React.useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    addItem(product);
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
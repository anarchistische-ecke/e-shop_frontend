import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';

/**
 * Reusable card component to display a single product summary.  The
 * layout roughly follows the cards on the original site: a top image
 * area, pricing information with current and old prices, the
 * product name and a simplified star rating.  Clicking the card
 * navigates to the product details page.
 */
function ProductCard({ product }) {
  // Compute discount percentage if both prices are provided
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  return (
    <div className="product-card border border-gray-200 rounded bg-white flex flex-col overflow-hidden transition-transform transform hover:shadow-lg hover:-translate-y-1">
      <Link
        to={`/product/${product.id}`}
        className="block relative pt-[66.66%]"
      >
        {/* Placeholder image fills the card area using absolute positioning */}
        <div className="absolute inset-0 bg-[#e9e7e3]"></div>
      </Link>
      <div className="p-2 flex flex-col flex-1">
        {/* Price row */}
        <div className="flex items-baseline gap-2">
          <span className="text-primary font-semibold">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          {product.oldPrice && (
            <span className="line-through text-muted text-sm">
              {product.oldPrice.toLocaleString('ru-RU')} ₽
            </span>
          )}
          {discount && (
            <span className="bg-primary text-white text-xs px-1 rounded">
              −{discount}%
            </span>
          )}
        </div>
        {/* Product name */}
        <h5 className="mt-2 mb-1 text-sm font-medium flex-1">
          {product.name}
        </h5>
        {/* Rating and add to cart button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-primary">
            {'★'.repeat(Math.round(product.rating))}
            {'☆'.repeat(5 - Math.round(product.rating))}
            <span className="ml-1 text-muted">{product.rating.toFixed(1)}</span>
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}

/**
 * Separate component used to hook into the CartContext.  Splitting
 * into its own function avoids recreating the context reference on
 * each card render and keeps the JSX in ProductCard cleaner.
 */
function AddToCartButton({ product }) {
  const { addItem } = useContext(CartContext);
  const [isBouncing, setIsBouncing] = React.useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    addItem(product);
    // Trigger a temporary bounce animation
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);
  };

  return (
    <button
      className={`add-to-cart-btn bg-primary text-white px-2 py-1 rounded transition-transform transform hover:scale-105 active:scale-95 ${
        isBouncing ? 'animate-bounce' : ''
      }`}
      onClick={handleClick}
    >
      🛒
    </button>
  );
}

export default ProductCard;
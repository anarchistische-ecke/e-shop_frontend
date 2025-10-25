import React, { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { products } from '../data/products';
import { reviews } from '../data/reviews';
import { CartContext } from '../contexts/CartContext';

/**
 * ProductPage renders detailed information about a single product.  It
 * includes a gallery with thumbnails (using a single placeholder here),
 * pricing information, a description and a simple tabbed interface
 * replicating the various informational panels from the original site.
 */
function ProductPage() {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const productReviews = reviews.filter((r) => r.productId === id);
  const [activeTab, setActiveTab] = useState('about');

  const { addItem } = useContext(CartContext);

  if (!product) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-semibold mb-2">Товар не найден</h1>
          <p>К сожалению, продукта с указанным идентификатором не существует.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page py-8">
      <div className="container mx-auto px-4 flex flex-wrap gap-8">
        {/* Image gallery */}
        <div className="flex-1 min-w-[280px]">
          <div className="relative pt-[75%] bg-[#e9e7e3] rounded"></div>
          <div className="flex gap-2 mt-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex-1 pt-[75%] bg-[#f3f1ef] rounded"></div>
            ))}
          </div>
        </div>
        {/* Product information */}
        <div className="flex-1 min-w-[280px]">
          <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>
          <div className="text-primary text-2xl font-semibold mb-2">
            {product.price.toLocaleString('ru-RU')} ₽
            {product.oldPrice && (
              <span className="text-lg line-through text-muted ml-2">
                {product.oldPrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
          <div className="text-primary text-base mb-2">
            {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
            <span className="ml-1 text-muted">{product.rating.toFixed(1)}</span>
          </div>
          {/* Add to cart button */}
          <button className="button mb-4" onClick={() => addItem(product)}>
            Добавить в корзину
          </button>
          {/* Tabs */}
          <div className="border-b border-gray-200 flex gap-4 mb-4">
            <button
              onClick={() => setActiveTab('about')}
              className={`py-2 ${activeTab === 'about' ? 'border-b-2 border-primary font-semibold' : ''}`}
            >
              О товаре
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-2 ${activeTab === 'reviews' ? 'border-b-2 border-primary font-semibold' : ''}`}
            >
              Отзывы ({productReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 ${activeTab === 'details' ? 'border-b-2 border-primary font-semibold' : ''}`}
            >
              Характеристики
            </button>
          </div>
          {/* Tab content */}
          {activeTab === 'about' && (
            <div>
              <p>{product.description}</p>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div>
              {productReviews.length > 0 ? (
                productReviews.map((rev, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-2 mb-2">
                    <div className="text-primary text-sm">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    <p className="mt-1">{rev.text}</p>
                    <p className="text-xs text-muted italic">— {rev.author}</p>
                  </div>
                ))
              ) : (
                <p>На этот товар пока нет отзывов.</p>
              )}
            </div>
          )}
          {activeTab === 'details' && (
            <div>
              <p>Здесь будут приведены подробные характеристики товара. Добавьте необходимые поля в объект продукта.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
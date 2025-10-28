import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { getProduct } from '../api';
import { reviews } from '../data/reviews';

/**
 * ProductPage shows detailed information about a single product.  It
 * fetches the product by ID from the backend, displays pricing,
 * ratings and description and allows the user to add the item to
 * their cart.  Customer reviews are currently static sample data.
 */
function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const { addItem } = useContext(CartContext);

  useEffect(() => {
    getProduct(id)
      .then((data) => setProduct(data))
      .catch((err) => {
        console.error('Failed to fetch product:', err);
        setProduct(null);
      });
  }, [id]);

  // Filter reviews for this product
  const productReviews = reviews.filter((r) => r.productId === id);

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

  // Derive numeric prices
  const price = typeof product.price === 'object' ? product.price.amount / 100 : product.price || 0;
  const oldPrice = product.oldPrice
    ? (typeof product.oldPrice === 'object' ? product.oldPrice.amount / 100 : product.oldPrice)
    : null;
  const rating = product.rating || 0;

  return (
    <div className="product-page py-8">
      <div className="container mx-auto px-4 flex flex-wrap gap-8">
        {/* Image gallery placeholder */}
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
            {price.toLocaleString('ru-RU')} ₽
            {oldPrice && (
              <span className="text-lg line-through text-muted ml-2">
                {oldPrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
          <div className="text-primary text-base mb-2">
            {'★'.repeat(Math.round(rating))}
            {'☆'.repeat(5 - Math.round(rating))}
            <span className="ml-1 text-muted">{rating.toFixed(1)}</span>
          </div>
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
              <p>{product.description || 'Описание отсутствует.'}</p>
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
              <p>
                Здесь будут приведены подробные характеристики товара. Добавьте необходимые поля в объект
                продукта на сервере и отобразите их здесь.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
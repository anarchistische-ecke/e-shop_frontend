import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { getProduct } from '../api';
import { reviews } from '../data/reviews';
import { getPrimaryImageUrl } from '../utils/product';

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [activeImage, setActiveImage] = useState(null);
  const { addItem } = useContext(CartContext);

  useEffect(() => {
    getProduct(id)
      .then((data) => {
        setProduct(data);
        // If multiple variants exist, default to first variant
        if (data && data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        const firstImage = getPrimaryImageUrl(data);
        setActiveImage(firstImage);
      })
      .catch((err) => {
        console.error('Failed to fetch product:', err);
        setProduct(null);
      });
  }, [id]);

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

  // Determine price and old price based on selected variant (if any)
  const price = selectedVariant 
    ? (typeof selectedVariant.price === 'object' ? selectedVariant.price.amount / 100 : selectedVariant.price) 
    : (typeof product.price === 'object' ? product.price.amount / 100 : product.price || 0);
  const availableStock = selectedVariant
    ? selectedVariant.stock ?? selectedVariant.stockQuantity ?? 0
    : product.stock ?? product.stockQuantity ?? 0;
  const oldPrice = product.oldPrice 
    ? (typeof product.oldPrice === 'object' ? product.oldPrice.amount / 100 : product.oldPrice) 
    : null;
  const rating = product.rating || 0;
  const imageGallery = Array.isArray(product.images)
    ? product.images.map((img) => (typeof img === 'string' ? img : img.url)).filter(Boolean)
    : [];
  const mainImage = activeImage || imageGallery[0] || null;

  // All reviews for this product (using static sample data for now)
  const productReviews = reviews.filter((r) => r.productId === id);

  const handleAddToCart = () => {
    if (availableStock <= 0) {
      alert('Товар закончился на складе');
      return;
    }
    // Use variant id if available for adding to cart
    const variantId = selectedVariant ? selectedVariant.id : product.id;
    addItem(product, variantId);
  };

  return (
    <div className="product-page py-8">
      <div className="container mx-auto px-4 flex flex-wrap gap-8">
        {/* Product image gallery */}
        <div className="flex-1 min-w-[280px]">
          <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-secondary to-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
                Изображение появится после загрузки
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
            {(imageGallery.length > 0 ? imageGallery : [null]).map((src, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(src)}
                className={`w-20 h-20 rounded-lg overflow-hidden border ${src === activeImage ? 'border-primary' : 'border-gray-200'} bg-secondary flex-shrink-0`}
              >
                {src ? (
                  <img src={src} alt={`Изображение ${idx + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-xs text-muted px-2 text-center">
                    Пока без фото
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Product details */}
        <div className="flex-1 min-w-[280px]">
          <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>
          <div className="text-primary text-2xl font-semibold mb-2">
            {price.toLocaleString('ru-RU')} ₽
            {oldPrice && (
              <span className="text-lg line-through text-muted ml-3">
                {oldPrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
          <div className="text-primary text-base mb-4">
            {'★'.repeat(Math.round(rating))}
            {'☆'.repeat(5 - Math.round(rating))}
            <span className="ml-1 text-muted">{rating.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded">
              <span>🚚</span>
              <span className="text-muted">Доставка от 5000 ₽</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded">
              <span>↺</span>
              <span className="text-muted">Возврат 14 дней</span>
            </div>
          </div>

          {/* Variant selection (if multiple variants) */}
          {product.variants && product.variants.length > 1 && (
            <div className="mb-4">
              <label htmlFor="variant" className="block text-sm font-medium mb-1">
                Выберите вариант:
              </label>
              <select 
                id="variant" 
                value={selectedVariant?.id || ''} 
                onChange={(e) => {
                  const variantId = e.target.value;
                  const variant = product.variants.find((v) => v.id === variantId);
                  setSelectedVariant(variant);
                }} 
                className="p-2 border border-gray-300 rounded"
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 mb-3 text-sm">
            <span className={availableStock > 0 ? 'text-green-700' : 'text-red-700'}>
              {availableStock > 0 ? `В наличии: ${availableStock} шт.` : 'Нет в наличии'}
            </span>
          </div>

          <button 
            className="button mb-6 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={handleAddToCart}
            disabled={availableStock <= 0}
          >
            Добавить в корзину
          </button>

          {/* Tabbed content (Description/Reviews/Details) */}
          <div className="border-b border-gray-200 flex gap-6 text-sm mb-4">
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
          {/* Tab panels */}
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
              <p>Здесь будут приведены подробные характеристики товара.</p>
              {/* In a real app, additional product fields like dimensions, materials, etc., would be displayed here. */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;

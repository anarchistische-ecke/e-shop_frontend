import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { getProduct, getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import { reviews } from '../data/reviews';
import {
  normalizeProductImages,
  moneyToNumber,
  getPrimaryVariant,
  getProductPrice
} from '../utils/product';

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [bundleSelections, setBundleSelections] = useState({});
  const [subscribeAndSave, setSubscribeAndSave] = useState(false);
  const { addItem } = useContext(CartContext);

  useEffect(() => {
    setRelatedProducts([]);
    setBundleSelections({});
    setSubscribeAndSave(false);
    setActiveTab('about');
  }, [id]);

  useEffect(() => {
    getProduct(id)
      .then((data) => {
        if (data?.isActive === false) {
          setProduct(null);
          setSelectedVariant(null);
          setActiveImageIndex(0);
          return;
        }
        setProduct(data);
        if (data && data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        } else {
          setSelectedVariant(null);
        }
        setActiveImageIndex(0);
      })
      .catch((err) => {
        console.error('Failed to fetch product:', err);
        setProduct(null);
      });
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    if (!product) return undefined;
    const resolveProductCategoryKey = (item) => {
      const categoryValue =
        item?.category ||
        item?.categoryId ||
        item?.category_id ||
        item?.categorySlug ||
        item?.category_slug ||
        item?.category?.id ||
        item?.category?.slug ||
        item?.category?.name;
      const categoryKey =
        typeof categoryValue === 'string'
          ? categoryValue
          : categoryValue?.id || categoryValue?.slug || categoryValue?.name || '';
      return categoryKey ? String(categoryKey) : '';
    };

    getProducts()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        const targetKey = resolveProductCategoryKey(product);
        const related = list.filter((item) => {
          if (!item || item.id === product.id) return false;
          if (!targetKey) return true;
          return resolveProductCategoryKey(item) === targetKey;
        });
        setRelatedProducts(related.slice(0, 4));
      })
      .catch((err) => console.error('Failed to fetch related products:', err));

    return () => {
      isMounted = false;
    };
  }, [product]);

  useEffect(() => {
    if (!relatedProducts.length) return;
    setBundleSelections((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next = {};
      relatedProducts.slice(0, 2).forEach((item) => {
        if (item?.id) next[item.id] = true;
      });
      return next;
    });
  }, [relatedProducts]);

  const images = useMemo(() => normalizeProductImages(product?.images || []), [product]);
  const variantNameById = useMemo(() => {
    const map = {};
    (product?.variants || []).forEach((v) => {
      if (v?.id) map[v.id] = v.name || v.sku || v.id;
    });
    return map;
  }, [product]);

  const orderedImages = useMemo(() => {
    if (!images.length) return [];
    if (selectedVariant?.id) {
      const scoped = images.filter((img) => img.variantId === selectedVariant.id);
      if (scoped.length > 0) {
        const rest = images.filter((img) => img.variantId !== selectedVariant.id);
        return [...scoped, ...rest];
      }
    }
    return images;
  }, [images, selectedVariant]);

  useEffect(() => {
    if (!orderedImages.length) {
      setActiveImageIndex(0);
      return;
    }
    const variantIndex = selectedVariant?.id
      ? orderedImages.findIndex((img) => img.variantId === selectedVariant.id)
      : 0;
    setActiveImageIndex((prev) => {
      const nextIndex =
        variantIndex >= 0 ? variantIndex : Math.min(prev, orderedImages.length - 1);
      return Number.isFinite(nextIndex) ? nextIndex : 0;
    });
  }, [orderedImages, selectedVariant]);

  const activeImage = orderedImages[activeImageIndex] || null;
  const mainImage = activeImage?.url || null;

  const productReviews = reviews.filter((r) => r.productId === id);
  const specificationSections = useMemo(() => {
    const raw = product?.specifications;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((section) => {
        if (!section) return null;
        const items = Array.isArray(section.items)
          ? section.items
              .map((item) => ({
                label: item?.label || '',
                value: item?.value || '',
              }))
              .filter((item) => item.label || item.value)
          : [];
        return {
          title: section.title || '',
          description: section.description || '',
          items,
        };
      })
      .filter((section) => section && (section.title || section.description || section.items.length > 0));
  }, [product]);

  if (!product) {
    return (
      <div className="py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-semibold mb-2">Товар не найден</h1>
          <p>К сожалению, продукта с указанным идентификатором не существует.</p>
        </div>
      </div>
    );
  }

  const price = selectedVariant
    ? moneyToNumber(selectedVariant.price)
    : moneyToNumber(product.price || 0);
  const availableStock = selectedVariant
    ? selectedVariant.stock ?? selectedVariant.stockQuantity ?? 0
    : product.stock ?? product.stockQuantity ?? 0;
  const oldPrice = product.oldPrice ? moneyToNumber(product.oldPrice) : null;
  const rating = product.rating || 0;
  const reviewCount = productReviews.length;
  const isLowStock = availableStock > 0 && availableStock <= 3;

  const subscriptionPrice = subscribeAndSave ? Math.round(price * 0.9) : price;

  const highlightList = [
    product.material ? `Материал: ${product.material}` : 'Натуральные ткани и мягкая текстура',
    product.threadCount ? `Плотность: ${product.threadCount}` : 'Дышащая структура для спокойного сна',
    'Сертифицировано и подходит для чувствительной кожи',
  ];

  const specList = [
    product.size ? `Размер: ${product.size}` : 'Размеры соответствуют стандартам РФ',
    product.color ? `Цвет: ${product.color}` : 'Стабильные оттенки после стирки',
    product.care || 'Уход: деликатная стирка при 30°',
  ];

  const bundleItems = relatedProducts.slice(0, 3);
  const bundleAddOnTotal = bundleItems.reduce((sum, item) => {
    if (!bundleSelections[item.id]) return sum;
    return sum + getProductPrice(item);
  }, 0);
  const bundleTotal = price + bundleAddOnTotal;

  const handleAddToCart = () => {
    if (availableStock <= 0) {
      alert('Товар закончился на складе');
      return;
    }
    const variantId = selectedVariant ? selectedVariant.id : product.id;
    addItem(product, variantId);
  };

  const handleAddBundle = () => {
    handleAddToCart();
    bundleItems.forEach((item) => {
      if (!bundleSelections[item.id]) return;
      const variant = getPrimaryVariant(item);
      if (variant?.id) {
        addItem(item, variant.id);
      }
    });
  };

  const selectImageByIndex = (index) => {
    if (!orderedImages.length) return;
    const safeIndex = (index + orderedImages.length) % orderedImages.length;
    const nextImage = orderedImages[safeIndex];
    setActiveImageIndex(safeIndex);
    if (nextImage?.variantId && selectedVariant?.id !== nextImage.variantId) {
      const variant = (product?.variants || []).find((v) => v.id === nextImage.variantId);
      if (variant) setSelectedVariant(variant);
    }
  };

  const handleNextImage = () => selectImageByIndex(activeImageIndex + 1);
  const handlePrevImage = () => selectImageByIndex(activeImageIndex - 1);

  return (
    <div className="product-page py-8 sm:py-10 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-24">
      <div className="container mx-auto px-4">
        <nav className="text-xs text-muted mb-5">
          <Link to="/" className="hover:text-primary">Главная</Link> /{' '}
          <Link to="/category/popular" className="hover:text-primary">Каталог</Link> /{' '}
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-6 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div>
            <div className="relative w-full aspect-[1/1] sm:aspect-[4/5] rounded-[28px] sm:rounded-[32px] overflow-hidden border border-white/80 shadow-[0_24px_60px_rgba(43,39,34,0.16)] bg-gradient-to-br from-sand/70 to-white">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
                  Изображение появится после загрузки
                </div>
              )}
              {activeImage?.variantId && (
                <div className="absolute top-4 left-4 bg-white/85 backdrop-blur rounded-2xl px-3 py-1 text-xs font-medium border border-ink/10 shadow-sm">
                  Вариант: {variantNameById[activeImage.variantId] || activeImage.variantId}
                </div>
              )}
              {orderedImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-ink rounded-2xl w-9 h-9 sm:w-10 sm:h-10 shadow border border-ink/10"
                    onClick={handlePrevImage}
                    aria-label="Предыдущее изображение"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-ink rounded-2xl w-9 h-9 sm:w-10 sm:h-10 shadow border border-ink/10"
                    onClick={handleNextImage}
                    aria-label="Следующее изображение"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 mt-4 overflow-x-auto pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory">
              {(orderedImages.length > 0 ? orderedImages : [null]).map((img, idx) => (
                <button
                  key={img ? img.id || idx : idx}
                  type="button"
                  onClick={() => selectImageByIndex(idx)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border snap-center ${
                    idx === activeImageIndex ? 'border-primary ring-2 ring-primary/30' : 'border-ink/10'
                  } bg-sand/60 flex-shrink-0`}
                >
                  {img ? (
                    <>
                      <img
                        src={img.url}
                        alt={`Изображение ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      {img.variantId && (
                        <span className="absolute bottom-1 left-1 bg-accent/80 text-white text-[10px] px-1.5 py-0.5 rounded-2xl">
                          {variantNameById[img.variantId] || 'Вариант'}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-xs text-muted px-2 text-center">
                      Пока без фото
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3 sm:gap-3">
              {highlightList.map((item) => (
                <div key={item} className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-xs sm:text-sm shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="soft-card p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Бестселлер</p>
              <h1 className="text-xl sm:text-2xl font-semibold mt-2 mb-3">{product.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted mb-3">
                {rating > 0 ? (
                  <>
                    <span className="text-primary">
                      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
                    </span>
                    <span className="text-ink/70">{rating.toFixed(1)}</span>
                    <span className="text-ink/50">({reviewCount} отзывов)</span>
                  </>
                ) : (
                  <span className="text-ink/50">Нет отзывов</span>
                )}
              </div>

              <div className="text-accent text-xl sm:text-2xl font-semibold mb-2">
                {subscriptionPrice.toLocaleString('ru-RU')} ₽
                {oldPrice && (
                  <span className="text-base sm:text-lg line-through text-muted ml-3">
                    {oldPrice.toLocaleString('ru-RU')} ₽
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mb-4">
                {subscribeAndSave ? 'Цена с подпиской и автодоставкой каждые 6 месяцев.' : 'Разовая покупка без подписки.'}
              </p>

              {product.variants && product.variants.length > 1 && (
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Выберите вариант</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.variants.map((variant) => {
                      const isActive = selectedVariant?.id === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          className={`rounded-2xl border px-3 py-1.5 text-sm transition ${
                            isActive
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-ink/10 bg-white/85'
                          }`}
                          onClick={() => setSelectedVariant(variant)}
                        >
                          {variant.name || variant.sku || variant.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="flex items-start gap-3 text-sm mb-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={subscribeAndSave}
                  onChange={(e) => setSubscribeAndSave(e.target.checked)}
                />
                <span>
                  <span className="font-semibold">Подписка и экономия 10%</span>
                  <span className="block text-xs text-muted">Автодоставка раз в 6 месяцев, отмена в любой момент.</span>
                </span>
              </label>

              <div className="flex items-center gap-3 mb-4 text-sm">
                <span className={availableStock > 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {availableStock > 0 ? `В наличии: ${availableStock} шт.` : 'Нет в наличии'}
                </span>
                {isLowStock && <span className="text-xs text-amber-700">Осталось всего {availableStock}</span>}
              </div>

              <button
                className="button w-full mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddToCart}
                disabled={availableStock <= 0}
              >
                Добавить в корзину
              </button>
              <button className="button-gray w-full" type="button">
                Добавить в вишлист
              </button>
            </div>

            <div className="mt-4 soft-card p-5 text-sm space-y-3">
              <div className="flex items-center gap-2">
                <span>🚚</span>
                <span>Бесплатная доставка от 5000 ₽</span>
              </div>
              <div className="flex items-center gap-2">
                <span>↺</span>
                <span>14 дней на возврат без вопросов</span>
              </div>
              <div className="flex items-center gap-2">
                <span>♻️</span>
                <span>Экологичные материалы и упаковка</span>
              </div>
            </div>

            {bundleItems.length > 0 && (
              <div className="mt-4 soft-card p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Соберите комплект</p>
                <p className="text-sm text-muted mt-2">
                  Чаще всего берут вместе — отметьте нужные позиции и добавьте всё сразу.
                </p>
                <div className="mt-3 space-y-3">
                  {bundleItems.map((item) => (
                    <label key={item.id} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-primary"
                        checked={Boolean(bundleSelections[item.id])}
                        onChange={(e) =>
                          setBundleSelections((prev) => ({
                            ...prev,
                            [item.id]: e.target.checked,
                          }))
                        }
                      />
                      <span>
                        <span className="block font-medium">{item.name}</span>
                        <span className="text-xs text-muted">{getProductPrice(item).toLocaleString('ru-RU')} ₽</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm mt-4">
                  <span className="text-muted">Итого</span>
                  <span className="font-semibold">{bundleTotal.toLocaleString('ru-RU')} ₽</span>
                </div>
                <button type="button" className="button w-full mt-3" onClick={handleAddBundle}>
                  Добавить комплект
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <div className="border-b border-ink/10 flex flex-wrap gap-6 text-sm">
            <button
              onClick={() => setActiveTab('about')}
              className={`py-2 ${activeTab === 'about' ? 'border-b-2 border-primary font-semibold' : 'text-muted'}`}
            >
              О товаре
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-2 ${activeTab === 'reviews' ? 'border-b-2 border-primary font-semibold' : 'text-muted'}`}
            >
              Отзывы ({reviewCount})
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 ${activeTab === 'details' ? 'border-b-2 border-primary font-semibold' : 'text-muted'}`}
            >
              Характеристики
            </button>
          </div>

          {activeTab === 'about' && (
            <div className="mt-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">
                {product.description || 'Описание отсутствует.'}
              </p>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="mt-4 space-y-3">
              {productReviews.length > 0 ? (
                productReviews.map((rev, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
                    <div className="text-primary text-sm">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    <p className="mt-2 text-sm">{rev.text}</p>
                    <p className="text-xs text-muted italic">— {rev.author}</p>
                  </div>
                ))
              ) : (
                <p>На этот товар пока нет отзывов.</p>
              )}
            </div>
          )}
          {activeTab === 'details' && (
            <div className="mt-4">
              {specificationSections.length > 0 ? (
                <div className="space-y-8">
                  {specificationSections.map((section, idx) => (
                    <div key={`${section.title || 'section'}-${idx}`}>
                      {section.title && (
                        <h3 className="text-sm font-semibold text-ink mb-3">
                          {section.title}
                        </h3>
                      )}
                      {section.items.length > 0 && (
                        <dl className="space-y-2">
                          {section.items.map((item, itemIdx) => (
                            <div
                              key={`${item.label || 'item'}-${itemIdx}`}
                              className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-1 sm:gap-6 text-sm"
                            >
                              <dt className="text-muted">{item.label || '—'}</dt>
                              <dd className="text-ink whitespace-pre-line break-words">
                                {item.value || '—'}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {section.description && (
                        <p className="mt-3 text-sm leading-relaxed text-ink/80 whitespace-pre-line">
                          {section.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {specList.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-10 sm:mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Дополните набор</h2>
              <Link to="/category/popular" className="text-sm text-primary">Смотреть больше</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-ink/10 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden z-30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted">Итого</p>
            <p className="text-base font-semibold">{subscriptionPrice.toLocaleString('ru-RU')} ₽</p>
          </div>
          <button
            className="button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={availableStock <= 0}
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;

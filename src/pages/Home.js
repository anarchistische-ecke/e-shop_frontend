import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../api';
import { reviews } from '../data/reviews';

/**
 * The Home page mirrors the original Cozy Home landing page but now
 * retrieves products and categories from the Spring Boot backend.  On
 * mount it fetches the full product catalogue and top‑level categories
 * via the API helper.  Static content such as features and
 * collections remains embedded for clarity.
 */
function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Load product list
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch products:', err));
    // Load category list
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  // Feature boxes shown below the hero section
  const features = [
    {
      icon: '',
      title: 'Авторизуйтесь',
      subtitle: 'копите и списывайте бонусы',
    },
    {
      icon: '',
      title: 'Удобно платить',
      subtitle: 'картой, наличными, СБП или частями',
    },
    {
      icon: '',
      title: 'Бесплатная доставка',
      subtitle: 'при заказе от 5000 ₽',
    },
    {
      icon: '',
      title: 'Пункты выдачи',
      subtitle: 'более 35 000 пунктов',
    },
  ];

  // Sample collections for display.  These are purely decorative.
  const collections = [
    {
      title: 'Cinque Terre',
      description:
        'Коллекция постельного белья из сатина: 100% хлопок, пастельные оттенки и лаконичные принты вдохновлены атмосферой итальянских побережий.',
    },
    {
      title: 'Alienor',
      description:
        'Воплощение европейского духа XII века: роскошные узоры и сложные переплетения на ткани создают изысканный образ.',
    },
    {
      title: 'Taj Mahal',
      description:
        'Сочетание утончённой эстетики, природной красоты и восточного колорита — для ценителей ярких акцентов.',
    },
  ];

  return (
    <div className="home">
      {/* Hero section */}
      <section className="bg-secondary border-b border-gray-200">
        <div className="container mx-auto px-4 py-8 md:py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Large hero placeholder with call to action */}
          <div className="relative h-64 md:h-80 bg-[#e9e7e3] flex items-center justify-center rounded">
            <div className="text-center px-4">
              <h1 className="text-3xl md:text-4xl font-semibold mb-4">Уютные новинки осени</h1>
              <p className="text-lg text-muted mb-6">
                Создайте тёплую атмосферу в доме c нашей осенней коллекцией текстиля и декора.
              </p>
              <Link to="/category/new" className="button inline-block">
                Смотреть новинки
              </Link>
            </div>
          </div>
          {/* Featured product card placeholder */}
          <div className="h-64 md:h-80 bg-white border border-gray-200 rounded p-4 flex flex-col justify-between">
            <div className="bg-[#e9e7e3] h-36 md:h-40 rounded mb-4"></div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-base">Постельное бельё Nega nocturna</h3>
              <p className="text-primary font-semibold mb-1">3 999 ₽</p>
              <p className="text-sm text-muted line-through mb-2">7 999 ₽</p>
              <Link to="/product/p1" className="button w-full py-2 text-center">
                В корзину
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {features.map((feat) => (
            <div key={feat.title} className="flex items-start gap-3">
              <span className="text-3xl">{feat.icon}</span>
              <div>
                <h4 className="font-semibold">{feat.title}</h4>
                <p className="text-sm text-muted">{feat.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular products – horizontal scroll */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Популярные товары</h2>
            <Link to="/category/popular" className="text-primary text-sm">
              Смотреть все
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {products.slice(0, 8).map((prod) => (
              <div key={prod.id} className="flex-shrink-0 w-64 snap-start">
                <ProductCard product={prod} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular categories */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold mb-4">Популярные категории</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.slice(2, 8).map((cat) => (
              <Link
                key={cat.slug || cat.id}
                to={`/category/${cat.slug || cat.id}`}
                className="relative block h-40 sm:h-48 md:h-56 bg-[#e9e7e3] rounded overflow-hidden flex items-center justify-center"
              >
                <span className="text-white font-semibold text-lg z-10">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New items – horizontal scroll */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Новинки</h2>
            <Link to="/category/new" className="text-primary text-sm">
              Смотреть все
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {products.slice(4, 12).map((prod) => (
              <div key={prod.id} className="flex-shrink-0 w-64 snap-start">
                <ProductCard product={prod} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections – horizontal scroll */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Коллекции</h2>
            <Link to="/category/collections" className="text-primary text-sm">
              Смотреть все
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {collections.map((coll) => (
              <div
                key={coll.title}
                className="flex-shrink-0 w-72 sm:w-80 bg-white border border-gray-200 rounded overflow-hidden snap-start"
              >
                <div className="h-40 bg-[#e9e7e3]"></div>
                <div className="p-4 flex flex-col h-40">
                  <h4 className="mb-2 font-semibold">{coll.title}</h4>
                  <p className="text-sm text-muted flex-1">{coll.description}</p>
                  <Link to={`/category/collections`} className="mt-2 text-primary text-sm">
                    Смотреть коллекцию
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special for you – horizontal scroll */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold mb-4">Специально для вас</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {products.slice(2, 10).map((prod) => (
              <div key={prod.id} className="flex-shrink-0 w-64 snap-start">
                <ProductCard product={prod} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews – horizontal scroll */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold mb-4">Отзывы</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {reviews.map((rev, idx) => {
              // Find the corresponding product in the current list; fallback to null
              const product = products.find((p) => p.id === rev.productId);
              return (
                <div
                  key={idx}
                  className="flex-shrink-0 w-64 sm:w-72 bg-white border border-gray-200 rounded overflow-hidden snap-start"
                >
                  <div className="p-4 h-full flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-semibold mb-2">{product ? product.name : 'Товар'}</h4>
                      <div className="text-primary text-sm mb-2">
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </div>
                      <p className="text-sm mb-4">{rev.text}</p>
                    </div>
                    <p className="text-xs text-muted italic m-0">— {rev.author}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About snippet */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-xl font-semibold">Постельное Белье‑Юг – интернет‑магазин домашнего текстиля и декора</h2>
          <p className="text-base text-muted mt-4">
            Мы предлагаем постельное бельё и одежду для отдыха собственного производства, а также коллекции декоративных товаров для дома. Наша цель — сделать ваш дом уютным и красивым.
          </p>
          <Link to="/about" className="button mt-4 inline-block">
            Подробнее о нас
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
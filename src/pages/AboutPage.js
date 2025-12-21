import React from 'react';
import { Link } from 'react-router-dom';

function AboutPage() {
  if (typeof window !== 'undefined') {
    const savedPages = localStorage.getItem('adminPages');
    if (savedPages) {
      try {
        const pages = JSON.parse(savedPages);
        const about = pages.find((p) => p.slug === 'about');
        if (about && about.published === false) {
          return (
            <div className="py-12 text-center">
              <h1 className="text-2xl font-semibold mb-2">Страница недоступна</h1>
              <p className="text-muted">Эта страница скрыта администратором.</p>
            </div>
          );
        }
      } catch (e) {
      }
    }
  }

  return (
    <div className="about-page bg-white">
      {/* Hero section */}
      <section className="bg-secondary py-12 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-semibold">О компании</h1>
        </div>
      </section>

      {/* Description section */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <p className="text-base text-muted leading-relaxed">
            Постельное Белье‑Юг — сеть магазинов уютных товаров для дома, представленная на рынке с 2015 года. В
            настоящий момент бренд имеет розничные магазины во всех регионах России, а также собственный
            интернет‑магазин. Наша миссия — сделать каждое мгновение, проведённое дома, счастливым и уютным. С нами
            можно оформить интерьер с удовольствием, вдохновляясь нашими идеями и творческим подходом.
          </p>
        </div>
      </section>

      {/* Metrics section */}
      <section className="bg-secondary py-8">
        <div className="container mx-auto px-4 flex flex-wrap justify-around text-center gap-8">
          {[
            { number: '>100', label: 'магазинов' },
            { number: '38', label: 'городов присутствия' },
            { number: '2 млн', label: 'лояльных покупателей' },
            { number: '9 лет', label: 'на рынке' },
          ].map((item, idx) => (
            <div key={idx} className="min-w-[120px]">
              <div className="text-3xl font-bold text-accent">{item.number}</div>
              <div className="text-sm text-muted">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Production section */}
      <InfoBlock
        title="Собственное производство и регулярное обновление ассортимента"
        text="Бренд является частью крупного российского текстильного холдинга с современным
             высокотехнологичным производством. Новые коллекции разрабатываются и поступают в продажу
             ежесезонно — 4 раза в год."
        imageOnLeft={true}
      />

      {/* Exclusive design section */}
      <InfoBlock
        title="Эксклюзивные авторские разработки и готовые интерьерные решения"
        text="Ассортимент в магазинах и на сайте представлен по капсульному принципу — товары из разных
             категорий объединены по стилю, дизайну и палитре. Дизайны постельного белья уникальны,
             так как специально создаются художниками бренда."
        imageOnLeft={false}
      />

      {/* Loyalty program section */}
      <InfoBlock
        title="Программа лояльности с преференциями для покупателей"
        text="Участники могут первыми узнавать об акциях, получать дополнительные скидки и
             бонусы на следующие покупки."
        imageOnLeft={true}
        cta={{ label: 'Стать участником', to: '/loyalty' }}
      />

      {/* Free delivery section */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-xl font-semibold">Бесплатная доставка</h2>
          <p className="text-base text-muted mb-4">
            Мы осуществляем бесплатную доставку по всей России при заказе от 5 000 ₽.
          </p>
        </div>
      </section>

      {/* Online store and mobile app info */}
      <section className="bg-secondary py-8">
        <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-xl font-semibold text-center">Интернет‑магазин и мобильное приложение Постельное Белье‑Юг</h2>
          <ol className="list-decimal list-inside space-y-2 mt-4 text-base">
            <li>Оформите заказ не выходя из дома через сайт или мобильное приложение.</li>
            <li>Платите удобным для вас способом — онлайн или при получении.</li>
            <li>
              Воспользуйтесь системой быстрых платежей (СБП) или оплатите заказ частями без
              процентов и переплат.
            </li>
            <li>
              Выберите удобный способ получения: пункты выдачи, курьерская доставка, доставка
              из магазина день в день или самовывоз.
            </li>
          </ol>
        </div>
      </section>

    </div>
  );
}

function InfoBlock({ title, text, imageOnLeft = true, cta }) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4 flex flex-wrap items-center gap-8">
        {imageOnLeft && (
          <div className="flex-1 min-w-[260px] h-48 bg-[#e9e7e3] rounded"></div>
        )}
        <div className="flex-1 min-w-[260px]">
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-base text-muted">{text}</p>
          {cta && (
            <Link to={cta.to} className="button inline-block mt-2">
              {cta.label}
            </Link>
          )}
        </div>
        {!imageOnLeft && (
          <div className="flex-1 min-w-[260px] h-48 bg-[#e9e7e3] rounded"></div>
        )}
      </div>
    </section>
  );
}

export default AboutPage;

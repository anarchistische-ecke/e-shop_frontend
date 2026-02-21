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
    <div className="about-page">
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="soft-card p-8 md:p-10 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">О компании</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mt-2">
              Дом начинается с мягких тканей и спокойного сна
            </h1>
            <p className="text-base text-muted mt-4 max-w-2xl mx-auto">
              Постельное Белье‑ЮГ — сеть магазинов уютных товаров для дома, представленная на рынке с 2015 года.
              Наша миссия — сделать каждое мгновение, проведённое дома, счастливым и уютным.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-muted">
              <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1">Собственное производство</span>
              <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1">Натуральные материалы</span>
              <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1">Сервис без спешки</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 flex flex-wrap justify-around text-center gap-8">
          {[
            { number: '>100', label: 'магазинов' },
            { number: '38', label: 'городов присутствия' },
            { number: '2 млн', label: 'лояльных покупателей' },
            { number: '9 лет', label: 'на рынке' },
          ].map((item, idx) => (
            <div key={idx} className="min-w-[120px]">
              <div className="text-2xl sm:text-3xl font-semibold text-primary">{item.number}</div>
              <div className="text-sm text-muted">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <InfoBlock
        title="Собственное производство и регулярное обновление ассортимента"
        text="Бренд является частью крупного российского текстильного холдинга с современным
             высокотехнологичным производством. Новые коллекции разрабатываются и поступают в продажу
             ежесезонно — 4 раза в год."
        imageOnLeft={true}
      />

      <InfoBlock
        title="Эксклюзивные авторские разработки и готовые интерьерные решения"
        text="Ассортимент в магазинах и на сайте представлен по капсульному принципу — товары из разных
             категорий объединены по стилю, дизайну и палитре. Дизайны постельного белья уникальны,
             так как специально создаются художниками бренда."
        imageOnLeft={false}
      />

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-xl font-semibold">Бесплатная доставка</h2>
          <p className="text-base text-muted mb-4">
            Мы осуществляем бесплатную доставку по всей России при заказе от 5 000 ₽.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="soft-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-center">
              Интернет‑магазин и мобильное приложение Постельное Белье‑ЮГ
            </h2>
            <ol className="list-decimal list-inside space-y-2 mt-4 text-base text-muted">
              <li>Оформите заказ не выходя из дома через сайт.</li>
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
            <div className="mt-6 flex justify-center">
              <Link to="/category/popular" className="button">Перейти к покупкам</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoBlock({ title, text, imageOnLeft = true, cta }) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center">
          {imageOnLeft && (
            <div className="h-56 rounded-3xl bg-gradient-to-br from-[#f3ebe3] to-[#e6d9cd]" />
          )}
          <div className="soft-card p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <p className="text-base text-muted">{text}</p>
            {cta && (
              <Link to={cta.to} className="button inline-block mt-4">
                {cta.label}
              </Link>
            )}
          </div>
          {!imageOnLeft && (
            <div className="h-56 rounded-3xl bg-gradient-to-br from-[#f1ece6] to-[#e2d4c7]" />
          )}
        </div>
      </div>
    </section>
  );
}

export default AboutPage;

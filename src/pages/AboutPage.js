import React from 'react';
import { Link } from 'react-router-dom';
import CmsManagedPage from '../components/cms/CmsManagedPage';
import { Button, Card } from '../components/ui';

function AboutFallbackPage() {
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
          <Card className="text-center" padding="lg">
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
          </Card>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 flex flex-wrap justify-around text-center gap-8">
          {[
            { number: '>100', label: 'магазинов' },
            { number: '38', label: 'городов присутствия' },
            { number: '2 млн', label: 'покупателей' },
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
          <h2 className="text-xl font-semibold">Доставка по согласованию</h2>
          <p className="text-base text-muted mb-4">
            После оплаты заказа менеджер согласует с вами удобный вариант доставки и финальную стоимость.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card padding="lg">
            <h2 className="text-xl font-semibold text-center">
              Интернет‑магазин и мобильное приложение Постельное Белье‑ЮГ
            </h2>
            <ol className="list-decimal list-inside space-y-2 mt-4 text-base text-muted">
              <li>Оформите заказ не выходя из дома через сайт.</li>
              <li>Оплачивайте товары онлайн через защищённую форму YooKassa.</li>
              <li>
                Воспользуйтесь банковской картой или системой быстрых платежей (СБП).
              </li>
              <li>
                Оставьте имя, телефон, e-mail и адрес: менеджер предложит доступные варианты доставки
                после оформления заказа.
              </li>
            </ol>
            <div className="mt-6 flex justify-center">
              <Button as={Link} to="/category/popular">Перейти к покупкам</Button>
            </div>
          </Card>
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
          <Card padding="lg">
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <p className="text-base text-muted">{text}</p>
            {cta && (
              <Button as={Link} to={cta.to} className="mt-4">
                {cta.label}
              </Button>
            )}
          </Card>
          {!imageOnLeft && (
            <div className="h-56 rounded-3xl bg-gradient-to-br from-[#f1ece6] to-[#e2d4c7]" />
          )}
        </div>
      </div>
    </section>
  );
}

function AboutPage() {
  return <CmsManagedPage slug="about" fallback={<AboutFallbackPage />} />;
}

export default AboutPage;

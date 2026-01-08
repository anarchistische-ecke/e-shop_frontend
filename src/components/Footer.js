import React from 'react';
import { Link } from 'react-router-dom';

/**
 * The Footer component contains grouped lists of informational links,
 * contact details and a simple newsletter subscription form.  In the
 * original site the footer also displays social network and payment
 * logos; here we replicate their presence using placeholder text.  At
 * the very bottom we render the copyright notice.  For any link that
 * doesn’t yet exist in this replica we still provide a clickable
 * placeholder that navigates nowhere.
 */
function Footer() {
  const currentYear = new Date().getFullYear();
  const groups = [
    {
      title: 'Каталог',
      links: [
        { label: 'Бестселлеры', path: '/category/popular' },
        { label: 'Новинки', path: '/category/new' },
        { label: 'Коллекции', path: '/category/collections' },
        { label: 'Подарки до 5000 ₽', path: '/category/popular' },
      ],
    },
    {
      title: 'Сервис',
      links: [
        { label: 'Доставка и самовывоз', path: '/info/delivery' },
        { label: 'Способы оплаты', path: '/info/payment' },
        { label: 'Бонусы и лояльность', path: '/info/bonuses' },
        { label: 'Производство', path: '/info/production' },
        { label: 'О компании', path: '/about' },
      ],
    },
    {
      title: 'Аккаунт',
      links: [
        { label: 'Войти', path: '/login' },
        { label: 'Личный кабинет', path: '/account' },
        { label: 'Корзина', path: '/cart' },
      ],
    },
  ];
  const pressLogos = ['Vogue', 'AD', 'ELLE Decor', 'Forbes', 'Dom & Interior'];

  return (
    <footer className="bg-white/80 border-t border-ink/10">
      <div className="container mx-auto px-4 py-12 grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-4">
          <Link to="/" className="font-display text-2xl font-semibold text-ink">
            Постельное Белье-Юг
          </Link>
          <p className="text-sm text-muted max-w-sm">
            Спокойный дом начинается с мягких тканей. Мы подбираем натуральные материалы, чтобы
            отдых был таким же уютным, как объятия любимого пледа.
          </p>
          <div className="space-y-2 text-sm text-ink">
            <p className="m-0">Телефон: +7 (999) 123‑45‑67</p>
            <p className="m-0">Почта: hello@cozyhome.ru</p>
            <p className="m-0">Ежедневно, 9:00–21:00</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            <span className="rounded-full bg-white/80 border border-ink/10 px-3 py-1">
              365‑дневная гарантия счастья
            </span>
            <span className="rounded-full bg-white/80 border border-ink/10 px-3 py-1">
              Бесплатная доставка от 5000 ₽
            </span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {groups.map((grp) => (
            <div key={grp.title} className="space-y-3">
              <h4 className="font-semibold mt-0">{grp.title}</h4>
              <ul className="space-y-2 text-sm text-muted">
                {grp.links.map((link) => (
                  <li key={link.label}>
                    {link.path.startsWith('/') ? (
                      <Link to={link.path} className="hover:text-primary">
                        {link.label}
                      </Link>
                    ) : (
                      <a href="#" className="hover:text-primary">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mt-0 mb-2">Скидка 10% на первый заказ</h4>
            <p className="text-sm text-muted mb-4">
              Подписка на письма о новинках, мягких подборках и сезонных подарках.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Ваш e‑mail"
                required
                className="flex-1"
              />
              <button type="submit" className="button whitespace-nowrap">
                Подписаться
              </button>
            </form>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted mb-2">As Seen In</p>
            <div className="flex flex-wrap gap-2">
              {pressLogos.map((logo) => (
                <span
                  key={logo}
                  className="rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-xs text-ink"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-ink/10 py-4">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p className="m-0">© Постельное Белье‑Юг, 2015–{currentYear}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1">Mir</span>
            <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1">Visa</span>
            <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1">Mastercard</span>
            <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1">Apple Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

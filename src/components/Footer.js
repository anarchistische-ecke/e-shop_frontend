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
        { label: 'Пользовательское соглашение и оферта', path: '/info/legal' },
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
  return (
    <footer className="bg-white/80 border-t border-ink/10">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4 lg:max-w-sm">
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
          </div>
          <div className="pt-2 space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Юридическая информация</p>
            <div className="text-xs text-ink space-y-1">
              <p className="m-0">ИП Касьянова И.Л.</p>
              <p className="m-0">ИНН 081407505907</p>
              <p className="m-0">ОГРНИП 325080000035116</p>
            </div>
          </div>
        </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

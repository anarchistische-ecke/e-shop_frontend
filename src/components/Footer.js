import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();
  const groups = [
    {
      title: 'Каталог',
      links: [
        { label: 'Все категории', path: '/catalog' },
        { label: 'Бестселлеры', path: '/category/popular' },
        { label: 'Новинки', path: '/category/new' },
      ],
    },
    {
      title: 'Сервис',
      links: [
        { label: 'Доставка и самовывоз', path: '/info/delivery' },
        { label: 'Доставка и возврат', path: '/usloviya-prodazhi#return' },
        { label: 'Способы оплаты', path: '/info/payment' },
        { label: 'Бонусы и лояльность', path: '/info/bonuses' },
        { label: 'Производство', path: '/info/production' },
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
    {
      title: 'Документы',
      links: [
        { label: 'Реквизиты и документы', path: '/info/legal' },
        { label: 'Политика обработки персональных данных', path: '/konfidentsialnost-i-zashchita-informatsii' },
        { label: 'Условия продажи', path: '/usloviya-prodazhi' },
      ],
    },
  ];
  return (
    <footer className="bg-accent text-white border-t border-white/10">
      <div className="page-shell page-section--tight py-7 lg:py-8 xl:py-9">
        <div
          data-testid="site-footer-content"
          className="mx-auto w-full max-w-[72rem]"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:gap-8 lg:items-start">
            <div className="space-y-4">
              <Link to="/" className="touch-link font-display text-[1.95rem] font-semibold tracking-tight text-white">
                Постельное Белье-ЮГ
              </Link>
              <p className="max-w-sm text-sm leading-6 text-white/72">
                Спокойный дом начинается с мягких тканей. Мы подбираем натуральные материалы, чтобы
                отдых был таким же уютным, как объятия любимого пледа.
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                <p className="m-0 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5">
                  Телефон: +7 961 466‑88‑33
                </p>
                <p className="m-0 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5">
                  Почта: postel-yug@yandex.ru
                </p>
              </div>
              <div className="grid gap-2 text-xs text-white/68">
                <p className="m-0 uppercase tracking-[0.22em] text-white/56">Реквизиты</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1">
                    ИП Касьянова И.Л.
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1">
                    ИНН 081407505907
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1">
                    ОГРНИП 325080000035116
                  </span>
                </div>
              </div>
            </div>

            <div
              data-testid="site-footer-link-grid"
              className="grid grid-cols-2 gap-x-5 gap-y-5 sm:gap-x-6 lg:grid-cols-4"
            >
              {groups.map((grp) => (
                <div key={grp.title} className="space-y-3 min-w-0">
                  <h4 className="mt-0 font-semibold text-white">{grp.title}</h4>
                  <ul className="space-y-1.5 text-sm text-white/74">
                    {grp.links.map((link) => (
                      <li key={link.label}>
                        {link.path.startsWith('/') ? (
                          <Link to={link.path} className="touch-link block leading-5 hover:text-white">
                            {link.label}
                          </Link>
                        ) : (
                          <a href="#" className="touch-link block leading-5 hover:text-white">
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
      </div>

      <div className="border-t border-white/10 py-3">
        <div className="page-shell">
          <div className="mx-auto flex w-full max-w-[72rem] flex-wrap items-center justify-between gap-2 text-xs text-white/60">
            <p className="m-0">© Постельное Белье‑ЮГ, 2015–{currentYear}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Mir</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Visa</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Mastercard</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

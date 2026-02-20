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
        { label: 'Shipping & returns', path: '/usloviya-prodazhi#return' },
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
  ];
  return (
    <footer className="bg-accent text-white border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl py-8 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr] lg:items-start">
            <div className="space-y-3">
              <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-white">
                Постельное Белье-Юг
              </Link>
              <p className="text-sm text-white/70 max-w-sm">
                Спокойный дом начинается с мягких тканей. Мы подбираем натуральные материалы, чтобы
                отдых был таким же уютным, как объятия любимого пледа.
              </p>
              <div className="space-y-2 text-sm">
                <p className="m-0 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5">
                  Телефон: +7 961 466‑88‑33
                </p>
                <p className="m-0 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5">
                  Почта: postel-yug@yandex.ru
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">Юридическая информация</p>
              <div className="text-xs text-white/75 space-y-1">
                <p className="m-0">ИП Касьянова И.Л.</p>
                <p className="m-0">ИНН 081407505907</p>
                <p className="m-0">ОГРНИП 325080000035116</p>
              </div>
              <ul className="text-xs text-white/70 space-y-1">
                <li>
                  <Link to="/konfidentsialnost-i-zashchita-informatsii" className="hover:text-white">
                    Политика обработки персональных данных
                  </Link>
                </li>
                <li>
                  <Link to="/polzovatelskoe-soglashenie" className="hover:text-white">
                    Пользовательское соглашение
                  </Link>
                </li>
                <li>
                  <Link to="/soglasie-na-obrabotku-pd" className="hover:text-white">
                    Согласие на обработку персональных данных
                  </Link>
                </li>
                <li>
                  <Link to="/soglasie-na-poluchenie-reklamy" className="hover:text-white">
                    Согласие на получение рекламы
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="hover:text-white">
                    Политика файлов cookie
                  </Link>
                </li>
                <li>
                  <Link to="/usloviya-prodazhi" className="hover:text-white">
                    Условия продажи
                  </Link>
                </li>
              </ul>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((grp) => (
                <div key={grp.title} className="space-y-3">
                  <h4 className="font-semibold mt-0 text-white">{grp.title}</h4>
                  <ul className="space-y-2 text-sm text-white/75">
                    {grp.links.map((link) => (
                      <li key={link.label}>
                        {link.path.startsWith('/') ? (
                          <Link to={link.path} className="hover:text-white">
                            {link.label}
                          </Link>
                        ) : (
                          <a href="#" className="hover:text-white">
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

      <div className="border-t border-white/10 py-4">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
            <p className="m-0">© Постельное Белье‑Юг, 2015–{currentYear}</p>
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

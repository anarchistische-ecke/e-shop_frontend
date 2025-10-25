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
      title: 'Все о Постельное Белье‑Юг',
      links: [
        { label: 'О компании', path: '/about' },
        { label: 'Блог', path: '/blog' },
        { label: 'Акции и новости', path: '/news' },
      ],
    },
    {
      title: 'Покупателям',
      links: [
        { label: 'Доставка и самовывоз', path: '/shipping' },
        { label: 'Пункты выдачи заказов', path: '/pickup' },
        { label: 'Способы оплаты', path: '/payment' },
        { label: 'Возврат товара', path: '/returns' },
        { label: 'Таблица размеров', path: '/sizes' },
        { label: 'Подарочные сертификаты', path: '/giftcards' },
        { label: 'Программа лояльности', path: '/loyalty' },
      ],
    },
    {
      title: 'Свяжитесь с нами',
      links: [
        { label: 'Контакты', path: '/contact' },
        { label: 'Адреса магазинов', path: '/stores' },
        { label: 'Поставщикам', path: '/suppliers' },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4 flex flex-wrap gap-8">
        {/* Link groups */}
        {groups.map((grp) => (
          <div key={grp.title} className="flex-1 min-w-[150px]">
            <h4 className="font-semibold mt-0 mb-2">{grp.title}</h4>
            <ul className="space-y-2">
              {grp.links.map((link) => (
                <li key={link.label}>
                  {/* Use Link for internal navigation when possible */}
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
        {/* Newsletter subscription */}
        <div className="flex-1 min-w-[260px]">
          <h4 className="font-semibold mt-0 mb-2">Подпишитесь на новости Постельное Белье‑Юг</h4>
          <p className="mb-4">Будьте в курсе новинок и специальных предложений.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input
              type="email"
              placeholder="Ваш e‑mail"
              required
              className="flex-1 p-2 border border-gray-300 rounded"
            />
            <button type="submit" className="button whitespace-nowrap">
              Отправить
            </button>
          </form>
        </div>
      </div>
      {/* Bottom bar */}
      <div className="border-t border-gray-200 mt-8 pt-4">
        <div className="container mx-auto px-4 flex flex-wrap justify-center items-center">
          <p className="m-0 text-center">© Постельное Белье‑Юг, 2015–{currentYear}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
import React from 'react';
import { Link } from 'react-router-dom';
import { legalTokens } from '../data/legal/constants';

const documents = [
  {
    title: 'Политика обработки персональных данных',
    description: 'Как и зачем мы обрабатываем персональные данные покупателей.',
    path: '/konfidentsialnost-i-zashchita-informatsii',
  },
  {
    title: 'Пользовательское соглашение',
    description: 'Правила использования сайта и сервисов.',
    path: '/polzovatelskoe-soglashenie',
  },
  {
    title: 'Согласие на получение рекламы',
    description: 'Условия получения рекламных сообщений и отзыва согласия.',
    path: '/soglasie-na-poluchenie-reklamy',
  },
  {
    title: 'Условия продажи (публичная оферта)',
    description: 'Порядок покупки, доставки и возврата товаров.',
    path: '/usloviya-prodazhi',
  },
  {
    title: 'Политика в отношении файлов cookie',
    description: 'Какие cookie мы используем и как управлять настройками.',
    path: '/cookies',
  },
  {
    title: 'Согласие на обработку персональных данных',
    description: 'Подробные условия обработки персональных данных.',
    path: '/soglasie-na-obrabotku-pd',
  },
];

function LegalInfoPage() {
  return (
    <section className="legal-page">
      <div className="legal-layout">
        <header className="legal-hero">
          <p className="legal-kicker">Юридический раздел</p>
          <h1>Документы и регламенты</h1>
          <p>
            Здесь собраны документы, регулирующие использование сайта, продажи, обработку
            персональных данных и рекламные коммуникации.
          </p>
        </header>

        <div className="legal-surface">
          <div className="grid gap-3 md:grid-cols-2">
            {documents.map((doc) => (
              <Link key={doc.path} to={doc.path} className="legal-doc-link">
                <span className="block text-base font-semibold text-ink">{doc.title}</span>
                <span className="mt-1 block text-sm text-muted">{doc.description}</span>
              </Link>
            ))}
          </div>

          <section className="mt-6 rounded-2xl border border-ink/10 bg-white/70 p-5">
            <h2 className="text-lg font-semibold">Реквизиты продавца</h2>
            <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
              <p>{legalTokens.LEGAL_ENTITY_SHORT}</p>
              <p>ИНН {legalTokens.LEGAL_INN}</p>
              <p>ОГРНИП {legalTokens.LEGAL_OGRNIP}</p>
              <p>Телефон: {legalTokens.LEGAL_PHONE}</p>
              <p className="sm:col-span-2">Адрес: {legalTokens.LEGAL_ADDRESS}</p>
              <p className="sm:col-span-2">E-mail: {legalTokens.LEGAL_EMAIL}</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default LegalInfoPage;

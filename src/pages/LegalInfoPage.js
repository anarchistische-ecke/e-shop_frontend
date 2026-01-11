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
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">Документы</p>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4">Юридическая информация</h1>
      <p className="text-sm text-muted mb-6">
        Ниже собраны основные документы, регулирующие использование сайта, продажи и обработку данных.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {documents.map((doc) => (
          <Link
            key={doc.path}
            to={doc.path}
            className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold mb-1">{doc.title}</h2>
            <p className="text-sm text-muted">{doc.description}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-sm space-y-2 mt-8">
        <h2 className="text-lg font-semibold">Реквизиты продавца</h2>
        <p className="text-sm text-muted">{legalTokens.LEGAL_ENTITY_SHORT}</p>
        <p className="text-sm text-muted">ИНН {legalTokens.LEGAL_INN}</p>
        <p className="text-sm text-muted">ОГРНИП {legalTokens.LEGAL_OGRNIP}</p>
        <p className="text-sm text-muted">Адрес: {legalTokens.LEGAL_ADDRESS}</p>
        <p className="text-sm text-muted">Телефон: {legalTokens.LEGAL_PHONE}</p>
        <p className="text-sm text-muted">E-mail: {legalTokens.LEGAL_EMAIL}</p>
      </section>
    </div>
  );
}

export default LegalInfoPage;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { legalTokens } from '../../data/legal/constants';

const LEGAL_DOCUMENTS = [
  {
    fileName: 'privacy.html',
    path: '/konfidentsialnost-i-zashchita-informatsii',
    title: 'Политика обработки персональных данных',
    summary: 'Правила обработки и защиты персональных данных пользователей и покупателей.',
  },
  {
    fileName: 'user-agreement.html',
    path: '/polzovatelskoe-soglashenie',
    title: 'Пользовательское соглашение',
    summary: 'Условия использования сайта и ответственность сторон.',
  },
  {
    fileName: 'pd-consent.html',
    path: '/soglasie-na-obrabotku-pd',
    title: 'Согласие на обработку персональных данных',
    summary: 'Форма согласия на обработку данных в рамках работы сайта.',
  },
  {
    fileName: 'ads-consent.html',
    path: '/soglasie-na-poluchenie-reklamy',
    title: 'Согласие на получение рекламы',
    summary: 'Порядок подписки и отказа от рекламных сообщений.',
  },
  {
    fileName: 'cookies.html',
    path: '/cookies',
    title: 'Политика в отношении cookie',
    summary: 'Информация об использовании cookie и иных технологий аналитики.',
  },
  {
    fileName: 'sales-terms.html',
    path: '/usloviya-prodazhi',
    title: 'Условия продажи (публичная оферта)',
    summary: 'Правила оформления заказов, оплаты, доставки и возврата товара.',
  },
];

const LEGAL_DOCUMENT_BY_FILE = LEGAL_DOCUMENTS.reduce((acc, item) => {
  acc[item.fileName] = item;
  return acc;
}, {});

const resolvePublicUrl = () => {
  const rawPublicUrl = process.env.PUBLIC_URL || '';
  const normalizedPublicUrl = rawPublicUrl.replace(/\/$/, '');
  return normalizedPublicUrl === '/' ? '' : normalizedPublicUrl;
};

const buildRuntimeTokens = () => {
  const publicUrl = resolvePublicUrl();
  const origin =
    typeof window !== 'undefined' && window.location
      ? window.location.origin
      : '';
  const siteUrl = origin ? `${origin}${publicUrl}` : legalTokens.SITE_URL;
  let siteHost = legalTokens.SITE_HOST;
  try {
    siteHost = siteUrl ? new URL(siteUrl).host : siteHost;
  } catch (err) {
    siteHost = legalTokens.SITE_HOST;
  }

  return {
    ...legalTokens,
    PUBLIC_URL: publicUrl,
    SITE_URL: siteUrl,
    SITE_HOST: siteHost,
  };
};

const applyTokens = (html, tokens) =>
  Object.entries(tokens).reduce((acc, [key, value]) => {
    const token = `{{${key}}}`;
    return acc.split(token).join(value ?? '');
  }, html);

function LegalDocumentPage({ fileName, onContentReady, className }) {
  const location = useLocation();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);
  const tokens = useMemo(buildRuntimeTokens, []);
  const documentMeta =
    LEGAL_DOCUMENT_BY_FILE[fileName] || {
      title: 'Юридический документ',
      summary: 'Актуальная редакция документа доступна для ознакомления ниже.',
      path: '/info/legal',
    };

  useEffect(() => {
    let isMounted = true;
    const publicUrl = resolvePublicUrl();
    setContent('');
    setError('');
    setIsLoading(true);

    fetch(`${publicUrl}/legal/${fileName}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Не удалось загрузить документ.');
        }
        return response.text();
      })
      .then((html) => {
        if (!isMounted) return;
        setContent(applyTokens(html, tokens));
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Не удалось загрузить документ.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileName, tokens]);

  useEffect(() => {
    if (!content || !onContentReady || !containerRef.current) {
      return undefined;
    }
    const cleanup = onContentReady(containerRef.current);
    return () => {
      if (cleanup) cleanup();
    };
  }, [content, onContentReady]);

  const renderDocument = () => {
    if (isLoading) {
      return (
        <div className="legal-loading">
          <p className="text-sm text-muted">Загрузка документа...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="legal-error">
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    return <div ref={containerRef} className="legal-doc-body" dangerouslySetInnerHTML={{ __html: content }} />;
  };

  return (
    <section className={`legal-page ${className || ''}`}>
      <div className="legal-layout">
        <header className="legal-hero">
          <p className="legal-kicker">Юридическая информация</p>
          <h1>{documentMeta.title}</h1>
          <p>{documentMeta.summary}</p>
          <nav className="legal-doc-nav" aria-label="Разделы юридических документов">
            {LEGAL_DOCUMENTS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`legal-doc-link ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </header>

        <article className="legal-surface">{renderDocument()}</article>
      </div>
    </section>
  );
}

export default LegalDocumentPage;

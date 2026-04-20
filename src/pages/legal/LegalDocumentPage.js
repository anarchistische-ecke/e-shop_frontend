import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Seo from '../../components/Seo';
import { legalTokens } from '../../data/legal/constants';
import { getCustomerSafeErrorMessage } from '../../utils/customerErrors';
import { buildAbsoluteAppUrl } from '../../utils/url';
import { getRuntimeConfig } from '../../config/runtime';
import { useSsrData } from '../../ssr/SsrDataContext';
import {
  applyLegalTokens,
  buildLegalRuntimeTokens,
  LEGAL_DOCUMENT_BY_FILE,
  LEGAL_DOCUMENTS,
  resolvePublicUrl
} from './legalDocuments';

function LegalDocumentPage({ fileName, onContentReady, className }) {
  const location = useLocation();
  const { routeData } = useSsrData();
  const runtimeConfig = getRuntimeConfig();
  const publicUrl = resolvePublicUrl(runtimeConfig.basePath || runtimeConfig.publicUrl);
  const initialContent =
    routeData?.kind === 'legal-document' && routeData.fileName === fileName
      ? routeData.content || ''
      : '';
  const initialError =
    routeData?.kind === 'legal-document' && routeData.fileName === fileName
      ? routeData.error || ''
      : '';
  const hasInitialContent =
    routeData?.kind === 'legal-document' && routeData.fileName === fileName;
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState(initialError);
  const [isLoading, setIsLoading] = useState(!hasInitialContent);
  const containerRef = useRef(null);
  const tokens = useMemo(
    () =>
      buildLegalRuntimeTokens({
        publicUrl,
        siteUrl: buildAbsoluteAppUrl('/')?.replace(/\/$/, '') || legalTokens.SITE_URL
      }),
    [publicUrl]
  );
  const documentMeta =
    LEGAL_DOCUMENT_BY_FILE[fileName] || {
      title: 'Юридический документ',
      summary: 'Актуальная редакция документа доступна для ознакомления ниже.',
      path: '/info/legal',
    };

  useEffect(() => {
    if (hasInitialContent) {
      setContent(initialContent);
      setError(initialError);
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;
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
        setContent(applyLegalTokens(html, tokens));
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(
          getCustomerSafeErrorMessage(err, {
            context: 'documentLoad',
            fallbackMessage: 'Не удалось загрузить документ.'
          })
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileName, hasInitialContent, initialContent, initialError, publicUrl, tokens]);

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
      <Seo
        title={documentMeta.title}
        description={documentMeta.summary}
        canonicalPath={documentMeta.path}
      />
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

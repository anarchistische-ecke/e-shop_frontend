import React, { useEffect, useMemo, useRef, useState } from 'react';
import { legalTokens } from '../../data/legal/constants';

const buildRuntimeTokens = () => {
  const rawPublicUrl = process.env.PUBLIC_URL || '';
  const normalizedPublicUrl = rawPublicUrl.replace(/\/$/, '');
  const publicUrl = normalizedPublicUrl === '/' ? '' : normalizedPublicUrl;
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
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const tokens = useMemo(buildRuntimeTokens, []);

  useEffect(() => {
    let isMounted = true;
  const rawPublicUrl = process.env.PUBLIC_URL || '';
  const normalizedPublicUrl = rawPublicUrl.replace(/\/$/, '');
  const publicUrl = normalizedPublicUrl === '/' ? '' : normalizedPublicUrl;
    setError('');
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
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Не удалось загрузить документ.');
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-sm text-muted">{error}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-sm text-muted">Загрузка документа...</p>
      </div>
    );
  }

  return (
    <div className={`legal-page ${className || ''}`}>
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

export default LegalDocumentPage;

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import CmsPageRenderer from './CmsPageRenderer';
import { useCmsSiteSettings } from '../../contexts/CmsContentContext';

jest.mock('../../contexts/CmsContentContext', () => ({
  useCmsSiteSettings: jest.fn(),
}));

jest.mock('../Seo', () => function SeoMock(props) {
  return (
    <div
      data-testid="seo"
      data-title={props.title}
      data-description={props.description}
      data-canonical-path={props.canonicalPath}
      data-image={props.image}
    />
  );
});

function renderWithRouter(ui) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>
    );
  });

  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('CmsPageRenderer', () => {
  let originalActEnvironment;

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    useCmsSiteSettings.mockReturnValue({
      siteSettings: {
        defaultOgImage: { url: 'https://cdn.example.com/site-og.jpg' },
      },
    });
  });

  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    jest.clearAllMocks();
  });

  it('renders ordered blocks from page sections and falls back to the generic block for unknown types', () => {
    const page = {
      title: 'О бренде',
      path: '/about',
      summary: 'История бренда и наши принципы.',
      sections: [
        {
          anchorId: 'hero',
          internalName: 'Hero',
          sectionType: 'hero',
          sort: 10,
          title: 'Создаем спокойный дом',
          body: '<p>Натуральный текстиль для спальни и отдыха.</p>',
          image: { url: 'https://cdn.example.com/hero.jpg', alt: 'Hero image' },
        },
        {
          anchorId: 'story',
          internalName: 'Story',
          sectionType: 'rich_text',
          sort: 20,
          title: 'История бренда',
          body: '<p>Мы работаем с домашним текстилем более 10 лет.</p>',
        },
        {
          anchorId: 'faq',
          internalName: 'Faq',
          sectionType: 'faq_list',
          sort: 30,
          title: 'Вопросы покупателей',
          items: [
            { title: 'Где производится текстиль?', description: 'На собственном производстве.' },
          ],
        },
        {
          anchorId: 'cta',
          internalName: 'Cta',
          sectionType: 'cta_section',
          sort: 40,
          title: 'Свяжитесь с нами',
          primaryCtaLabel: 'Написать',
          primaryCtaUrl: '/contact',
        },
        {
          anchorId: 'fallback',
          internalName: 'Fallback',
          sectionType: 'mystery_block',
          sort: 50,
          title: 'Редакционный эксперимент',
          body: 'Этот блок пока не имеет отдельного компонента.',
          items: [
            { title: 'Заметка редактора', description: 'Фронтенд не падает и рендерит резервный блок.' },
          ],
        },
      ],
    };

    const view = renderWithRouter(<CmsPageRenderer page={page} />);

    const seoNode = view.container.querySelector('[data-testid="seo"]');
    const heroSection = view.container.querySelector('section#hero');
    const storySection = view.container.querySelector('section#story');
    const faqSection = view.container.querySelector('section#faq');
    const ctaSection = view.container.querySelector('section#cta');
    const fallbackSection = view.container.querySelector('section#fallback');

    expect(seoNode?.getAttribute('data-title')).toBe('О бренде');
    expect(seoNode?.getAttribute('data-canonical-path')).toBe('/about');
    expect(seoNode?.getAttribute('data-image')).toBe('https://cdn.example.com/site-og.jpg');
    expect(heroSection).not.toBeNull();
    expect(storySection).not.toBeNull();
    expect(faqSection).not.toBeNull();
    expect(ctaSection).not.toBeNull();
    expect(fallbackSection).not.toBeNull();
    expect(fallbackSection.textContent).toContain('Редакционный эксперимент');
    expect(fallbackSection.textContent).toContain('Заметка редактора');

    expect(heroSection.compareDocumentPosition(storySection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(storySection.compareDocumentPosition(faqSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(faqSection.compareDocumentPosition(ctaSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(ctaSection.compareDocumentPosition(fallbackSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    view.unmount();
  });

  it('uses page SEO image when available and shows a fallback card when no sections exist', () => {
    const page = {
      title: 'Доставка',
      path: '/info/delivery',
      summary: 'Информация о доставке по России.',
      seoTitle: 'Доставка Cozyhome',
      seoDescription: 'Условия доставки по России.',
      seoImage: { url: 'https://cdn.example.com/delivery-og.jpg' },
      sections: [],
    };

    const view = renderWithRouter(<CmsPageRenderer page={page} />);

    const seoNode = view.container.querySelector('[data-testid="seo"]');

    expect(seoNode?.getAttribute('data-title')).toBe('Доставка Cozyhome');
    expect(seoNode?.getAttribute('data-description')).toBe('Условия доставки по России.');
    expect(seoNode?.getAttribute('data-image')).toBe('https://cdn.example.com/delivery-og.jpg');
    expect(view.container.querySelector('h1')?.textContent).toBe('Доставка');
    expect(view.container.textContent).toContain('Информация о доставке по России.');
    expect(view.container.textContent).toContain('Контент');

    view.unmount();
  });
});

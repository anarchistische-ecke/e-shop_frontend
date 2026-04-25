import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import HeroBlock from './blocks/HeroBlock';
import RichTextBlock from './blocks/RichTextBlock';
import ImageBannerBlock from './blocks/ImageBannerBlock';
import FaqSectionBlock from './blocks/FaqSectionBlock';
import CtaSectionBlock from './blocks/CtaSectionBlock';

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

describe('CMS blocks', () => {
  let originalActEnvironment;

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
  });

  it('renders HeroBlock with media, actions, and highlight cards', () => {
    const page = {
      title: 'Главная',
      navLabel: 'Главная',
    };
    const section = {
      anchorId: 'hero',
      eyebrow: 'Новая коллекция',
      title: 'Весенняя спальня',
      accent: 'натуральные ткани',
      body: '<p>Мягкие комплекты и акцентные пледы для сезонного обновления дома.</p>',
      image: {
        url: 'https://cdn.example.com/hero.jpg',
        alt: 'Уютная спальня',
        width: 1280,
        height: 960,
      },
      primaryCtaLabel: 'В каталог',
      primaryCtaUrl: '/catalog',
      secondaryCtaLabel: 'История бренда',
      secondaryCtaUrl: 'https://example.com/story',
      items: [
        { label: 'Доставка', title: '3-5 дней', description: 'По Москве и области' },
        { label: 'Состав', title: '100% хлопок', description: 'Без синтетики' },
      ],
    };

    const view = renderWithRouter(<HeroBlock page={page} section={section} index={0} />);

    expect(view.container.querySelector('section#hero')).not.toBeNull();
    expect(view.container.querySelector('h1')?.textContent).toContain('Весенняя спальня');
    expect(view.container.querySelector('h1')?.textContent).toContain('натуральные ткани');
    expect(view.container.textContent).toContain('3-5 дней');
    expect(view.container.textContent).toContain('100% хлопок');
    expect(view.container.querySelector('a[href="/catalog"]')?.textContent).toBe('В каталог');
    expect(view.container.querySelector('a[href="https://example.com/story"]')?.getAttribute('target')).toBe('_blank');
    expect(view.container.querySelector('img[alt="Уютная спальня"]')).not.toBeNull();
    expect(view.container.querySelector('img')?.getAttribute('loading')).toBe('eager');

    view.unmount();
  });

  it('renders RichTextBlock with HTML content and CTA actions', () => {
    const section = {
      anchorId: 'rich',
      eyebrow: 'Оплата',
      title: 'Как проходит оплата',
      body: '<p><strong>Оплачивайте</strong> заказ картой или через СБП.</p>',
      primaryCtaLabel: 'Условия доставки',
      primaryCtaUrl: '/info/delivery',
    };

    const view = renderWithRouter(<RichTextBlock section={section} />);

    expect(view.container.querySelector('section#rich')).not.toBeNull();
    expect(view.container.querySelector('h2')?.textContent).toBe('Как проходит оплата');
    expect(view.container.querySelector('.cms-rich-text strong')?.textContent).toBe('Оплачивайте');
    expect(view.container.querySelector('a[href="/info/delivery"]')?.textContent).toBe('Условия доставки');

    view.unmount();
  });

  it('renders ImageBannerBlock with media, cards, and actions', () => {
    const section = {
      anchorId: 'banner',
      eyebrow: 'Весна',
      title: 'Соберите уютный интерьер',
      body: '<p>Сочетайте постельное белье, пледы и декоративные подушки в одной палитре.</p>',
      image: {
        url: 'https://cdn.example.com/banner.jpg',
        alt: 'Набор текстиля в бежевых оттенках',
        width: 1200,
        height: 960,
      },
      primaryCtaLabel: 'Посмотреть подборку',
      primaryCtaUrl: '/catalog',
      items: [
        {
          title: 'Пледы',
          label: 'Открыть раздел',
          description: 'Мягкие текстуры для спальни и гостиной',
          url: '/catalog/plaids',
        },
      ],
    };

    const view = renderWithRouter(<ImageBannerBlock section={section} />);

    expect(view.container.querySelector('section#banner')).not.toBeNull();
    expect(view.container.querySelector('img[alt="Набор текстиля в бежевых оттенках"]')).not.toBeNull();
    expect(view.container.textContent).toContain('Пледы');
    expect(view.container.textContent).toContain('Мягкие текстуры для спальни и гостиной');
    expect(view.container.querySelector('a[href="/catalog"]')?.textContent).toBe('Посмотреть подборку');
    expect(view.container.querySelector('a[href="/catalog/plaids"]')?.textContent).toBe('Открыть раздел');

    view.unmount();
  });

  it('renders FaqSectionBlock with FAQ details and HTML answers', () => {
    const section = {
      anchorId: 'faq',
      eyebrow: 'FAQ',
      title: 'Частые вопросы',
      body: '<p>Ответы на вопросы по доставке и уходу за текстилем.</p>',
      items: [
        {
          title: 'Как быстро доставляете?',
          description: '<p>Отправляем заказ в течение <strong>24 часов</strong> после подтверждения.</p>',
        },
        {
          title: 'Можно ли стирать в машинке?',
          description: 'Да, при температуре до 40°C.',
        },
      ],
    };

    const view = renderWithRouter(<FaqSectionBlock section={section} />);

    expect(view.container.querySelector('section#faq')).not.toBeNull();
    expect(view.container.querySelectorAll('details')).toHaveLength(2);
    expect(view.container.querySelector('summary')?.textContent).toContain('Как быстро доставляете?');
    expect(view.container.querySelector('.cms-faq-answer strong')?.textContent).toBe('24 часов');
    expect(view.container.textContent).toContain('Можно ли стирать в машинке?');
    expect(view.container.textContent).toContain('Да, при температуре до 40°C.');

    view.unmount();
  });

  it('renders CtaSectionBlock with chips and multiple calls to action', () => {
    const section = {
      anchorId: 'cta',
      eyebrow: 'Подписка',
      title: 'Получайте анонсы коллекций',
      body: '<p>Раз в неделю отправляем подборки новинок и полезные советы по уходу.</p>',
      primaryCtaLabel: 'Подписаться',
      primaryCtaUrl: '/subscribe',
      secondaryCtaLabel: 'Написать в WhatsApp',
      secondaryCtaUrl: 'https://wa.me/79990000000',
      items: [
        { title: 'Без спама' },
        { label: 'Новые коллекции' },
      ],
    };

    const view = renderWithRouter(<CtaSectionBlock section={section} />);

    expect(view.container.querySelector('section#cta')).not.toBeNull();
    expect(view.container.textContent).toContain('Без спама');
    expect(view.container.textContent).toContain('Новые коллекции');
    expect(view.container.querySelector('a[href="/subscribe"]')?.textContent).toBe('Подписаться');
    expect(view.container.querySelector('a[href="https://wa.me/79990000000"]')?.getAttribute('target')).toBe('_blank');

    view.unmount();
  });
});

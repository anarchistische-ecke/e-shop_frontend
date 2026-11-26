import { describe, expect, it } from 'vitest';
import { getBeddingSetContents } from './beddingSet';

const stripeMuslinSpecifications = [
  {
    title: 'Комплектация:',
    description: [
      '▸ Евро:',
      'одеяло 200×220 (1)',
      'наволочки 50×70 (2)',
      'наволочки 70×70 (2)',
      'простыня 245×250 (1)',
      '▸ Полуторное:',
      'одеяло 155×210 (1)',
      'наволочка 50×70 (1)',
      'наволочка 70×70 (1)',
      'простыня 160×220 (1)',
    ].join('\n'),
    items: [],
  },
];

describe('getBeddingSetContents', () => {
  it('uses the measurements and counts for the selected size', () => {
    expect(getBeddingSetContents(stripeMuslinSpecifications, { name: '1,5 ' }, 2)).toEqual([
      'Одеяло 155×210 · 1 шт.',
      'Наволочка 50×70 · 1 шт.',
      'Наволочка 70×70 · 1 шт.',
      'Простыня 160×220 · 1 шт.',
    ]);
    expect(getBeddingSetContents(stripeMuslinSpecifications, { sizeLabel: 'Евро', name: 'Евро макси' }, 2)).toEqual([
      'Одеяло 200×220 · 1 шт.',
      'Наволочки 50×70 · 2 шт.',
      'Наволочки 70×70 · 2 шт.',
      'Простыня 245×250 · 1 шт.',
    ]);
  });

  it('keeps explicitly stated units and sheet exclusions', () => {
    const specifications = [{
      title: 'Комплектация',
      description: 'Простыня не включена.',
      items: [
        { label: 'Пододеяльник', value: '200 × 220 см — 1 шт.' },
        { label: 'Наволочки', value: '2 шт.' },
      ],
    }];

    expect(getBeddingSetContents(specifications, { name: 'Евро' }, 1)).toEqual([
      'Без простыни',
      'Пододеяльник 200×220 см — 1 шт.',
      'Наволочки 2 шт.',
    ]);
  });

  it('does not apply unscoped contents to a product with multiple variants', () => {
    const specifications = [{
      title: 'Комплектация',
      description: 'Простыня 245×250 (1)',
      items: [],
    }];

    expect(getBeddingSetContents(specifications, { name: 'Евро' }, 2)).toEqual([]);
    expect(getBeddingSetContents(stripeMuslinSpecifications, { name: 'Евро-Макси' }, 2)).toEqual([]);
    expect(getBeddingSetContents(stripeMuslinSpecifications, null, 2)).toEqual([]);
  });

  it('omits ambiguous contents when the section has competing size headings', () => {
    const specifications = [{
      title: 'Комплектация',
      description: 'Евро:\nодеяло 200×220 (1)\nЕвро:\nодеяло 220×240 (1)',
      items: [],
    }];

    expect(getBeddingSetContents(specifications, { name: 'Евро' }, 2)).toEqual([]);
  });

  it('omits contents when variant identifiers match two different size groups', () => {
    const specifications = [{
      title: 'Комплектация',
      description: 'Евро:\nодеяло 200×220 (1)\nЕвро макси:\nодеяло 220×240 (1)',
      items: [],
    }];

    expect(getBeddingSetContents(specifications, {
      name: 'Евро макси',
      sizeCode: 'Евро макси',
      sizeLabel: 'Евро',
    }, 2)).toEqual([]);

    expect(getBeddingSetContents(specifications, {
      name: 'Комплект бежевый',
      sizeCode: 'bedding-xl',
      sizeLabel: 'Евро макси',
    }, 2)).toEqual(['Одеяло 220×240 · 1 шт.']);
  });

  it('omits a selected group when an unrecognized line makes its scope unclear', () => {
    const specifications = [{
      title: 'Комплектация',
      description: 'Евро:\nодеяло 200×220 (1)\nПолуторное\nодеяло 155×210 (1)',
      items: [],
    }];

    expect(getBeddingSetContents(specifications, { name: 'Евро' }, 2)).toEqual([]);
  });

  it('never infers the presence of a sheet or product measurements from unrelated fields', () => {
    const variant = { name: 'Евро', widthMm: 200, lengthMm: 220 };
    expect(getBeddingSetContents([{ title: 'Материалы', items: [], description: 'Простыня 245×250 (1)' }], variant, 1)).toEqual([]);
    expect(getBeddingSetContents([{ title: 'Комплектация', items: [], description: 'Наволочки 50×70 (2)' }], variant, 1)).toEqual([
      'Наволочки 50×70 · 2 шт.',
    ]);
  });
});

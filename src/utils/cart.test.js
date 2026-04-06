import { normalizeCartQuantity } from './cart';

describe('normalizeCartQuantity', () => {
  it.each([
    [0, 1],
    [-2, 1],
    ['', 1],
    ['abc', 1],
    [3, 3],
    ['3', 3],
    [3.8, 3],
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeCartQuantity(input)).toBe(expected);
  });
});

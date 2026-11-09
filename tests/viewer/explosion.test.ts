import { describe, it, expect } from 'vitest';
import { explosionOffset } from '../../src/viewer/explosion';

describe('explosionOffset', () => {
  it('acota t a [0, 1] y escala el desplazamiento completo', () => {
    expect(explosionOffset(2, 10)).toBe(10);
    expect(explosionOffset(-1, 10)).toBe(0);
    expect(explosionOffset(0.5, 10)).toBe(5);
    expect(explosionOffset(0, 10)).toBe(0);
    expect(explosionOffset(1, 10)).toBe(10);
  });
  it('trata NaN como 0', () => {
    expect(explosionOffset(NaN, 10)).toBe(0);
  });
});

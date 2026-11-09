import { describe, it, expect } from 'vitest';
import { explosionOffset, nextExplosion } from '../../src/viewer/explosion';

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

describe('nextExplosion', () => {
  it('conserva t al repetir exploded y reinicia/pone a 1 al cambiar de vista', () => {
    expect(nextExplosion('exploded', 'exploded', 0.4)).toBe(0.4);
    expect(nextExplosion('assembled', 'exploded', 0)).toBe(1);
    expect(nextExplosion('exploded', 'assembled', 0.4)).toBe(0);
    expect(nextExplosion('section', 'exploded', 0.4)).toBe(1);
    expect(nextExplosion('exploded', 'section', 0.4)).toBe(0.4);
  });
});

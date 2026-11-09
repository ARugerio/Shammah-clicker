// @vitest-environment happy-dom
import '../helpers/setupDom';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { applyStoredTheme, readTheme, writeTheme } from '../../src/ui/themeStore';

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
});

describe('themeStore', () => {
  it('con localStorage bloqueado no lanza y el tema queda claro', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    try {
      expect(() => writeTheme('dark')).not.toThrow();
      expect(applyStoredTheme()).toBe('light');
    } finally {
      get.mockRestore();
      set.mockRestore();
    }
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('usa claro si falta o es inválido y respeta "dark" guardado', () => {
    expect(readTheme()).toBe('light');
    localStorage.setItem('clicker-theme', 'raro');
    expect(readTheme()).toBe('light');
    writeTheme('dark');
    expect(applyStoredTheme()).toBe('dark');
  });
});

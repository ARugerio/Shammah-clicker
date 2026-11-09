// @vitest-environment happy-dom
import '../helpers/setupDom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mountHints } from '../../src/ui/hints/hints';
import { createUi } from '../../src/ui/ui';
import { createShell } from '../../src/ui/shell/shell';
import { makeCallbacks } from '../fixtures/callbacks';
import { makeUiState } from '../fixtures/uiState';

const KEY = 'shammah-hints-v1';
let dock: HTMLElement;
const card = () => document.querySelector<HTMLElement>('.hints-card');
const visible = () => !!card() && !card()!.hidden;
const esc = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  dock = document.body.appendChild(document.createElement('nav'));
});
afterEach(() => vi.restoreAllMocks());

describe('mountHints', () => {
  it('aparecen en la primera visita, con rol y etiqueta en español', () => {
    mountHints(dock);
    expect(visible()).toBe(true);
    expect(card()!.getAttribute('role')).toBe('dialog');
    expect(card()!.getAttribute('aria-label')).toBeTruthy();
    expect(card()!.textContent).toContain('Exportar');
  });

  it('dismiss() las oculta y no reaparecen en una visita nueva', () => {
    const h = mountHints(dock);
    h.dismiss();
    expect(visible()).toBe(false);
    expect(localStorage.getItem(KEY)).toBe('1');
    document.body.innerHTML = '';
    dock = document.body.appendChild(document.createElement('nav'));
    mountHints(dock);
    expect(visible()).toBe(false);
  });

  it('show() las reabre aunque estén descartadas', () => {
    const h = mountHints(dock);
    h.dismiss();
    h.show();
    expect(visible()).toBe(true);
  });

  it('el botón Cerrar y Escape las descartan', () => {
    mountHints(dock);
    card()!.querySelector<HTMLButtonElement>('button')!.click();
    expect(visible()).toBe(false);
    card()!.remove();
    const h = mountHints(dock);
    h.show();
    expect(visible()).toBe(true);
    esc();
    expect(visible()).toBe(false);
  });

  it('el listener de Escape se retira al descartar', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const h = mountHints(dock);
    const keydowns = add.mock.calls.filter((c) => c[0] === 'keydown');
    expect(keydowns.length).toBe(1);
    h.dismiss();
    expect(remove.mock.calls.some((c) => c[0] === 'keydown' && c[1] === keydowns[0][1])).toBe(true);
    // Escape con la tarjeta oculta no hace nada ni lanza
    expect(() => esc()).not.toThrow();
  });

  it('con localStorage bloqueado no lanza y se muestran sin persistir', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado'); });
    let h!: ReturnType<typeof mountHints>;
    expect(() => { h = mountHints(dock); }).not.toThrow();
    expect(visible()).toBe(true);
    expect(() => h.dismiss()).not.toThrow();
    expect(visible()).toBe(false);
  });
});

describe('createUi con shell', () => {
  it('no hay modales heredados y Ayuda abre las pistas', () => {
    document.body.innerHTML = '';
    const root = document.body.appendChild(document.createElement('div'));
    const shell = createShell(root);
    const { cb } = makeCallbacks();
    const ui = createUi(shell.statusEl, cb, shell);
    ui.update(makeUiState());
    expect(document.querySelector('.welcome-overlay')).toBeNull();
    expect(document.querySelector('.tutorial-backdrop, .tutorial-card-container')).toBeNull();
    expect(visible()).toBe(true);
    card()!.querySelector<HTMLButtonElement>('button')!.click();
    expect(visible()).toBe(false);
    document.getElementById('helpToggle')!.click();
    expect(visible()).toBe(true);
    shell.dispose();
  });
});

// @vitest-environment happy-dom
import '../helpers/setupDom';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mountTopbarActions } from '../../src/ui/shell/topbarActions';
import { makeCallbacks } from '../fixtures/callbacks';
import { makeUiState } from '../fixtures/uiState';
import { createUi } from '../../src/ui/ui';
import { createShell } from '../../src/ui/shell/shell';

let host: HTMLElement;
let calls: ReturnType<typeof makeCallbacks>['calls'];
let help: ReturnType<typeof vi.fn>;
let handle: ReturnType<typeof mountTopbarActions>;
const byLabel = (l: string) => host.querySelector<HTMLButtonElement>(`[aria-label="${l}"]`)!;

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.setAttribute('data-theme', 'light');
  host = document.body.appendChild(document.createElement('div'));
  const made = makeCallbacks();
  calls = made.calls;
  help = vi.fn();
  handle = mountTopbarActions(host, made.cb, { onHelp: help });
});
afterEach(() => vi.restoreAllMocks());

describe('mountTopbarActions', () => {
  it.each([
    ['Deshacer', 'undoBtn'], ['Rehacer', 'redoBtn'], ['Revertir', 'refreshBtn'],
    ['Guardar', 'saveProj'], ['Cargar', 'loadProj'], ['Ayuda', 'helpToggle'], ['Tema', 'themeToggle'],
  ])('botón %s con aria-label, title e ID %s', (label, id) => {
    const b = byLabel(label);
    expect(b).toBeTruthy();
    expect(b.id).toBe(id);
    expect(b.getAttribute('title')).toBeTruthy();
  });

  it('Deshacer, Rehacer, Revertir, Guardar y Ayuda llaman sus callbacks', () => {
    handle.update(makeUiState({ canUndo: true, canRedo: true, canRefresh: true }));
    byLabel('Deshacer').click();
    byLabel('Rehacer').click();
    byLabel('Revertir').click();
    byLabel('Guardar').click();
    byLabel('Ayuda').click();
    expect(calls.onUndo).toEqual([[]]);
    expect(calls.onRedo).toEqual([[]]);
    expect(calls.onRefresh).toEqual([[]]);
    expect(calls.onSaveProject).toEqual([[]]);
    expect(help).toHaveBeenCalledTimes(1);
  });

  it('el estado deshabilitado sigue a canUndo/canRedo/canRefresh', () => {
    handle.update(makeUiState({ canUndo: false, canRedo: true, canRefresh: false }));
    expect(byLabel('Deshacer').disabled).toBe(true);
    expect(byLabel('Rehacer').disabled).toBe(false);
    expect(byLabel('Revertir').disabled).toBe(true);
    handle.update(makeUiState({ canUndo: true, canRedo: false, canRefresh: true }));
    expect(byLabel('Deshacer').disabled).toBe(false);
    expect(byLabel('Rehacer').disabled).toBe(true);
    expect(byLabel('Revertir').disabled).toBe(false);
  });

  it('Cargar abre #projFile y un archivo elegido llama onLoadProject(file)', () => {
    const input = host.querySelector<HTMLInputElement>('#projFile')!;
    const click = vi.spyOn(input, 'click');
    byLabel('Cargar').click();
    expect(click).toHaveBeenCalled();
    const file = new File(['{}'], 'p.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    expect(calls.onLoadProject).toEqual([[file]]);
  });

  it('Tema pide el tema contrario (claro -> oscuro, oscuro -> claro)', () => {
    byLabel('Tema').click();
    document.documentElement.setAttribute('data-theme', 'dark');
    byLabel('Tema').click();
    expect(calls.onThemeChange).toEqual([['dark'], ['light']]);
  });

  it('el rótulo de #themeLabel sigue al tema', () => {
    const label = host.querySelector('#themeLabel')!;
    expect(label.textContent).toBe('Modo Oscuro');
    document.documentElement.setAttribute('data-theme', 'dark');
    handle.update(makeUiState());
    expect(label.textContent).toBe('Modo Claro');
  });

  it('con localStorage que lanza, pulsar Tema no lanza y el tema sigue claro', () => {
    document.documentElement.removeAttribute('data-theme');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado'); });
    expect(() => byLabel('Tema').click()).not.toThrow();
    expect(calls.onThemeChange).toEqual([['dark']]);
    expect(document.documentElement.getAttribute('data-theme')).not.toBe('dark');
  });
});

describe('createUi con la barra superior', () => {
  it('con shell: un solo #undoBtn y #themeToggle, en topbarActionsEl', () => {
    document.body.innerHTML = '';
    const root = document.body.appendChild(document.createElement('div'));
    const shell = createShell(root);
    const { cb } = makeCallbacks();
    createUi(shell.statusEl, cb, shell).update(makeUiState());
    for (const id of ['undoBtn', 'themeToggle', 'helpToggle', 'saveProj', 'projFile']) {
      expect(document.querySelectorAll('#' + id).length).toBe(1);
      expect(shell.topbarActionsEl.querySelector('#' + id)).not.toBeNull();
    }
  });
});

// @vitest-environment happy-dom
import '../helpers/setupDom';
import { describe, it, expect, beforeEach } from 'vitest';
import { mountViewerControls } from '../../src/ui/viewer-controls/viewerControls';
import { createUi } from '../../src/ui/ui';
import { createShell } from '../../src/ui/shell/shell';
import { makeCallbacks } from '../fixtures/callbacks';
import { makeUiState } from '../fixtures/uiState';

let host: HTMLElement;
let calls: ReturnType<typeof makeCallbacks>['calls'];
let explosions: number[];
let handle: ReturnType<typeof mountViewerControls>;
let order: string[];

const slider = () => host.querySelector<HTMLInputElement>('input[type="range"]')!;
const eye = () => host.querySelector<HTMLButtonElement>('button[aria-label="Mostrar switch"]')!;
const drag = (v: number) => {
  slider().value = String(v);
  slider().dispatchEvent(new Event('input'));
};

beforeEach(() => {
  document.body.innerHTML = '';
  host = document.body.appendChild(document.createElement('div'));
  const made = makeCallbacks();
  calls = made.calls;
  explosions = [];
  order = [];
  const cb = made.cb;
  const onView = cb.onView;
  cb.onView = (m) => { order.push('view:' + m); onView(m); };
  handle = mountViewerControls(host, cb, (t) => { order.push('exp:' + t); explosions.push(t); });
  handle.update(makeUiState({ view: 'assembled', showSwitch: true }));
});

describe('mountViewerControls', () => {
  it('el deslizador es de 0 a 1 con etiqueta en español', () => {
    expect(slider().min).toBe('0');
    expect(slider().max).toBe('1');
    expect(slider().step).toBe('0.01');
    expect(slider().getAttribute('aria-label')).toBe('Explosión');
    expect(host.textContent).toContain('Explosión');
  });

  it('mover a 0.4 llama onExplosion(0.4)', () => {
    drag(0.4);
    expect(explosions).toEqual([0.4]);
  });

  it('pasar de 0 a >0 llama onView("exploded") una sola vez, antes de onExplosion', () => {
    drag(0.2);
    drag(0.4);
    expect(calls.onView).toEqual([['exploded']]);
    expect(order).toEqual(['view:exploded', 'exp:0.2', 'exp:0.4']);
  });

  it('volver a 0 llama onView("assembled")', () => {
    drag(0.4);
    drag(0);
    expect(calls.onView).toEqual([['exploded'], ['assembled']]);
    expect(explosions).toEqual([0.4, 0]);
  });

  it('el ojo llama onShowSwitch(false) con el switch visible y aria-pressed sigue al estado', () => {
    expect(eye().getAttribute('aria-pressed')).toBe('true');
    eye().click();
    expect(calls.onShowSwitch).toEqual([[false]]);
    handle.update(makeUiState({ showSwitch: false }));
    expect(eye().getAttribute('aria-pressed')).toBe('false');
    eye().click();
    expect(calls.onShowSwitch).toEqual([[false], [true]]);
  });

  it('update con view assembled deja el deslizador en 0', () => {
    drag(0.7);
    handle.update(makeUiState({ view: 'assembled' }));
    expect(Number(slider().value)).toBe(0);
  });

  it('update con view exploded y deslizador en 0 lo lleva a 1', () => {
    handle.update(makeUiState({ view: 'exploded' }));
    expect(Number(slider().value)).toBe(1);
  });

  it('un update con la vista sin cambios no mueve el deslizador (arrastre en curso)', () => {
    drag(0.4);
    handle.update(makeUiState({ view: 'exploded' }));
    expect(Number(slider().value)).toBe(0.4);
  });
});

describe('createUi con shell y opts.onExplosion', () => {
  it('monta un solo deslizador y un solo ojo, sin #viewTabs ni #showswitch', () => {
    document.body.innerHTML = '';
    const root = document.body.appendChild(document.createElement('div'));
    const shell = createShell(root);
    const made = makeCallbacks();
    const got: number[] = [];
    const ui = createUi(shell.statusEl, made.cb, shell, { onExplosion: (t) => got.push(t) });
    ui.update(makeUiState({ view: 'assembled' }));
    expect(document.querySelectorAll('input[type="range"][aria-label="Explosión"]')).toHaveLength(1);
    expect(document.querySelectorAll('button[aria-label="Mostrar switch"]')).toHaveLength(1);
    expect(document.getElementById('viewTabs')).toBeNull();
    expect(document.getElementById('showswitch')).toBeNull();
    expect(shell.viewerControlsEl.querySelector('input[type="range"]')).not.toBeNull();
    shell.dispose();
  });
});

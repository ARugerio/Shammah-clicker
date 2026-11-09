// @vitest-environment happy-dom
import '../helpers/setupDom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

// Reloj manual para requestAnimationFrame.
let queue: Map<number, FrameRequestCallback>;
let nextId: number;
let clock: number;
const g = globalThis as any;
const realRaf = g.requestAnimationFrame;
const realCaf = g.cancelAnimationFrame;
const frame = (ms = 16) => {
  clock += ms;
  const run = [...queue.entries()];
  queue.clear();
  for (const [, fn] of run) fn(clock);
};
const runAll = () => { for (let i = 0; i < 200 && queue.size; i++) frame(); };

const split = () => host.querySelector<HTMLButtonElement>('.vc-split')!;
const eye = () => host.querySelector<HTMLButtonElement>('button[aria-label="Mostrar switch"]')!;
const monotone = (xs: number[], dir: 'down' | 'up') =>
  xs.every((v, i) => i === 0 || (dir === 'down' ? v <= xs[i - 1] : v >= xs[i - 1]));

beforeEach(() => {
  document.body.innerHTML = '';
  queue = new Map();
  nextId = 1;
  clock = 1000;
  g.requestAnimationFrame = (fn: FrameRequestCallback) => { const id = nextId++; queue.set(id, fn); return id; };
  g.cancelAnimationFrame = (id: number) => { queue.delete(id); };
  host = document.body.appendChild(document.createElement('div'));
  const made = makeCallbacks();
  calls = made.calls;
  explosions = [];
  order = [];
  const cb = made.cb;
  const onView = cb.onView;
  cb.onView = (m) => { order.push('view:' + m); onView(m); };
  handle = mountViewerControls(host, cb, (t) => { order.push('exp'); explosions.push(t); });
  handle.update(makeUiState({ view: 'exploded', showSwitch: true }));
});

afterEach(() => {
  g.requestAnimationFrame = realRaf;
  g.cancelAnimationFrame = realCaf;
});

describe('mountViewerControls', () => {
  it('no hay deslizador: un botón de separar y el ojo', () => {
    expect(host.querySelector('input')).toBeNull();
    expect(host.querySelector('input[type="range"]')).toBeNull();
    expect(split()).not.toBeNull();
    expect(host.textContent).not.toContain('Explosión');
  });

  it('el primer update (vista despiezada) muestra pulsado y deja el visor separado sin animar', () => {
    expect(split().getAttribute('aria-pressed')).toBe('true');
    expect(split().getAttribute('aria-label')).toBe('Juntar piezas');
    expect(split().title).toBe('Juntar piezas');
    expect(explosions[explosions.length - 1]).toBe(1);
    expect(queue.size).toBe(0);
    expect(calls.onView ?? []).toEqual([]);
  });

  it('clic desde separado: onView("assembled") una vez y onExplosion baja hasta 0 exacto', () => {
    split().click();
    expect(calls.onView).toEqual([['assembled']]);
    expect(split().getAttribute('aria-pressed')).toBe('false');
    expect(split().getAttribute('aria-label')).toBe('Separar piezas');
    const start = explosions.length;
    runAll();
    const run = explosions.slice(start - 1);
    expect(run[0]).toBe(1);
    expect(run.length).toBeGreaterThan(3);
    expect(monotone(run, 'down')).toBe(true);
    expect(run[run.length - 1]).toBe(0);
    expect(calls.onView).toHaveLength(1);
  });

  it('otro clic: onView("exploded") una vez y sube hasta 1 exacto', () => {
    split().click();
    runAll();
    explosions.length = 0;
    split().click();
    expect(calls.onView).toEqual([['assembled'], ['exploded']]);
    runAll();
    expect(monotone(explosions, 'up')).toBe(true);
    expect(explosions[0]).toBe(0);
    expect(explosions[explosions.length - 1]).toBe(1);
    expect(split().getAttribute('aria-pressed')).toBe('true');
    expect(split().getAttribute('aria-label')).toBe('Juntar piezas');
  });

  it('un segundo clic a mitad de animación invierte desde el valor actual', () => {
    split().click();
    frame(); frame(100); frame(100);
    const mid = explosions[explosions.length - 1];
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    explosions.length = 0;
    split().click();
    runAll();
    expect(explosions[0]).toBe(mid);
    expect(monotone(explosions, 'up')).toBe(true);
    expect(explosions[explosions.length - 1]).toBe(1);
    expect(calls.onView).toEqual([['assembled'], ['exploded']]);
  });

  it('update durante la animación no la reinicia ni la corta', () => {
    split().click();
    frame(); frame(100);
    const pending = queue.size;
    const before = explosions[explosions.length - 1];
    handle.update(makeUiState({ view: 'assembled' }));
    expect(queue.size).toBe(pending);
    expect(explosions[explosions.length - 1]).toBe(before);
    runAll();
    expect(explosions[explosions.length - 1]).toBe(0);
  });

  it('un cambio externo de vista (deshacer) salta sin animar y sincroniza el botón', () => {
    handle.update(makeUiState({ view: 'assembled' }));
    expect(split().getAttribute('aria-pressed')).toBe('false');
    expect(split().getAttribute('aria-label')).toBe('Separar piezas');
    expect(explosions[explosions.length - 1]).toBe(0);
    handle.update(makeUiState({ view: 'section' }));
    expect(split().getAttribute('aria-pressed')).toBe('false');
    handle.update(makeUiState({ view: 'exploded' }));
    expect(split().getAttribute('aria-pressed')).toBe('true');
    expect(explosions[explosions.length - 1]).toBe(1);
    expect(queue.size).toBe(0);
  });

  it('con movimiento reducido salta al valor final sin animar', () => {
    const real = g.matchMedia;
    g.matchMedia = (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} });
    try {
      explosions.length = 0;
      split().click();
      expect(queue.size).toBe(0);
      expect(explosions[explosions.length - 1]).toBe(0);
      expect(calls.onView).toEqual([['assembled']]);
    } finally {
      g.matchMedia = real;
    }
  });

  it('sin matchMedia no falla y anima', () => {
    const real = g.matchMedia;
    g.matchMedia = undefined;
    try {
      split().click();
      expect(queue.size).toBe(1);
    } finally {
      g.matchMedia = real;
    }
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
});

describe('createUi con shell y opts.onExplosion', () => {
  it('monta un solo botón de separar y un solo ojo, sin deslizador, #viewTabs ni #showswitch', () => {
    document.body.innerHTML = '';
    const root = document.body.appendChild(document.createElement('div'));
    const shell = createShell(root);
    const made = makeCallbacks();
    const got: number[] = [];
    const ui = createUi(shell.statusEl, made.cb, shell, { onExplosion: (t) => got.push(t) });
    ui.update(makeUiState({ view: 'assembled' }));
    expect(document.querySelectorAll('.vc-split')).toHaveLength(1);
    expect(shell.viewerControlsEl.querySelectorAll('input')).toHaveLength(0);
    expect(document.querySelectorAll('button[aria-label="Mostrar switch"]')).toHaveLength(1);
    expect(document.getElementById('viewTabs')).toBeNull();
    expect(document.getElementById('showswitch')).toBeNull();
    expect(shell.viewerControlsEl.querySelector('.vc-split')).not.toBeNull();
    shell.dispose();
  });
});

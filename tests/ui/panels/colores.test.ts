// @vitest-environment happy-dom
import '../../helpers/setupDom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { coloresPanel, mountColorViewportTools } from '../../../src/ui/panels/colores';
import { showColorPopoverAt } from '../../../src/ui/shared/colorPopover';
import { makeCallbacks } from '../../fixtures/callbacks';
import { makeUiState } from '../../fixtures/uiState';
import { createUi } from '../../../src/ui/ui';
import { createShell } from '../../../src/ui/shell/shell';
import type { PanelHandle } from '../../../src/ui/shell/types';
import type { PaletteEntry } from '../../../src/types';
import { FILAMENTS } from '../../../src/types';

let host: HTMLElement;
let calls: ReturnType<typeof makeCallbacks>['calls'];
let handle: PanelHandle;

const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;
const p1: PaletteEntry = { quantRgb: [200, 30, 30], filamentRgb: [255, 0, 0], coverage: 0.6 };
const p2: PaletteEntry = { quantRgb: [20, 20, 200], filamentRgb: [0, 0, 255], coverage: 0.4 };
/** Hex en minúsculas tal como lo emite el selector (FILAMENTS puede traer mayúsculas). */
const lower = (hex: string) => hex.toLowerCase();
const popover = () => document.getElementById('sbColorPopover');

afterEach(() => {
  // Ningún popover vivo pasa a la siguiente prueba.
  popover()?.querySelector<HTMLElement>('button')?.click();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('coloresPanel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.body.appendChild(document.createElement('div'));
    const made = makeCallbacks();
    calls = made.calls;
    handle = coloresPanel.mount(host, made.cb);
  });

  it('se identifica como el panel colores', () => {
    expect(coloresPanel.id).toBe('colores');
  });

  it('con dos entradas de paleta pinta dos filas además del cuerpo', () => {
    handle.update(makeUiState({ palette: [p1, p2], colorCount: 2 }));
    const rows = host.querySelectorAll('#palette .fil-row:not(.body-row)');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('.slot-no')!.textContent).toBe('E1');
    expect(rows[1].querySelector('.slot-no')!.textContent).toBe('E2');
    expect(host.querySelectorAll('#palette .body-row').length).toBe(1);
    expect($<HTMLSelectElement>('ccount').value).toBe('2');
  });

  it('elegir un color en el popover de una fila llama onFilament(i, hex)', () => {
    handle.update(makeUiState({ palette: [p1, p2], colorCount: 2 }));
    host.querySelectorAll<HTMLElement>('#palette .fil-row:not(.body-row) .fil-chip')[1].click();
    const opts = popover()!.querySelectorAll<HTMLElement>('button');
    expect(opts.length).toBe(FILAMENTS.length);
    opts[2].click();
    expect(calls.onFilament).toEqual([[1, lower(FILAMENTS[2][1])]]);
    expect(popover()).toBeNull();
  });

  it('el chip del cuerpo llama onBodyColor', () => {
    handle.update(makeUiState({ palette: [p1, p2], colorCount: 2 }));
    host.querySelector<HTMLElement>('#palette .body-row .fil-chip')!.click();
    popover()!.querySelectorAll<HTMLElement>('button')[0].click();
    expect(calls.onBodyColor).toEqual([[lower(FILAMENTS[0][1])]]);
  });

  it('en modo limitado el popover solo ofrece los colores limitados', () => {
    handle.update(makeUiState({ palette: [p1, p2], colorCount: 2, colorMode: 'limited', limitedColors: [[255, 0, 0], [0, 255, 0]] }));
    expect($<HTMLSelectElement>('ccount').disabled).toBe(true);
    host.querySelector<HTMLElement>('#palette .fil-row:not(.body-row) .fil-chip')!.click();
    expect(popover()!.querySelectorAll('button').length).toBe(2);
  });

  it('cambiar la cantidad de colores llama onColorCount', () => {
    const ccount = $<HTMLSelectElement>('ccount');
    ccount.value = '5';
    ccount.dispatchEvent(new Event('change'));
    expect(calls.onColorCount).toEqual([[5]]);
  });

  it('mover el suavizado a 3 llama onSmoothing(3)', () => {
    const smooth = $<HTMLInputElement>('smooth');
    // Los atributos del deslizador acotan a [0,1]; se fija el valor como lo haría el navegador sin acotar.
    smooth.max = '5';
    smooth.value = '3';
    smooth.dispatchEvent(new Event('input'));
    expect(calls.onSmoothing).toEqual([[3]]);
  });

  it('update() no pisa el valor que se está escribiendo en el campo de suavizado', () => {
    handle.update(makeUiState({ smoothing: 0.1 }));
    const val = $<HTMLInputElement>('smoothVal');
    expect(val.value).toBe('10%');
    val.focus();
    val.value = '4';
    handle.update(makeUiState({ smoothing: 0.25 }));
    expect(val.value).toBe('4');
    expect($<HTMLInputElement>('smooth').value).toBe('0.25');
  });

  it('fuera del modo imagen oculta cantidad y suavizado', () => {
    handle.update(makeUiState({ importMode: 'svg' }));
    expect($('colorCountField').style.display).toBe('none');
    expect($('smoothingField').style.display).toBe('none');
    handle.update(makeUiState({ importMode: 'image' }));
    expect($('colorCountField').style.display).toBe('grid');
  });

  it('los biselados de tapa y base llaman onEdgeStyle y onEdgeStep', () => {
    handle.update(makeUiState());
    host.querySelector<HTMLElement>('#globalEdges .edge-style-btns[data-edge="capTop"] [data-style="fillet"]')!.click();
    host.querySelector<HTMLElement>('#globalEdges .edge-size-btns[data-edge="clickerBase"] .edge-size-plus')!.click();
    expect(calls.onEdgeStyle).toEqual([['capTop', 'fillet']]);
    expect(calls.onEdgeStep).toEqual([['clickerBase', 0.2]]);
  });

  it('update() refleja el estilo de bisel y el tamaño', () => {
    handle.update(makeUiState({ edgeSettings: [{ target: 'capTop', style: 'fillet', radius: 0.8 }] }));
    const cap = host.querySelector('#globalEdges .edge-style-btns[data-edge="capTop"] .active') as HTMLElement;
    expect(cap.dataset.style).toBe('fillet');
    const size = host.querySelector<HTMLElement>('#globalEdges .edge-size-btns[data-edge="capTop"]')!;
    expect(size.style.display).toBe('flex');
    expect(size.querySelector('.edge-size-val')!.textContent).toBe('0.8 mm');
    expect(host.querySelector<HTMLElement>('#globalEdges .edge-size-btns[data-edge="clickerBase"]')!.style.display).toBe('none');
  });
});

describe('herramientas de relieve y bisel en el visor', () => {
  let viewport: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    viewport = document.body.appendChild(document.createElement('div'));
    const made = makeCallbacks();
    calls = made.calls;
    handle = mountColorViewportTools(viewport, made.cb);
  });
  const v = <T extends HTMLElement>(id: string) => viewport.querySelector<T>('#' + id)!;

  it('cambiar el modo de edición llama onEditMode y marca el activo', () => {
    v('editModeBar').querySelector<HTMLElement>('[data-editmode="extrude"]')!.click();
    expect(calls.onEditMode).toEqual([['extrude']]);
    handle.update(makeUiState({ editMode: 'extrude' }));
    expect((v('editModeBar').querySelector('.active') as HTMLElement).dataset.editmode).toBe('extrude');
  });

  it('en modo relieve sin selección los pasos quedan desactivados', () => {
    handle.update(makeUiState({ editMode: 'extrude', selectedParts: [] }));
    expect(v('extrudePanel').hidden).toBe(false);
    expect(v<HTMLButtonElement>('extrudePlus').disabled).toBe(true);
    expect(v<HTMLButtonElement>('extrudeMinus').disabled).toBe(true);
    expect(v('extrudeLevelLabel').textContent).toBe('Seleccione una capa');
  });

  it('en modo relieve con partes seleccionadas los pasos llaman onExtrudeStep(±1)', () => {
    handle.update(makeUiState({ editMode: 'color' }));
    expect(v('extrudePanel').hidden).toBe(true);
    handle.update(makeUiState({ editMode: 'extrude', selectedParts: ['top-color-0-1', 'top-color-1-1'], componentHeights: { 'top-color-0-1': 1.5 } }));
    expect(v('extrudePanel').hidden).toBe(false);
    expect(v('extrudeLevelLabel').textContent).toBe('2 zonas · Relieve: 1.5');
    v('extrudePlus').click();
    v('extrudeMinus').click();
    expect(calls.onExtrudeStep).toEqual([[1], [-1]]);
  });

  it('el bisel de bordes levantados llama onExtrudeChamfer', () => {
    handle.update(makeUiState({ editMode: 'extrude', extrudeChamfer: false }));
    const chk = v<HTMLInputElement>('extrudeChamfer');
    chk.checked = true;
    chk.dispatchEvent(new Event('change'));
    expect(calls.onExtrudeChamfer).toEqual([[true]]);
  });

  it('en modo bordes con una zona seleccionada sus botones llaman onEdgeStyle y onEdgeStep', () => {
    handle.update(makeUiState({ editMode: 'edges', selectedParts: ['top-color-0-1'], edgeSettings: [] }));
    expect(v('edgesPanel').hidden).toBe(false);
    expect(v('edgesTitle').textContent).toBe('Bordes de la Pieza');
    expect(viewport.querySelector('#edgesContent .edge-label')!.textContent).toContain('Color 1');
    viewport.querySelector<HTMLElement>('#edgesContent [data-style="chamfer"]')!.click();
    viewport.querySelector<HTMLElement>('#edgesContent .edge-size-minus')!.click();
    expect(calls.onEdgeStyle).toEqual([['top-color-0-1', 'chamfer']]);
    expect(calls.onEdgeStep).toEqual([['top-color-0-1', -0.2]]);
  });

  it('separar letras solo aparece con texto y llama onSeparateLetters', () => {
    handle.update(makeUiState({ importMode: 'image' }));
    expect(v('lettersToggle').hidden).toBe(true);
    handle.update(makeUiState({ importMode: 'text', separateLetters: true }));
    expect(v('lettersToggle').hidden).toBe(false);
    const chk = v<HTMLInputElement>('separateLetters');
    expect(chk.checked).toBe(true);
    chk.checked = false;
    chk.dispatchEvent(new Event('change'));
    expect(calls.onSeparateLetters).toEqual([[false]]);
  });
});

describe('showColorPopoverAt', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('abre un popover con las opciones y se cierra al elegir (handlers una vez)', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    showColorPopoverAt(10, 20, '#00ff00', [[255, 0, 0], [0, 255, 0], [0, 0, 255]], { onSelect, onClose });
    const btns = popover()!.querySelectorAll<HTMLElement>('button');
    expect(btns.length).toBe(3);
    expect(btns[1].classList.contains('active')).toBe(true);
    btns[2].click();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('#0000ff');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(popover()).toBeNull();
  });

  it('un clic fuera lo cierra y quita el manejador del documento', () => {
    vi.useFakeTimers();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const onClose = vi.fn();
    showColorPopoverAt(0, 0, '#ff0000', [[255, 0, 0]], { onSelect: vi.fn(), onClose });
    vi.advanceTimersByTime(60);
    const added = add.mock.calls.filter(([t]) => t === 'mousedown').map(([, fn]) => fn);
    expect(added.length).toBe(1);
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(popover()).toBeNull();
    expect(remove.mock.calls.filter(([t, fn]) => t === 'mousedown' && fn === added[0]).length).toBe(1);
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('elegir antes de que se arme el clic-fuera no deja manejador colgado', () => {
    vi.useFakeTimers();
    const add = vi.spyOn(document, 'addEventListener');
    showColorPopoverAt(0, 0, '#ff0000', [[255, 0, 0]], { onSelect: vi.fn() });
    popover()!.querySelector<HTMLElement>('button')!.click();
    vi.advanceTimersByTime(200);
    expect(add.mock.calls.filter(([t]) => t === 'mousedown').length).toBe(0);
  });

  it('abrir uno nuevo retira el anterior sin llamar su onClose ni dejar manejadores', () => {
    vi.useFakeTimers();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const firstClose = vi.fn();
    showColorPopoverAt(0, 0, '#ff0000', [[255, 0, 0]], { onSelect: vi.fn(), onClose: firstClose });
    vi.advanceTimersByTime(60);
    showColorPopoverAt(0, 0, '#ff0000', [[255, 0, 0], [0, 0, 0]], { onSelect: vi.fn() });
    expect(document.querySelectorAll('#sbColorPopover').length).toBe(1);
    expect(popover()!.querySelectorAll('button').length).toBe(2);
    expect(firstClose).not.toHaveBeenCalled();
    const firstFn = add.mock.calls.find(([t]) => t === 'mousedown')![1];
    expect(remove.mock.calls.some(([t, fn]) => t === 'mousedown' && fn === firstFn)).toBe(true);
  });
});

describe('createUi y el panel Colores', () => {
  const mountUi = (withShell: boolean) => {
    document.body.innerHTML = '';
    const root = document.body.appendChild(document.createElement('div'));
    const shell = createShell(root);
    const { cb, calls } = makeCallbacks();
    const ui = createUi(shell.legacyLeftEl, shell.legacyRightEl, shell.statusEl, cb, withShell ? shell : undefined);
    ui.update(makeUiState({ palette: [p1, p2], colorCount: 2, editMode: 'extrude', selectedParts: ['top-color-0-1'] }));
    return { shell, calls, ui };
  };

  it('con shell monta el panel en el dock, el relieve en el visor y no deja copia en la barra antigua', () => {
    const { shell, calls, ui } = mountUi(true);
    const dock = shell.panelHost('colores');
    expect(dock.querySelectorAll('#palette .fil-row:not(.body-row)').length).toBe(2);
    expect(dock.querySelector('#globalEdges')).not.toBeNull();
    expect(shell.legacyLeftEl.querySelector('#sectionColors, #palette, #ccount, #globalEdges')).toBeNull();
    for (const id of ['sectionColors', 'palette', 'globalEdges', 'editModeBar', 'extrudePanel', 'edgesPanel', 'lettersToggle']) {
      expect(document.querySelectorAll('#' + id).length).toBe(1);
    }
    expect(shell.viewportEl.querySelector('#editModeBar')).not.toBeNull();
    expect(shell.viewportEl.querySelector('#extrudePanel')!.hasAttribute('hidden')).toBe(false);
    shell.viewportEl.querySelector<HTMLElement>('#extrudePlus')!.click();
    expect(calls.onExtrudeStep).toEqual([[1]]);
    // La fachada sigue entregando todo lo que main.ts usa.
    expect(Object.keys(ui).sort()).toEqual(['addFontOption', 'addUploadedSvg', 'hexRgb', 'showColorPopoverAt', 'update']);
    expect(ui.hexRgb('#ff8000')).toEqual([255, 128, 0]);
    shell.dispose();
  });

  it('sin shell monta el panel dentro de la barra izquierda', () => {
    const { shell } = mountUi(false);
    expect(shell.legacyLeftEl.querySelectorAll('#palette .fil-row:not(.body-row)').length).toBe(2);
    expect(shell.legacyLeftEl.querySelector('#globalEdges')).not.toBeNull();
    expect(shell.panelHost('colores').querySelector('#palette')).toBeNull();
    expect(document.querySelectorAll('#palette').length).toBe(1);
    shell.dispose();
  });
});

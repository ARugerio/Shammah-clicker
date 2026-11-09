// @vitest-environment happy-dom
import '../../helpers/setupDom';
import { describe, it, expect, beforeEach } from 'vitest';
import { formaPanel } from '../../../src/ui/panels/forma';
import { makeCallbacks } from '../../fixtures/callbacks';
import { makeUiState } from '../../fixtures/uiState';
import { createUi } from '../../../src/ui/ui';
import { createShell } from '../../../src/ui/shell/shell';
import type { PanelHandle } from '../../../src/ui/shell/types';

let host: HTMLElement;
let calls: ReturnType<typeof makeCallbacks>['calls'];
let handle: PanelHandle;

const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;

beforeEach(() => {
  document.body.innerHTML = '';
  host = document.body.appendChild(document.createElement('div'));
  const made = makeCallbacks();
  calls = made.calls;
  handle = formaPanel.mount(host, made.cb);
});

describe('formaPanel', () => {
  it('se identifica como el panel forma', () => {
    expect(formaPanel.id).toBe('forma');
  });

  it('mover el tamaño general llama onWidth con el valor', () => {
    const w = $<HTMLInputElement>('width');
    w.value = '40';
    w.dispatchEvent(new Event('input'));
    expect(calls.onWidth).toEqual([[40]]);
  });

  it('el grosor de respaldo y el relieve llaman a sus callbacks', () => {
    const t = $<HTMLInputElement>('topthick');
    t.value = '2.5';
    t.dispatchEvent(new Event('input'));
    const d = $<HTMLInputElement>('imgdepth');
    d.value = '1.2';
    d.dispatchEvent(new Event('input'));
    expect(calls.onTopThickness).toEqual([[2.5]]);
    expect(calls.onImageDepth).toEqual([[1.2]]);
  });

  it('los botones de tolerancia llaman con ±paso', () => {
    $('socketTolMinus').click();
    $('socketTolPlus').click();
    $('stemTolMinus').click();
    $('stemTolPlus').click();
    expect(calls.onSocketTolStep).toEqual([[-0.05], [0.05]]);
    expect(calls.onStemTolStep).toEqual([[-0.2], [0.2]]);
  });

  it('las pestañas y el selector de forma llaman onShape', () => {
    host.querySelector<HTMLElement>('#shapeTypeTabs [data-style="outline"]')!.click();
    const sel = $<HTMLSelectElement>('shapeSelect');
    sel.value = 'heart';
    sel.dispatchEvent(new Event('change'));
    host.querySelector<HTMLElement>('#shapeTypeTabs [data-style="shape"]')!.click();
    expect(calls.onShape).toEqual([['outline'], ['heart'], ['heart']]);
  });

  it('el campo de valor numérico confirma al perder el foco, acotado al rango', () => {
    const val = $<HTMLInputElement>('widthVal');
    val.value = '999 mm';
    val.dispatchEvent(new Event('blur'));
    expect(calls.onWidth).toEqual([[70]]);
  });

  it('update refleja el estado en controles y rótulos', () => {
    handle.update(makeUiState({ capWidthMm: 55, topThickness: 2, imageDepth: 1, tolerance: 0.45, stemTolerance: -0.2, baseShape: 'star' }));
    expect($<HTMLInputElement>('width').value).toBe('55');
    expect($<HTMLInputElement>('widthVal').value).toBe('55 mm');
    expect($<HTMLInputElement>('topthickVal').value).toBe('2.0 mm');
    expect($<HTMLInputElement>('imgdepthVal').value).toBe('1.0 mm');
    expect($('socketTolVal').textContent).toBe('+0.05 mm');
    expect($('stemTolVal').textContent).toBe('−0.2 mm');
    expect($<HTMLSelectElement>('shapeSelect').value).toBe('star');
    expect(host.querySelector('#shapeTypeTabs .active')!.getAttribute('data-style')).toBe('shape');
  });

  it('con baseShape outline marca Contorno y desactiva el selector; en modo icono oculta Contorno', () => {
    handle.update(makeUiState({ baseShape: 'outline' }));
    expect(host.querySelector('#shapeTypeTabs .active')!.getAttribute('data-style')).toBe('outline');
    expect($<HTMLSelectElement>('shapeSelect').disabled).toBe(true);
    handle.update(makeUiState({ baseShape: 'outline', importMode: 'icon' }));
    expect(host.querySelector<HTMLElement>('#shapeTypeTabs [data-style="outline"]')!.style.display).toBe('none');
    expect($<HTMLSelectElement>('shapeSelect').disabled).toBe(false);
  });
});

describe('createUi y el panel Forma', () => {
  const mountUi = () => {
    document.body.innerHTML = '';
    const root = document.body.appendChild(document.createElement('div'));
    const shell = createShell(root);
    const { cb, calls } = makeCallbacks();
    const ui = createUi(shell.statusEl, cb, shell);
    ui.update(makeUiState({ capWidthMm: 55 }));
    return { shell, calls };
  };

  it('monta el panel en el dock, una sola vez', () => {
    const { shell, calls } = mountUi();
    const w = shell.panelHost('forma').querySelector<HTMLInputElement>('#width')!;
    expect(w.value).toBe('55');
    expect(document.querySelectorAll('#width').length).toBe(1);
    w.value = '40';
    w.dispatchEvent(new Event('input'));
    expect(calls.onWidth).toEqual([[40]]);
    shell.dispose();
  });
});

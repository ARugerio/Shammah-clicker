// @vitest-environment happy-dom
import '../../helpers/setupDom';
import { describe, it, expect, beforeEach } from 'vitest';
import { exportarPanel } from '../../../src/ui/panels/exportar';
import { makeCallbacks } from '../../fixtures/callbacks';
import { makeUiState } from '../../fixtures/uiState';
import { createUi } from '../../../src/ui/ui';
import { createShell } from '../../../src/ui/shell/shell';
import type { PanelHandle } from '../../../src/ui/shell/types';

const CREDIT = 'Motor base: Vostok Labs · Herramienta personalizada por SHAMMAH 3D';
const palette = [
  { quantRgb: [10, 10, 10], filamentRgb: [0, 0, 0], coverage: 0.5 },
  { quantRgb: [250, 0, 0], filamentRgb: [255, 0, 0], coverage: 0.3 },
  { quantRgb: [0, 0, 250], filamentRgb: [0, 0, 255], coverage: 0.2 },
] as any;

let host: HTMLElement;
let calls: ReturnType<typeof makeCallbacks>['calls'];
let handle: PanelHandle;
const btn = () => host.querySelector<HTMLButtonElement>('#export')!;

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  host = document.body.appendChild(document.createElement('div'));
  const made = makeCallbacks();
  calls = made.calls;
  handle = exportarPanel.mount(host, made.cb);
});

describe('exportarPanel', () => {
  it('se identifica como el panel exportar', () => {
    expect(exportarPanel.id).toBe('exportar');
  });

  it('#export queda deshabilitado sin piezas o mientras se construye, y activo en otro caso', () => {
    handle.update(makeUiState({ hasParts: false, building: false }));
    expect(btn().disabled).toBe(true);
    handle.update(makeUiState({ hasParts: true, building: true }));
    expect(btn().disabled).toBe(true);
    handle.update(makeUiState({ hasParts: true, building: false }));
    expect(btn().disabled).toBe(false);
  });

  it('pulsar #export activo llama onExport', () => {
    handle.update(makeUiState({ hasParts: true, building: false }));
    btn().click();
    expect(calls.onExport).toEqual([[]]);
  });

  it('el resumen muestra un chip por entrada de la paleta y la cuenta', () => {
    handle.update(makeUiState({ palette }));
    expect(host.querySelectorAll('.export-chip').length).toBe(3);
    expect(host.querySelector('.export-summary-count')!.textContent).toContain('3');
    handle.update(makeUiState({ palette: palette.slice(0, 1) }));
    expect(host.querySelectorAll('.export-chip').length).toBe(1);
    expect(host.querySelector('.export-summary-count')!.textContent).toContain('1');
  });

  it.each(['light', 'dark'])('el crédito está en el DOM con tema %s', (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    handle.update(makeUiState());
    const credit = host.querySelector('.sidebar-credit')!;
    expect(credit.textContent).toBe(CREDIT);
  });
});

describe('createUi con el panel Exportar', () => {
  it('un solo #export y un solo crédito, en el panel del dock', () => {
    document.body.innerHTML = '';
    const { cb } = makeCallbacks();
    const shell = createShell(document.body.appendChild(document.createElement('div')));
    createUi(shell.statusEl, cb, shell).update(makeUiState());
    expect(document.querySelectorAll('#export').length).toBe(1);
    expect(document.querySelectorAll('.sidebar-credit').length).toBe(1);
    expect(shell.panelHost('exportar').querySelectorAll('#export, .sidebar-credit').length).toBe(2);
    shell.dispose();
  });
});

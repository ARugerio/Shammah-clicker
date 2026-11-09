// @vitest-environment happy-dom
import '../../helpers/setupDom';
import { describe, it, expect, beforeEach } from 'vitest';
import { llaveroPanel } from '../../../src/ui/panels/llavero';
import { makeCallbacks } from '../../fixtures/callbacks';
import { makeUiState } from '../../fixtures/uiState';
import { createUi } from '../../../src/ui/ui';
import { createShell } from '../../../src/ui/shell/shell';
import type { PanelHandle } from '../../../src/ui/shell/types';

let host: HTMLElement;
let calls: ReturnType<typeof makeCallbacks>['calls'];
let handle: PanelHandle;

const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;
const on = { enabled: true, style: 'loop' as const, angleDeg: 90, holeDiameterMm: 5.2, offsetMm: 0 };

beforeEach(() => {
  document.body.innerHTML = '';
  host = document.body.appendChild(document.createElement('div'));
  const made = makeCallbacks();
  calls = made.calls;
  handle = llaveroPanel.mount(host, made.cb);
});

describe('llaveroPanel', () => {
  it('se identifica como el panel llavero', () => {
    expect(llaveroPanel.id).toBe('llavero');
  });

  it('activar el interruptor llama onKeychainToggle(true) y desactivarlo (false)', () => {
    const t = $<HTMLInputElement>('keychain');
    t.checked = true;
    t.dispatchEvent(new Event('change'));
    t.checked = false;
    t.dispatchEvent(new Event('change'));
    expect(calls.onKeychainToggle).toEqual([[true], [false]]);
  });

  it('rotar, desfasar y cambiar tamaño llaman sus callbacks con el delta del botón', () => {
    $('keychainRotMinus').click();
    $('keychainRotPlus').click();
    $('keychainOffsetMinus').click();
    $('keychainOffsetPlus').click();
    $('keychainSizeMinus').click();
    $('keychainSizePlus').click();
    expect(calls.onKeychainRotate).toEqual([[-15], [15]]);
    expect(calls.onKeychainOffset).toEqual([[-1], [1]]);
    expect(calls.onKeychainSize).toEqual([[-0.4], [0.4]]);
  });

  it('con el llavero apagado oculta las opciones y deja el interruptor sin marcar', () => {
    handle.update(makeUiState({ keychain: { ...on, enabled: false } }));
    expect($('keychainOpts').style.display).toBe('none');
    expect($<HTMLInputElement>('keychain').checked).toBe(false);
  });

  it('con el llavero encendido muestra las opciones y los valores del estado', () => {
    handle.update(makeUiState({ keychain: { ...on, angleDeg: -90, offsetMm: 1.25, holeDiameterMm: 6 } }));
    expect($('keychainOpts').style.display).toBe('');
    expect($<HTMLInputElement>('keychain').checked).toBe(true);
    expect($('keychainAngleVal').textContent).toBe('270°');
    expect($('keychainOffsetVal').textContent).toBe('1.3 mm');
    expect($('keychainSizeVal').textContent).toBe('6.0 mm');
  });
});

describe('createUi y el panel Llavero', () => {
  const mountUi = (withShell: boolean) => {
    document.body.innerHTML = '';
    const root = document.body.appendChild(document.createElement('div'));
    const shell = createShell(root);
    const { cb, calls } = makeCallbacks();
    const ui = createUi(shell.legacyLeftEl, shell.legacyRightEl, shell.statusEl, cb, withShell ? shell : undefined);
    ui.update(makeUiState({ keychain: on }));
    return { shell, calls };
  };

  it('con shell monta el panel en el dock y no deja copia en la barra antigua', () => {
    const { shell, calls } = mountUi(true);
    const dock = shell.panelHost('llavero');
    expect(dock.querySelector('#keychainOpts')).not.toBeNull();
    expect(shell.legacyLeftEl.querySelector('#keychain')).toBeNull();
    expect(document.querySelectorAll('#keychain').length).toBe(1);
    dock.querySelector<HTMLElement>('#keychainSizePlus')!.click();
    expect(calls.onKeychainSize).toEqual([[0.4]]);
    shell.dispose();
  });

  it('sin shell monta el panel dentro de la barra izquierda', () => {
    const { shell } = mountUi(false);
    expect(shell.legacyLeftEl.querySelector('#keychainOpts')).not.toBeNull();
    expect(shell.panelHost('llavero').querySelector('#keychain')).toBeNull();
    expect(document.querySelectorAll('#keychain').length).toBe(1);
    expect(document.querySelectorAll('#sectionShape').length).toBe(0);
    shell.dispose();
  });
});

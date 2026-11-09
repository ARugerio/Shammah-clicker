// @vitest-environment happy-dom
import '../../helpers/setupDom';
import { describe, it, expect, beforeEach } from 'vitest';
import { switchPanel } from '../../../src/ui/panels/switch';
import { makeCallbacks } from '../../fixtures/callbacks';
import { makeUiState } from '../../fixtures/uiState';
import { createUi } from '../../../src/ui/ui';
import { createShell } from '../../../src/ui/shell/shell';
import type { PanelHandle } from '../../../src/ui/shell/types';

let host: HTMLElement;
let calls: ReturnType<typeof makeCallbacks>['calls'];
let handle: PanelHandle;

const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;
const a = { x: 0, y: 0, rotation: 0 };
const b = { x: 2, y: -1.5, rotation: 6 };

beforeEach(() => {
  document.body.innerHTML = '';
  host = document.body.appendChild(document.createElement('div'));
  const made = makeCallbacks();
  calls = made.calls;
  handle = switchPanel.mount(host, made.cb);
});

describe('switchPanel', () => {
  it('se identifica como el panel switch', () => {
    expect(switchPanel.id).toBe('switch');
  });

  it('el selector de cantidad llama onSwitchCount', () => {
    host.querySelector<HTMLElement>('#switchCount [data-count="2"]')!.click();
    expect(calls.onSwitchCount).toEqual([[2]]);
  });

  it('con dos switches aparecen dos chips y el activo queda marcado', () => {
    handle.update(makeUiState({ switches: [a, b], activeSwitchIndex: 1 }));
    const chips = host.querySelectorAll<HTMLElement>('#switchChips [data-sw]');
    expect(chips.length).toBe(2);
    expect(chips[0].classList.contains('active')).toBe(false);
    expect(chips[1].classList.contains('active')).toBe(true);
    expect($('switchChips').style.display).toBe('flex');
    expect($('switchResetAll').style.display).toBe('block');
    expect($('switchReadout').textContent).toBe('S2 · X +2.0 · Y -1.5 mm  ·  ↺ 6°');
    expect(host.querySelector('#switchCount .active')!.getAttribute('data-count')).toBe('2');
  });

  it('pulsar un chip llama onActiveSwitch con su índice', () => {
    handle.update(makeUiState({ switches: [a, b], activeSwitchIndex: 1 }));
    host.querySelector<HTMLElement>('#switchChips [data-sw="0"]')!.click();
    expect(calls.onActiveSwitch).toEqual([[0]]);
  });

  it('con un solo switch oculta chips y reiniciar-todo y muestra Centrado', () => {
    handle.update(makeUiState({ switches: [a], activeSwitchIndex: 0 }));
    expect($('switchChips').style.display).toBe('none');
    expect($('switchResetAll').style.display).toBe('none');
    expect($('switchReadout').textContent).toBe('Centrado');
  });

  it('las flechas llaman onSwitchNudge con ±1 mm', () => {
    for (const d of ['up', 'down', 'left', 'right']) host.querySelector<HTMLElement>(`[data-dir="${d}"]`)!.click();
    expect(calls.onSwitchNudge).toEqual([[0, 1], [0, -1], [-1, 0], [1, 0]]);
  });

  it('los botones de rotar llaman onSwitchRotate', () => {
    host.querySelector<HTMLElement>('[data-rot="3"]')!.click();
    host.querySelector<HTMLElement>('[data-rot="-3"]')!.click();
    expect(calls.onSwitchRotate).toEqual([[3], [-3]]);
  });

  it('centrar y reiniciar posiciones llaman a sus callbacks', () => {
    $('switchReset').click();
    $('switchResetAll').click();
    expect(calls.onSwitchReset).toEqual([[]]);
    expect(calls.onSwitchResetAll).toEqual([[]]);
  });
});

describe('createUi y el panel Switch', () => {
  const mountUi = (withShell: boolean) => {
    document.body.innerHTML = '';
    const root = document.body.appendChild(document.createElement('div'));
    const shell = createShell(root);
    const { cb, calls } = makeCallbacks();
    const ui = createUi(shell.legacyLeftEl, shell.legacyRightEl, shell.statusEl, cb, withShell ? shell : undefined);
    ui.update(makeUiState({ switches: [a, b], activeSwitchIndex: 1 }));
    return { shell, calls };
  };

  it('con shell monta el panel en el dock y no deja copia en la barra antigua', () => {
    const { shell, calls } = mountUi(true);
    const dock = shell.panelHost('switch');
    expect(dock.querySelectorAll('#switchChips [data-sw]').length).toBe(2);
    expect(shell.legacyLeftEl.querySelector('#switchPad')).toBeNull();
    expect(document.querySelectorAll('#switchPad').length).toBe(1);
    dock.querySelector<HTMLElement>('#switchCount [data-count="3"]')!.click();
    expect(calls.onSwitchCount).toEqual([[3]]);
    shell.dispose();
  });

  it('sin shell monta el panel dentro de la barra izquierda', () => {
    const { shell } = mountUi(false);
    expect(shell.legacyLeftEl.querySelectorAll('#switchChips [data-sw]').length).toBe(2);
    expect(shell.panelHost('switch').querySelector('#switchPad')).toBeNull();
    expect(document.querySelectorAll('#switchPad').length).toBe(1);
    shell.dispose();
  });
});

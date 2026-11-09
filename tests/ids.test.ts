// @vitest-environment happy-dom
import './helpers/setupDom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';
import { createUi } from '../src/ui/ui';
import { createShell } from '../src/ui/shell/shell';
import { collectReferencedIds } from './helpers/idInventory';
import { makeCallbacks } from './fixtures/callbacks';
import { makeUiState } from './fixtures/uiState';

/**
 * IDs que el código busca pero que solo existen tras una interacción del usuario
 * (se crean bajo demanda). Cada uno lleva el motivo; no ampliar para ocultar fallos.
 */
const ON_DEMAND_IDS: Record<string, string> = {
  // Popover de color: showColorPopoverAt() lo crea al pulsar una muestra de color.
  sbColorPopover: 'popover de color, se crea al pulsar una muestra',
  // Asistente de recorte (src/ui/wizard.ts): su overlay solo existe mientras corre runWizard().
  wzCancel: 'botón del asistente de imagen, se crea al abrir el asistente',
};

beforeAll(() => {
  // index.html solo trae #shell-root; el esqueleto (con #app, #status y el dock) lo arma createShell.
  const shellRoot = document.body.appendChild(document.createElement('div'));
  shellRoot.id = 'shell-root';
  const shell = createShell(shellRoot);
  const { cb } = makeCallbacks();
  const ui = createUi(shell.statusEl, cb, shell);
  ui.update(makeUiState());
});

describe('IDs del DOM', () => {
  it('cada ID referenciado en src/ existe tras montar la interfaz', () => {
    const missing = collectReferencedIds().filter(
      (id) => !(id in ON_DEMAND_IDS) && !document.getElementById(id),
    );
    expect(missing).toEqual([]);
  });

  it('la lista permitida no contiene IDs que ya existen (se mantendría sin razón)', () => {
    const stale = Object.keys(ON_DEMAND_IDS).filter((id) => document.getElementById(id));
    expect(stale).toEqual([]);
  });

  it('no hay IDs duplicados', () => {
    const seen = new Map<string, number>();
    document.querySelectorAll('[id]').forEach((el) => seen.set(el.id, (seen.get(el.id) ?? 0) + 1));
    const dups = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
    expect(dups).toEqual([]);
  });
});

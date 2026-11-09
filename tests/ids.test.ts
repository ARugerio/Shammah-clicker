// @vitest-environment happy-dom
import './helpers/setupDom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';
import { createUi } from '../src/ui/ui';
import { collectReferencedIds } from './helpers/idInventory';
import { makeCallbacks } from './fixtures/callbacks';
import { makeUiState } from './fixtures/uiState';

/**
 * IDs que el código busca pero que solo existen tras una interacción del usuario
 * (se crean bajo demanda). Cada uno lleva el motivo; no ampliar para ocultar fallos.
 */
const ON_DEMAND_IDS: Record<string, string> = {
  // Ventana de aviso de actualización: showUpdateModal() la crea al cerrar la bienvenida.
  updateClose: 'botón del modal de novedades, se crea al abrirlo',
  updateDontShow: 'casilla del modal de novedades, se crea al abrirlo',
  // Tutorial guiado: cada paso reconstruye su tarjeta al iniciarse (showTutorial).
  tutPrev: 'botón de la tarjeta del tutorial, se crea al iniciar el tutorial',
  tutNext: 'botón de la tarjeta del tutorial, se crea al iniciar el tutorial',
  tutDontShow: 'casilla de la tarjeta del tutorial, se crea al iniciar el tutorial',
  // Pregunta "¿quieres el tutorial?" que aparece después de cerrar la bienvenida.
  tutPromptYes: 'botón del aviso del tutorial, se crea al mostrarlo',
  tutPromptNo: 'botón del aviso del tutorial, se crea al mostrarlo',
  // Popover de color: showColorPopoverAt() lo crea al pulsar una muestra de color.
  sbColorPopover: 'popover de color, se crea al pulsar una muestra',
  // Asistente de recorte (src/ui/wizard.ts): su overlay solo existe mientras corre runWizard().
  wzCancel: 'botón del asistente de imagen, se crea al abrir el asistente',
  // OJO: referencia muerta heredada. ui.ts hace getElementById('extrudeTooltip') pero
  // ningún HTML ni código crea ese elemento (el if lo vuelve inofensivo). No es bajo demanda.
  extrudeTooltip: 'referencia muerta preexistente: nada crea este elemento',
};

beforeAll(() => {
  const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
  const body = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)![1].replace(/<script[\s\S]*?<\/script>/g, '');
  document.body.innerHTML = body;
  const { cb } = makeCallbacks();
  const ui = createUi(
    document.getElementById('sidebar-left')!,
    document.getElementById('sidebar-right')!,
    document.getElementById('status')!,
    cb,
  );
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

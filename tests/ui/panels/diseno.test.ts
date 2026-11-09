// @vitest-environment happy-dom
import '../../helpers/setupDom';
import { describe, it, expect, beforeEach } from 'vitest';
import { disenoPanel, type DisenoHandle } from '../../../src/ui/panels/diseno';
import { makeCallbacks } from '../../fixtures/callbacks';
import { makeUiState } from '../../fixtures/uiState';
import { createUi } from '../../../src/ui/ui';
import { createShell } from '../../../src/ui/shell/shell';

let host: HTMLElement;
let calls: ReturnType<typeof makeCallbacks>['calls'];
let handle: DisenoHandle;

const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;
const SUBPANELS = { image: 'imagePanel', svg: 'svgPanel', icon: 'iconPanel', text: 'letterPanel' } as const;
type Mode = keyof typeof SUBPANELS;

beforeEach(() => {
  document.body.innerHTML = '';
  host = document.body.appendChild(document.createElement('div'));
  const made = makeCallbacks();
  calls = made.calls;
  handle = disenoPanel.mount(host, made.cb);
});

describe('disenoPanel', () => {
  it('se identifica como el panel diseno', () => {
    expect(disenoPanel.id).toBe('diseno');
  });

  for (const mode of Object.keys(SUBPANELS) as Mode[]) {
    it(`la tarjeta "${mode}" llama onImportMode y muestra solo su sub-panel`, () => {
      host.querySelector<HTMLElement>(`#importTabs [data-mode="${mode}"]`)!.click();
      expect(calls.onImportMode).toEqual([[mode]]);

      handle.update(makeUiState({ importMode: mode }));
      for (const [m, id] of Object.entries(SUBPANELS)) expect($(id).hidden).toBe(m !== mode);
      expect(host.querySelector('#importTabs .active')!.getAttribute('data-mode')).toBe(mode);
    });
  }

  it('escribir "Hola" en el campo de texto llama onTextChange("Hola")', () => {
    const text = $<HTMLTextAreaElement>('letterText');
    text.value = 'Hola';
    text.dispatchEvent(new Event('input'));
    expect(calls.onTextChange).toEqual([['Hola']]);
  });

  it('update() con el campo de texto enfocado conserva su valor y su foco', () => {
    handle.update(makeUiState({ importMode: 'text' }));
    const text = $<HTMLTextAreaElement>('letterText');
    text.focus();
    text.value = 'Hola';
    text.dispatchEvent(new Event('input'));
    expect(document.activeElement).toBe(text);

    handle.update(makeUiState({ importMode: 'text', status: 'Texto actualizado.' }));

    // El mismo nodo sigue en el panel (no se reconstruyó) con lo que el usuario escribió.
    expect($<HTMLTextAreaElement>('letterText')).toBe(text);
    expect(text.value).toBe('Hola');
    expect(document.activeElement).toBe(text);
  });

  it('"Eliminar fondo" es un paso de limpieza dentro del panel y llama onRemoveBg(true)', () => {
    const removebg = $<HTMLInputElement>('removebg');
    expect(removebg.closest('.cleanup-step')).not.toBeNull();
    removebg.checked = true;
    removebg.dispatchEvent(new Event('change'));
    expect(calls.onRemoveBg).toEqual([[true]]);
  });

  it('update() refleja removeBg en los dos interruptores de limpieza', () => {
    handle.update(makeUiState({ removeBg: false }));
    expect($<HTMLInputElement>('removebg').checked).toBe(false);
    expect($<HTMLInputElement>('removebgSvg').checked).toBe(false);
    handle.update(makeUiState({ removeBg: true }));
    expect($<HTMLInputElement>('removebg').checked).toBe(true);
    expect($<HTMLInputElement>('removebgSvg').checked).toBe(true);
  });

  it('elegir una muestra llama onSample con una función que devuelve una promesa', async () => {
    const sample = host.querySelector<HTMLElement>('#imagePanel .sample-inline-item');
    expect(sample).not.toBeNull();
    sample!.click();
    expect(calls.onSample).toHaveLength(1);
    const load = calls.onSample[0][0] as () => Promise<unknown>;
    expect(typeof load).toBe('function');
    const p = load();
    // En la prueba no hay red: la carga falla, pero debe ser una promesa.
    p.catch(() => {});
    expect(p).toBeInstanceOf(Promise);
  });

  it('addUploadedSvg agrega un elemento a la galería SVG y, con select, llama onSelectSvg', () => {
    const gallery = $('uploadGallery');
    expect(gallery.querySelectorAll('.icon').length).toBe(0);
    expect(gallery.querySelector('#uploadGalleryEmpty')).not.toBeNull();

    handle.addUploadedSvg('<svg/>', 'Muestra', false);
    expect(gallery.querySelectorAll('.icon').length).toBe(1);
    expect(gallery.querySelector('#uploadGalleryEmpty')).toBeNull();
    expect(calls.onSelectSvg).toBeUndefined();

    handle.addUploadedSvg('<svg id="b"/>', 'Logo');
    const items = gallery.querySelectorAll<HTMLElement>('.icon');
    expect(items.length).toBe(2);
    expect(calls.onSelectSvg).toEqual([['<svg id="b"/>', 'Logo']]);
    expect(items[1].classList.contains('active')).toBe(true);
  });

  it('addFontOption agrega la fuente a la rejilla y la selecciona', () => {
    const before = $('fontGrid').children.length;
    handle.addFontOption({ id: 'mi-fuente', name: 'Mi Fuente', font: {} as any });
    const grid = $('fontGrid');
    expect(grid.children.length).toBe(before + 1);
    expect(grid.lastElementChild!.textContent).toBe('Mi Fuente');
    expect(grid.lastElementChild!.classList.contains('active')).toBe(true);
    expect(calls.onFontSelect).toEqual([['mi-fuente']]);
  });

  it('pulsar una fuente de la rejilla llama onFontSelect', () => {
    const first = $('fontGrid').querySelector<HTMLElement>('.font-grid-btn')!;
    first.click();
    expect(calls.onFontSelect).toHaveLength(1);
    expect(first.classList.contains('active')).toBe(true);
  });

  it('la galería de iconos lista iconos y elegir uno llama onSelectIcon', () => {
    const icon = $('gallery').querySelector<HTMLElement>('.icon')!;
    expect(icon).not.toBeNull();
    icon.click();
    expect(calls.onSelectIcon).toHaveLength(1);
    expect(calls.onSelectIcon[0][1]).toBe(icon.title);
    expect($('iconCount').textContent).toMatch(/iconos/);
  });

  it('update() marca el icono actual de la galería', () => {
    handle.update(makeUiState({ importMode: 'icon', currentIconName: 'heart' }));
    const active = $('gallery').querySelectorAll('.icon.active');
    expect(active.length).toBe(1);
    expect(active[0].getAttribute('title')).toBe('heart');
  });

  it('los botones Generar llaman onGenerate', () => {
    for (const id of ['generateSvg', 'generateIcon', 'generateText']) $(id).click();
    expect(calls.onGenerate).toHaveLength(3);
  });
});

describe('createUi y el panel Diseño', () => {
  const mountUi = (withShell: boolean) => {
    document.body.innerHTML = '';
    const root = document.body.appendChild(document.createElement('div'));
    const shell = createShell(root);
    const { cb, calls } = makeCallbacks();
    const ui = createUi(shell.legacyLeftEl, shell.legacyRightEl, shell.statusEl, cb, withShell ? shell : undefined);
    ui.update(makeUiState({ importMode: 'svg' }));
    return { shell, calls, ui };
  };

  it('con shell monta el panel en el dock y no deja copia en la barra antigua', () => {
    const { shell, calls } = mountUi(true);
    const dock = shell.panelHost('diseno');
    expect(dock.querySelector('#importTabs')).not.toBeNull();
    expect(shell.legacyRightEl.querySelector('#importTabs')).toBeNull();
    for (const id of ['importTabs', 'letterText', 'removebg', 'fontGrid', 'gallery', 'uploadGallery']) {
      expect(document.querySelectorAll('#' + id).length).toBe(1);
    }
    expect(dock.querySelector<HTMLElement>('#svgPanel')!.hidden).toBe(false);
    dock.querySelector<HTMLElement>('#importTabs [data-mode="text"]')!.click();
    expect(calls.onImportMode).toEqual([['text']]);
    // El botón de exportación ya vive en su propio panel del dock (Task 8).
    expect(shell.legacyRightEl.querySelector('#export')).toBeNull();
    expect(shell.panelHost('exportar').querySelector('#export')).not.toBeNull();
    shell.dispose();
  });

  it('sin shell monta el panel en la barra derecha, antes del panel Exportar', () => {
    const { shell } = mountUi(false);
    const tabs = shell.legacyRightEl.querySelector('#importTabs');
    expect(tabs).not.toBeNull();
    expect(shell.panelHost('diseno').querySelector('#importTabs')).toBeNull();
    expect(document.querySelectorAll('#importTabs').length).toBe(1);
    const footer = shell.legacyRightEl.querySelector('#export')!;
    expect(tabs!.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    shell.dispose();
  });

  it('createUi sigue devolviendo addUploadedSvg y addFontOption, que delegan en el panel', () => {
    const { shell, calls, ui } = mountUi(true);
    ui.addUploadedSvg('<svg/>', 'Subido');
    expect(shell.panelHost('diseno').querySelectorAll('#uploadGallery .icon').length).toBe(1);
    expect(calls.onSelectSvg).toEqual([['<svg/>', 'Subido']]);
    ui.addFontOption({ id: 'f-x', name: 'Fuente X', font: {} as any });
    expect(calls.onFontSelect).toEqual([['f-x']]);
    shell.dispose();
  });
});

// @vitest-environment happy-dom
import '../helpers/setupDom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createShell } from '../../src/ui/shell/shell';
import type { PanelId, Shell } from '../../src/ui/shell/types';

const IDS: PanelId[] = ['forma', 'diseno', 'colores', 'switch', 'llavero', 'exportar'];
const LABELS = ['Forma', 'Diseño', 'Colores', 'Switch', 'Llavero', 'Exportar'];

let shell: Shell;
let root: HTMLElement;

const dockButtons = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.dock-btn'));
const visiblePanels = () => IDS.filter((id) => !shell.panelHost(id).closest<HTMLElement>('.dock-panel')!.hidden);

beforeEach(() => {
  document.body.innerHTML = '';
  root = document.createElement('div');
  document.body.appendChild(root);
  shell = createShell(root);
});

afterEach(() => shell.dispose());

describe('createShell', () => {
  it('crea seis botones de dock con etiqueta en español y aria-expanded=false', () => {
    const btns = dockButtons();
    expect(btns.map((b) => b.getAttribute('aria-label'))).toEqual(LABELS);
    btns.forEach((b) => expect(b.getAttribute('aria-expanded')).toBe('false'));
    expect(visiblePanels()).toEqual([]);
    expect(shell.openPanelId()).toBeNull();
  });

  it('expone contenedores y conserva los IDs y enlaces existentes', () => {
    expect(shell.viewportEl.querySelector('#app')).not.toBeNull();
    expect(shell.statusEl.id).toBe('status');
    expect(shell.viewportEl.contains(shell.viewerControlsEl)).toBe(true);
    expect(root.querySelector('#topbar')!.contains(shell.topbarActionsEl)).toBe(true);
    const hrefs = Array.from(root.querySelectorAll('#topbar a')).map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h?.includes('arugerio.github.io/Shammah3d'))).toBe(true);
    expect(hrefs.some((h) => h?.includes('api.whatsapp.com'))).toBe(true);
  });

  it('no quedan drawers provisionales ni sus botones', () => {
    expect(root.querySelector('aside')).toBeNull();
    expect(root.querySelector('[data-drawer], #sidebar-left, #sidebar-right, .legacy-drawer, .sidebar')).toBeNull();
    const labels = Array.from(root.querySelectorAll('#topbar button')).map((b) => b.textContent?.trim());
    expect(labels).not.toContain('Opciones');
    expect(labels).not.toContain('Ajustes');
  });

  it('openPanel muestra solo ese panel y marca su botón', () => {
    shell.openPanel('colores');
    expect(visiblePanels()).toEqual(['colores']);
    expect(shell.openPanelId()).toBe('colores');
    const expanded = dockButtons().filter((b) => b.getAttribute('aria-expanded') === 'true');
    expect(expanded.map((b) => b.getAttribute('aria-label'))).toEqual(['Colores']);
  });

  it('abrir otro panel cierra el anterior', () => {
    shell.openPanel('forma');
    shell.openPanel('llavero');
    expect(visiblePanels()).toEqual(['llavero']);
  });

  it('openPanel(null) cierra todo', () => {
    shell.openPanel('switch');
    shell.openPanel(null);
    expect(visiblePanels()).toEqual([]);
    dockButtons().forEach((b) => expect(b.getAttribute('aria-expanded')).toBe('false'));
  });

  it('Escape cierra el panel abierto', () => {
    shell.openPanel('exportar');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(shell.openPanelId()).toBeNull();
    expect(visiblePanels()).toEqual([]);
  });

  it('clic en el botón del panel abierto lo cierra; en otro botón lo abre', () => {
    const btns = dockButtons();
    btns[1].click();
    expect(shell.openPanelId()).toBe('diseno');
    btns[1].click();
    expect(shell.openPanelId()).toBeNull();
    btns[2].click();
    expect(shell.openPanelId()).toBe('colores');
  });

  it('ignora ids de panel desconocidos', () => {
    shell.openPanel('forma');
    shell.openPanel('nope' as PanelId);
    expect(shell.openPanelId()).toBe('forma');
  });

  it('tras dispose(), Escape ya no actúa en esa instancia', () => {
    const second = createShell(document.body.appendChild(document.createElement('div')));
    shell.dispose();
    shell.openPanel('forma');
    second.openPanel('colores');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(second.openPanelId()).toBeNull();
    expect(shell.openPanelId()).toBe('forma');
    second.dispose();
  });
});

import type { BaseShapeKind, EditMode, EdgeSetting, EdgeStyle, KeychainParams, PaletteEntry, SwitchPlacement, ViewMode, RGB } from '../types';
import type { SectionAxis } from '../viewer/viewer';
import type { RgbaImage } from '../image/decode';
import type { FontOption } from '../image/letter';
import type { Shell } from './shell/types';
import { formaPanel } from './panels/forma';
import { switchPanel } from './panels/switch';
import { coloresPanel, mountColorViewportTools } from './panels/colores';
import { disenoPanel } from './panels/diseno';
import { llaveroPanel } from './panels/llavero';
import { exportarPanel } from './panels/exportar';
import { mountViewerControls } from './viewer-controls/viewerControls';
import { mountTopbarActions } from './shell/topbarActions';
import { mountHints } from './hints/hints';
import { hexRgb, showColorPopoverAt } from './shared/colorPopover';

export interface UiState {
  status: string;
  building: boolean;
  hasParts: boolean;
  colorCount: number;
  palette: PaletteEntry[];
  baseShape: BaseShapeKind;
  capWidthMm: number;
  topThickness: number;
  imageDepth: number;
  tolerance: number;
  stemTolerance: number;
  switches: SwitchPlacement[];
  activeSwitchIndex: number;
  smoothing: number;
  keychain: KeychainParams;
  removeBg: boolean;
  view: ViewMode;
  showSwitch: boolean;
  importMode: 'image' | 'svg' | 'icon' | 'text';
  currentIconName: string;
  colorMode: 'normal' | 'limited';
  limitedColors: RGB[];
  bodyColorRgb: RGB;
  paletteOverrides: RGB[];
  baseColorOverride: RGB | null;
  partOverrides: Record<string, RGB>;
  editMode: EditMode;
  edgeSettings: EdgeSetting[];
  extrudeChamfer: boolean;
  separateLetters: boolean;
  extrudeHeight: number | null;
  componentHeights: Record<string, number>;
  selectedParts: string[];
  canUndo: boolean;
  canRedo: boolean;
  canRefresh: boolean;
}

export interface UiCallbacks {
  onUpload(file: File): void;
  onSample(load: () => Promise<RgbaImage>): void;
  onColorCount(n: number): void;
  onSmoothing(v: number): void;
  onFilament(index: number, hex: string): void;
  onShape(kind: BaseShapeKind): void;
  onWidth(mm: number): void;
  onTopThickness(mm: number): void;
  onImageDepth(mm: number): void;
  onSocketTolStep(delta: number): void;
  onStemTolStep(delta: number): void;
  onSwitchNudge(dx: number, dy: number): void;
  onSwitchRotate(deltaDeg: number): void;
  onSwitchReset(): void;
  onSwitchCount(n: number): void;
  onActiveSwitch(i: number): void;
  onSwitchResetAll(): void;
  onKeychainToggle(on: boolean): void;
  onKeychainRotate(deltaDeg: number): void;
  onKeychainSize(deltaMm: number): void;
  onKeychainOffset(deltaMm: number): void;
  onRemoveBg(on: boolean): void;
  onView(mode: ViewMode): void;
  onShowSwitch(on: boolean): void;
  onSection(axis: SectionAxis, pos: number): void;
  onExport(): void;
  onRenderPng(): void;
  onAiPrompt(): void;
  onSaveProject(): void;
  onLoadProject(file: File): void;
  onBodyColor(hex: string): void;
  onImportMode(mode: 'image' | 'svg' | 'icon' | 'text'): void;
  onSvgUpload(file: File): void;
  onSelectSvg(svgText: string, name: string): void;
  onSelectIcon(svgText: string, name: string): void;
  onTextChange(text: string): void;
  onFontSelect(fontId: string): void;
  onImportFont(file: File): void;
  onThemeChange(theme: string): void;
  onEditMode(mode: EditMode): void;
  onEdgeStyle(target: string, style: EdgeStyle): void;
  onEdgeStep(target: string, delta: number): void;
  onExtrudeStep(delta: number): void;
  onExtrudeChamfer(on: boolean): void;
  onSeparateLetters(on: boolean): void;
  onGenerate(): void;
  onUndo(): void;
  onRedo(): void;
  onRefresh(): void;
}

export function createUi(
  statusEl: HTMLElement,
  cb: UiCallbacks,
  shell: Shell,
  opts?: { onExplosion?: (t: number) => void },
) {
  // Cada panel vive en su hoja del dock.
  const forma = formaPanel.mount(shell.panelHost('forma'), cb);
  const switchH = switchPanel.mount(shell.panelHost('switch'), cb);
  const llavero = llaveroPanel.mount(shell.panelHost('llavero'), cb);
  const colores = coloresPanel.mount(shell.panelHost('colores'), cb);
  const diseno = disenoPanel.mount(shell.panelHost('diseno'), cb);
  const exportar = exportarPanel.mount(shell.panelHost('exportar'), cb);

  // Acciones de la barra superior (historial, proyecto, ayuda, tema). Ayuda reabre las pistas.
  const hints = mountHints(shell.dockEl);
  const topbar = mountTopbarActions(shell.topbarActionsEl, cb, { onHelp: () => hints.show() });

  // Soltar un archivo en cualquier parte de la ventana lo enruta según su tipo. Se queda aquí
  // (no en el panel Diseño) porque es global a la app y los paneles no tienen desmontaje.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    if (f.name.endsWith('.svg')) cb.onSvgUpload(f);
    else if (f.name.endsWith('.ttf') || f.name.endsWith('.otf') || f.name.endsWith('.json')) cb.onImportFont(f);
    else if (f.type.startsWith('image/')) cb.onUpload(f);
  });

  const viewport = shell.viewportEl;
  const overlay = document.createElement('div');
  overlay.id = 'loadingOverlay';
  overlay.className = 'loading-overlay';
  overlay.setAttribute('hidden', '');
  overlay.innerHTML = `<div class="loading-spinner"></div><div class="loading-text">Calculando geometría 3D...</div>`;
  viewport.appendChild(overlay);

  // Relieve y bisel: flotan sobre el visor porque reaccionan a las piezas elegidas en 3D.
  const viewportTools = mountColorViewportTools(viewport, cb);

  // Controles del visor (explosión y ojo del switch).
  const viewerControls = opts?.onExplosion ? mountViewerControls(shell.viewerControlsEl, cb, opts.onExplosion) : null;

  const tipBubble = document.createElement('div');
  tipBubble.className = 'help-tip-bubble';
  tipBubble.hidden = true;
  document.body.appendChild(tipBubble);

  const showTip = (marker: HTMLElement) => {
    const text = marker.getAttribute('data-tip');
    if (!text) return;
    tipBubble.textContent = text;
    tipBubble.hidden = false;
    const r = marker.getBoundingClientRect();
    const bw = tipBubble.offsetWidth;
    const bh = tipBubble.offsetHeight;
    let left = r.left;
    if (left + bw > window.innerWidth - 8) left = window.innerWidth - bw - 8;
    left = Math.max(8, left);
    let top = r.bottom + 8;
    if (top + bh > window.innerHeight - 8) top = r.top - bh - 8;
    tipBubble.style.left = `${left}px`;
    tipBubble.style.top = `${Math.max(8, top)}px`;
  };
  const hideTip = () => { tipBubble.hidden = true; };

  document.addEventListener('mouseover', (e) => {
    const marker = (e.target as HTMLElement).closest('.help-tip') as HTMLElement | null;
    if (marker) showTip(marker);
  });
  document.addEventListener('mouseout', (e) => {
    if ((e.target as HTMLElement).closest('.help-tip')) hideTip();
  });
  document.addEventListener('focusin', (e) => {
    const marker = (e.target as HTMLElement).closest('.help-tip') as HTMLElement | null;
    if (marker) showTip(marker);
  });
  document.addEventListener('focusout', (e) => {
    if ((e.target as HTMLElement).closest('.help-tip')) hideTip();
  });

  function update(state: UiState) {
    statusEl.innerHTML = (state.building ? '<span class="spinner"></span> ' : '') + state.status;
    forma.update(state);
    switchH.update(state);
    llavero.update(state);
    colores.update(state);
    diseno.update(state);
    exportar.update(state);
    topbar.update(state);
    viewportTools.update(state);
    viewerControls?.update(state);

    if (state.building) {
      overlay.removeAttribute('hidden');
      const textEl = overlay.querySelector('.loading-text');
      if (textEl) textEl.textContent = state.status;
    } else {
      overlay.setAttribute('hidden', '');
    }
  }

  return {
    update,
    hexRgb,
    showColorPopoverAt,
    addUploadedSvg: (svgText: string, name: string, select = true) => diseno.addUploadedSvg(svgText, name, select),
    // Agrega la fuente importada y la selecciona (pulsa su botón).
    addFontOption: (font: FontOption) => diseno.addFontOption(font),
  };
}

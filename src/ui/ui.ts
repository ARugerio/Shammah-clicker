import type { BaseShapeKind, EditMode, EdgeSetting, EdgeStyle, KeychainParams, PaletteEntry, SwitchPlacement, ViewMode, RGB } from '../types';
import type { SectionAxis } from '../viewer/viewer';
import type { RgbaImage } from '../image/decode';
import type { FontOption } from '../image/letter';
import { FONT_OPTIONS, loadBundledFonts } from '../image/letter';
import { LUCIDE_ICONS, buildSvg, svgDataUrl } from '../image/lucideIcons';
import type { PanelHandle, Shell } from './shell/types';
import { formaPanel } from './panels/forma';
import { switchPanel } from './panels/switch';
import { coloresPanel, mountColorViewportTools } from './panels/colores';
import { tip } from './shared/controls';
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

const POPULAR_LUCIDE = [
  'copy', 'clipboard', 'clipboard-paste', 'scissors', 'trash-2', 'save',
  'file', 'files', 'folder', 'folder-open', 'archive', 'download', 'upload',
  'undo-2', 'redo-2', 'search', 'replace', 'eraser', 'pencil', 'type',
  'bold', 'italic', 'underline',
  'home', 'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right',
  'corner-down-left', 'chevron-up', 'chevron-down',
  'keyboard', 'mouse', 'command', 'delete',
  'play', 'pause', 'skip-back', 'skip-forward', 'volume-2', 'volume-x',
  'mic', 'mic-off', 'music', 'headphones',
  'sun', 'moon', 'monitor', 'lock', 'unlock', 'eye', 'eye-off',
  'power', 'wifi', 'bluetooth', 'battery',
  'terminal', 'code', 'settings', 'bell', 'calendar', 'mail',
  'message-circle', 'phone', 'camera', 'image',
  'star', 'heart', 'circle', 'bookmark', 'flag', 'check', 'x', 'plus', 'minus',
  'refresh-cw', 'rotate-cw', 'flame', 'zap', 'rocket', 'ghost', 'skull',
  'coffee', 'gamepad-2', 'trophy', 'crown',
];

export function createUi(
  sidebarLeft: HTMLElement,
  sidebarRight: HTMLElement,
  statusEl: HTMLElement,
  cb: UiCallbacks,
  shell?: Shell
) {
  // Barra Lateral Izquierda
  sidebarLeft.innerHTML = `
    <div class="app-header">
      <h1>SHAMMAH Clicker Studio</h1>
      <p class="app-subtitle">Genera modelos 3D listos para tu Bambu Lab P2S</p>
      <p class="app-credit">Plataforma operada por
        <a class="app-credit-link" href="#" target="_blank" rel="noopener noreferrer">
          SHAMMAH CREA 3D
        </a>
      </p>
    </div>

    <div class="section" id="previewViewSection">
      <span class="label">Previsualización</span>
      <div class="tabs" id="viewTabs" role="tablist" style="margin-bottom: 12px;">
        <button class="tab active" data-view="assembled" type="button">Ensamblado</button>
        <button class="tab" data-view="exploded" type="button">Despiezado</button>
      </div>
      <div class="switch-row">
        <span class="switch-label">Mostrar switch MX ${tip('Muestra un interruptor MX de referencia. No se exportará al modelo 3MF.')}</span>
        <label class="toggle"><input id="showswitch" type="checkbox" /><span class="slider"></span></label>
      </div>
    </div>

    <div id="geometrySettingsContainer">
      <details class="section section-collapsible" id="sectionShape">
        <summary class="label collapsible-head">2 · Ajustes y Tolerancias P2S</summary>
        <div class="collapsible-body">
        <div class="keychain-panel" style="margin-bottom: 16px;">
          <div class="switch-row" style="margin-bottom: 12px;">
            <span class="switch-label">Llavero ${tip('Agrega un aro para enganchar tu clicker a las llaves.')}</span>
            <label class="toggle"><input id="keychain" type="checkbox" /><span class="slider"></span></label>
          </div>
          <div id="keychainOpts" style="display:none;">
            <div class="prow-stacked">
              <div class="prow-header"><label>Posición del aro</label></div>
              <div class="tol-stepper" id="keychainRotStepper">
                <button class="btn" id="keychainRotMinus" type="button">⟲</button>
                <span class="tol-val" id="keychainAngleVal">90°</span>
                <button class="btn" id="keychainRotPlus" type="button">⟳</button>
              </div>
            </div>
            <div class="prow-stacked">
              <div class="prow-header"><label>Deslizamiento (offset)</label></div>
              <div class="tol-stepper" id="keychainOffsetStepper">
                <button class="btn" id="keychainOffsetMinus" type="button">−</button>
                <span class="tol-val" id="keychainOffsetVal">0.0 mm</span>
                <button class="btn" id="keychainOffsetPlus" type="button">+</button>
              </div>
            </div>
            <div class="prow-stacked">
              <div class="prow-header"><label>Tamaño del agujero</label></div>
              <div class="tol-stepper" id="keychainSizeStepper">
                <button class="btn" id="keychainSizeMinus" type="button">−</button>
                <span class="tol-val" id="keychainSizeVal">5.2 mm</span>
                <button class="btn" id="keychainSizePlus" type="button">+</button>
              </div>
            </div>
          </div>
        </div>

        </div>
      </details>
    </div>

    <div class="sidebar-sticky-footer">
      <div class="btn-row" id="historyControls">
        <button id="undoBtn" class="secondary" type="button" title="Deshacer (Ctrl+Z)" disabled style="display: flex; justify-content: center; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>
        </button>
        <button id="refreshBtn" class="secondary" type="button" title="Revertir a Original" disabled style="display: flex; justify-content: center; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <button id="redoBtn" class="secondary" type="button" title="Rehacer (Ctrl+Shift+Z)" disabled style="display: flex; justify-content: center; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>
        </button>
      </div>
    </div>
  `;

  // Barra Lateral Derecha
  sidebarRight.innerHTML = `
    <div class="section legend-section">
      <span class="label">Origen de Importación</span>
      <div class="import-grid" id="importTabs" role="tablist">
        <button class="import-card active" data-mode="image" type="button">
          <span class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </span>
          <span class="card-label">Imagen</span>
        </button>
        <button class="import-card" data-mode="svg" type="button">
          <span class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </span>
          <span class="card-label">SVG</span>
        </button>
        <button class="import-card" data-mode="icon" type="button">
          <span class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </span>
          <span class="card-label">Icono</span>
        </button>
        <button class="import-card" data-mode="text" type="button">
          <span class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 7 4 4 20 4 20 7"/>
              <line x1="9" y1="20" x2="15" y2="20"/>
              <line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
          </span>
          <span class="card-label">Texto</span>
        </button>
      </div>

      <div id="imagePanel" class="mode-panel">
        <div class="drop" id="drop">
          <svg class="drop-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div class="drop-title">Cargar Imagen</div>
          <div class="drop-text">Arrastra una imagen o <u>clic para buscar</u></div>
          <span style="font-size:10px; opacity:0.8; display:block; margin-top:4px;">Preferentemente PNG con fondo transparente</span>
        </div>
        <input type="file" id="file" accept="image/*" hidden />
        <div class="switch-row">
          <span class="switch-label">Eliminar fondo (IA)</span>
          <label class="toggle"><input id="removebg" type="checkbox" /><span class="slider"></span></label>
        </div>
      </div>

      <div id="svgPanel" class="mode-panel" hidden>
        <p class="hint-text">Arrastra o sube archivos vectoriales SVG.</p>
        <div id="uploadGallery"></div>
        <label class="upload-cta">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Cargar archivo(s) SVG
          <input id="svgUpload" type="file" accept=".svg,image/svg+xml" multiple />
        </label>
        <div class="switch-row">
          <span class="switch-label">Eliminar fondo SVG</span>
          <label class="toggle"><input id="removebgSvg" type="checkbox" /><span class="slider"></span></label>
        </div>
        <button class="primary" id="generateSvg" style="margin-top: 10px; width: 100%;">Generar Geometría</button>
      </div>

      <div id="iconPanel" class="mode-panel" hidden>
        <div id="iconSearchWrap">
          <input id="iconSearch" type="search" placeholder="Buscar iconos libres…" autocomplete="off" spellcheck="false" />
          <button id="iconSearchClear" type="button">×</button>
        </div>
        <div id="iconCount"></div>
        <div id="gallery"></div>
        <button class="primary" id="generateIcon" style="margin-top: 10px; width: 100%;">Generar Geometría</button>
      </div>

      <div id="letterPanel" class="mode-panel" hidden>
        <div class="field">
          <label for="letterText">Texto Personalizado</label>
          <textarea id="letterText" rows="2" maxlength="30" autocomplete="off" spellcheck="false" style="width: 100%; resize: vertical; min-height: 48px;">SHAMMAH\nCREA</textarea>
        </div>
        <div class="field">
          <label>Tipografía</label>
          <div id="fontGrid" class="font-grid"></div>
          <label class="upload">
            + Importar fuente local
            <input id="fontUpload" type="file" accept=".ttf,.otf,.json,font/ttf,font/otf,application/json" />
          </label>
        </div>
        <button class="primary" id="generateText" style="margin-top: 10px; width: 100%;">Generar Geometría</button>
      </div>
    </div>

    <div class="sidebar-sticky-footer">
      <button class="primary" id="export" style="width:100%; font-size:15px; background-color:#10b981; border:none; border-radius:6px; font-weight:700;">Descargar 3MF (Bambu Studio)</button>
      <div id="projectSettingsContainer">
        <div class="btn-row">
          <button id="saveProj" class="secondary utility-btn" type="button" aria-label="Guardar proyecto">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span>Guardar</span>
          </button>
          <button id="loadProj" class="secondary utility-btn" type="button" aria-label="Cargar proyecto">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Cargar</span>
          </button>
          <input type="file" id="projFile" accept="application/json" hidden />
        </div>
        <div class="btn-row footer-utility-row">
          <button id="helpToggle" class="secondary utility-btn" type="button" aria-label="Mostrar ayuda">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Ayuda</span>
          </button>
          <button id="themeToggle" class="secondary utility-btn" type="button" aria-label="Alternar tema">
            <svg class="icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            <svg class="icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <span id="themeLabel">Modo oscuro</span>
          </button>
        </div>
      </div>
      <p class="sidebar-credit">Motor base: Vostok Labs · Herramienta personalizada por SHAMMAH 3D</p>
    </div>
  `;

  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

  // Panel Forma: con `shell` vive en el dock; sin él (contrato antiguo) se monta en un
  // contenedor dentro de la barra izquierda, en el mismo sitio donde estaba antes.
  let formaHost: HTMLElement;
  if (shell) formaHost = shell.panelHost('forma');
  else {
    formaHost = document.createElement('div');
    sidebarLeft.insertBefore(formaHost, $('geometrySettingsContainer'));
  }
  const forma = formaPanel.mount(formaHost, cb);

  // Panel Switch: igual que Forma; en el contrato antiguo ocupa el final de la zona de geometría.
  let switchHost: HTMLElement;
  if (shell) switchHost = shell.panelHost('switch');
  else {
    switchHost = document.createElement('div');
    $('geometrySettingsContainer').appendChild(switchHost);
  }
  const switchH = switchPanel.mount(switchHost, cb);

  // Panel Colores (colores, suavizado, paleta y biselados de tapa y base). Sin `shell`
  // ocupa el inicio de la zona de geometría, donde estaba "1 · Colores y Suavizado".
  let coloresHost: HTMLElement;
  if (shell) coloresHost = shell.panelHost('colores');
  else {
    coloresHost = document.createElement('div');
    const geo = $('geometrySettingsContainer');
    geo.insertBefore(coloresHost, geo.firstChild);
  }
  const colores = coloresPanel.mount(coloresHost, cb);

  $('undoBtn')?.addEventListener('click', () => cb.onUndo());
  $('redoBtn')?.addEventListener('click', () => cb.onRedo());
  $('refreshBtn')?.addEventListener('click', () => cb.onRefresh());

  const drop = $('drop');
  const file = $<HTMLInputElement>('file');
  drop.addEventListener('click', () => file.click());
  file.addEventListener('change', () => {
    if (file.files?.[0]) cb.onUpload(file.files[0]);
  });
  drop.addEventListener('dragenter', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', () => drop.classList.remove('over'));
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    if (f.name.endsWith('.svg')) cb.onSvgUpload(f);
    else if (f.name.endsWith('.ttf') || f.name.endsWith('.otf') || f.name.endsWith('.json')) cb.onImportFont(f);
    else if (f.type.startsWith('image/')) cb.onUpload(f);
  });

  $<HTMLInputElement>('removebg').addEventListener('change', (e) => cb.onRemoveBg((e.target as HTMLInputElement).checked));
  $<HTMLInputElement>('removebgSvg').addEventListener('change', (e) => cb.onRemoveBg((e.target as HTMLInputElement).checked));

  const svgUpload = $<HTMLInputElement>('svgUpload');
  svgUpload.addEventListener('change', () => {
    const f = svgUpload.files?.[0];
    if (f) cb.onSvgUpload(f);
    svgUpload.value = '';
  });

  const uploadGalleryEl = $('uploadGallery');
  let uploadEmptyEl: HTMLElement | null = null;
  function refreshUploadEmptyState() {
    const empty = uploadGalleryEl.querySelectorAll('.icon').length === 0;
    if (empty && !uploadEmptyEl) {
      uploadEmptyEl = document.createElement('div');
      uploadEmptyEl.id = 'uploadGalleryEmpty';
      uploadEmptyEl.textContent = 'Sin archivos SVG. Arrastra archivos o usa el botón.';
      uploadGalleryEl.appendChild(uploadEmptyEl);
    } else if (!empty && uploadEmptyEl) {
      uploadEmptyEl.remove();
      uploadEmptyEl = null;
    }
  }
  refreshUploadEmptyState();

  function makeIconEl(thumbUrl: string, name: string, onClick: (el: HTMLElement) => void) {
    const el = document.createElement('div');
    el.className = 'icon';
    el.title = name;
    const img = document.createElement('img');
    img.src = thumbUrl;
    img.alt = name;
    el.appendChild(img);
    el.addEventListener('click', () => onClick(el));
    return el;
  }

  function addUploadedSvg(svgText: string, name: string, select = true) {
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const el = makeIconEl(url, name, (clickedEl) => {
      uploadGalleryEl.querySelectorAll('.icon').forEach((n) => n.classList.remove('active'));
      clickedEl.classList.add('active');
      cb.onSelectSvg(svgText, name);
    });
    uploadGalleryEl.appendChild(el);
    refreshUploadEmptyState();
    if (select) el.click();
  }

  const galleryEl = $('gallery');
  const searchEl = $<HTMLInputElement>('iconSearch');
  const searchClearEl = $<HTMLButtonElement>('iconSearchClear');
  const countEl = $('iconCount');

  const GALLERY_PAGE = 240;
  let lucideShown = 0;
  let lucideMatches: any[] = [];
  let moreBtn: HTMLButtonElement | null = null;

  function rankLucide(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) {
      const popularSet = new Set(POPULAR_LUCIDE);
      const popular = POPULAR_LUCIDE.map((name) => LUCIDE_ICONS.find((ic) => ic.name === name)).filter(Boolean);
      const rest = LUCIDE_ICONS.filter((ic) => !popularSet.has(ic.name));
      return popular.concat(rest);
    }
    const out: { ic: any; rank: number }[] = [];
    for (const ic of LUCIDE_ICONS) {
      const i = ic.name.indexOf(q);
      if (i === -1) continue;
      const rank = ic.name === q ? 0 : i === 0 ? 1 : 2;
      out.push({ ic, rank });
    }
    out.sort((a, b) => a.rank - b.rank || a.ic.name.localeCompare(b.ic.name));
    return out.map((o) => o.ic);
  }

  function renderLucidePage() {
    if (moreBtn) { moreBtn.remove(); moreBtn = null; }
    const end = Math.min(lucideShown + GALLERY_PAGE, lucideMatches.length);
    const frag = document.createDocumentFragment();
    for (let i = lucideShown; i < end; i++) {
      const ic = lucideMatches[i];
      const svgText = buildSvg(ic.node);
      const el = makeIconEl(svgDataUrl(svgText), ic.name, (clickedEl) => {
        galleryEl.querySelectorAll('.icon').forEach((n) => n.classList.remove('active'));
        clickedEl.classList.add('active');
        cb.onSelectIcon(svgText, ic.name);
      });
      frag.appendChild(el);
    }
    galleryEl.appendChild(frag);
    lucideShown = end;

    if (lucideShown < lucideMatches.length) {
      moreBtn = document.createElement('button');
      moreBtn.id = 'galleryMore';
      moreBtn.type = 'button';
      moreBtn.textContent = `Mostrar ${Math.min(GALLERY_PAGE, lucideMatches.length - lucideShown)} más (${lucideMatches.length - lucideShown} ocultos)`;
      moreBtn.addEventListener('click', renderLucidePage);
      galleryEl.appendChild(moreBtn);
    }
    updateCount();
  }

  function updateCount() {
    const total = lucideMatches.length;
    if (total === 0) {
      countEl.textContent = 'Sin resultados.';
    } else {
      const visible = Math.min(lucideShown, total);
      countEl.textContent = `${total} iconos` + (visible < total ? ` · mostrando ${visible}` : '');
    }
  }

  function rebuildGallery() {
    galleryEl.innerHTML = '';
    lucideShown = 0;
    lucideMatches = rankLucide(searchEl.value);
    searchClearEl.style.display = searchEl.value ? 'block' : 'none';
    renderLucidePage();
  }

  let searchTimer: number | null = null;
  searchEl.addEventListener('input', () => {
    if (searchTimer !== null) clearTimeout(searchTimer);
    searchTimer = window.setTimeout(rebuildGallery, 80);
  });
  searchClearEl.addEventListener('click', () => {
    searchEl.value = '';
    rebuildGallery();
    searchEl.focus();
  });
  rebuildGallery();

  const letterText = $<HTMLTextAreaElement>('letterText');
  const fontGrid = $('fontGrid');
  const fontUpload = $<HTMLInputElement>('fontUpload');
  let selectedFontBtn: HTMLElement | null = null;

  letterText.addEventListener('input', () => cb.onTextChange(letterText.value));
  fontUpload.addEventListener('change', () => {
    const f = fontUpload.files?.[0];
    if (f) cb.onImportFont(f);
    fontUpload.value = '';
  });

  function addFontOption(font: FontOption) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'font-grid-btn';
    btn.textContent = font.name;
    btn.style.fontFamily = `"${font.id.replace('bundled-', '')}", "${font.name}", sans-serif`;
    
    btn.addEventListener('click', () => {
      if (selectedFontBtn) selectedFontBtn.classList.remove('active');
      btn.classList.add('active');
      selectedFontBtn = btn;
      cb.onFontSelect(font.id);
    });
    fontGrid.appendChild(btn);
  }

  FONT_OPTIONS.forEach(addFontOption);
  loadBundledFonts(addFontOption);

  $('generateSvg').addEventListener('click', () => cb.onGenerate());
  $('generateIcon').addEventListener('click', () => cb.onGenerate());
  $('generateText').addEventListener('click', () => cb.onGenerate());

  const viewport = $('viewport');
  let viewportTools: PanelHandle | null = null;
  if (viewport) {
    let overlay = $('loadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.setAttribute('hidden', '');
      overlay.innerHTML = `<div class="loading-spinner"></div><div class="loading-text">Calculando geometría 3D...</div>`;
      viewport.appendChild(overlay);
    }

    // Relieve y bisel: flotan sobre el visor porque reaccionan a las piezas elegidas en 3D.
    viewportTools = mountColorViewportTools(viewport, cb);
  }

  const importTabs = $('importTabs');
  importTabs.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('[data-mode]') as HTMLElement | null;
    if (t) cb.onImportMode(t.dataset.mode as any);
  });

  const keychain = $<HTMLInputElement>('keychain');
  keychain.addEventListener('change', () => cb.onKeychainToggle(keychain.checked));
  $('keychainRotMinus').addEventListener('click', () => cb.onKeychainRotate(-15));
  $('keychainRotPlus').addEventListener('click', () => cb.onKeychainRotate(15));
  $('keychainOffsetMinus').addEventListener('click', () => cb.onKeychainOffset(-1.0));
  $('keychainOffsetPlus').addEventListener('click', () => cb.onKeychainOffset(1.0));
  $('keychainSizeMinus').addEventListener('click', () => cb.onKeychainSize(-0.4));
  $('keychainSizePlus').addEventListener('click', () => cb.onKeychainSize(0.4));

  const viewTabs = $('viewTabs');
  viewTabs.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('[data-view]') as HTMLElement | null;
    if (t) cb.onView(t.dataset.view as ViewMode);
  });
  $<HTMLInputElement>('showswitch').addEventListener('change', (e) => cb.onShowSwitch((e.target as HTMLInputElement).checked));

  $('export').addEventListener('click', () => cb.onExport());
  $('saveProj').addEventListener('click', () => cb.onSaveProject());
  const projFile = $<HTMLInputElement>('projFile');
  $('loadProj').addEventListener('click', () => projFile.click());
  projFile.addEventListener('change', () => {
    if (projFile.files?.[0]) cb.onLoadProject(projFile.files[0]);
    projFile.value = '';
  });

  const themeLabel = $('themeLabel');
  const syncThemeLabel = () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    themeLabel.textContent = isLight ? 'Modo Oscuro' : 'Modo Claro';
  };
  syncThemeLabel();
  $('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    cb.onThemeChange(current === 'light' ? 'dark' : 'light');
    syncThemeLabel();
  });

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

  function showWelcome() {
    if (document.querySelector('.welcome-overlay')) return;
    const wm = document.createElement('div');
    wm.className = 'welcome-overlay';
    wm.innerHTML = `
      <div class="welcome-card">
        <h2>Bienvenido a SHAMMAH Clicker Studio 👋</h2>
        <p>Convierte cualquier imagen, icono o texto en un clicker 3D multicolor listo para tu impresora.</p>
        <div class="welcome-steps">
          <div class="welcome-step">
            <div class="welcome-step-num">1</div>
            <div class="welcome-step-text">
              <strong>Importa tu diseño</strong>
              <span>Sube una imagen, carga un vector SVG o escribe tu propio texto.</span>
            </div>
          </div>
          <div class="welcome-step">
            <div class="welcome-step-num">2</div>
            <div class="welcome-step-text">
              <strong>Configura la pieza</strong>
              <span>Asigna colores del AMS, elige la forma base, el tamaño y ajusta relieves.</span>
            </div>
          </div>
          <div class="welcome-step">
            <div class="welcome-step-num">3</div>
            <div class="welcome-step-text">
              <strong>Exportar a Bambu Studio</strong>
              <span>Descarga el archivo 3MF con las piezas pintadas y listas para laminar.</span>
            </div>
          </div>
        </div>
        <div class="welcome-foot">
          <button class="primary" id="welcomeClose" style="min-width:150px; background-color:#10b981;">Comenzar a diseñar →</button>
        </div>
      </div>
    `;
    document.body.appendChild(wm);
    const close = () => { wm.remove(); showUpdate(); };
    wm.querySelector('#welcomeClose')!.addEventListener('click', close);
    wm.addEventListener('click', (e) => { if (e.target === wm) close(); });
  }

  const UPDATE_KEY = 'clicker_update_dismissed_2026_08';

  function continueAfterWelcome() {
    if (localStorage.getItem('clicker_tutorial_dismissed') !== 'true') showTutorial();
  }

  function showUpdate() {
    if (localStorage.getItem(UPDATE_KEY) === 'true') { continueAfterWelcome(); return; }
    if (document.querySelector('.welcome-overlay')) return;
    const wm = document.createElement('div');
    wm.className = 'welcome-overlay';
    const check = `<svg class="whats-new-check" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    wm.innerHTML = `
      <div class="welcome-card whats-new-card">
        <div class="whats-new-badge">Novedades</div>
        <h2>Últimas actualizaciones ✨</h2>
        <p>Mejoras activas para tu flujo de impresión 3D:</p>
        <ul class="whats-new-list">
          <li>${check}<span><strong>Trazado ultra-fino</strong>: Suavizado inteligente para no perder detalles pequeños de las imágenes.</span></li>
          <li>${check}<span><strong>Múltiples Switches</strong>: Agrega hasta 3 switches MX para clickers grandes y ajústalos de forma independiente.</span></li>
          <li>${check}<span><strong>Módulo de Llavero</strong>: Integración paramétrica de aro con offset y tamaño deslizable.</span></li>
        </ul>
        <div class="whats-new-foot">
          <label class="whats-new-dismiss">
            <input type="checkbox" id="updateDontShow" />
            No mostrar de nuevo
          </label>
          <button class="primary" id="updateClose" style="min-width:130px; background-color:#10b981;">Entendido →</button>
        </div>
      </div>
    `;
    document.body.appendChild(wm);
    const dontShow = wm.querySelector('#updateDontShow') as HTMLInputElement;
    const close = () => {
      if (dontShow.checked) localStorage.setItem(UPDATE_KEY, 'true');
      wm.remove();
      continueAfterWelcome();
    };
    wm.querySelector('#updateClose')!.addEventListener('click', close);
    wm.addEventListener('click', (e) => { if (e.target === wm) close(); });
  }

  interface TutorialStep {
    focus: 'left' | 'center' | 'right';
    target: string;
    title: string;
    text: string;
    arrow: 'left' | 'right' | 'up' | 'down' | 'none';
    cardPosition?: 'left' | 'right';
  }

  const TUTORIAL_STEPS: TutorialStep[] = [
    {
      focus: 'right',
      target: '#importTabs',
      title: 'Menú de Importación',
      text: 'Arranca cargando tu diseño gráfico. Sube imágenes (PNG sin fondo recomendado), importa vectores puros (SVG), inserta Iconos o escribe Texto personalizado.',
      arrow: 'right'
    },
    {
      focus: 'right',
      target: '#export',
      title: 'Exportación a Bambu Studio',
      text: 'Cuando el diseño 3D termine, haz clic aquí para descargar el <strong>archivo 3MF</strong> optimizado. Contiene todos los cuerpos de colores ya divididos para tu sistema AMS.',
      arrow: 'right'
    },
    {
      focus: 'right',
      target: '#projectSettingsContainer',
      title: 'Ajustes de Proyecto',
      text: 'Guarda tu avance como <code>.json</code> para retomarlo otro día o cambia al Modo Claro/Oscuro de la interfaz.',
      arrow: 'right'
    },
    {
      focus: 'center',
      target: '#app',
      title: 'Visor Interactivo 3D',
      text: 'Visualiza la geometría en tiempo real. <strong>Clic Izquierdo + Arrastrar</strong> para orbitar, <strong>Clic Derecho</strong> para paneo y <strong>Rueda del ratón</strong> para el zoom.',
      arrow: 'none',
      cardPosition: 'left'
    },
    {
      focus: 'center',
      target: '#editModeBar',
      title: 'Modos de Edición',
      text: 'Intercambia entre <strong>Color</strong> (asigna filamentos pintando directamente los vectores) o <strong>Extrusión</strong> (da relieve volumétrico diferente a cada capa de color).',
      arrow: 'up',
      cardPosition: 'left'
    },
    {
      focus: 'left',
      target: '#previewViewSection',
      title: 'Vista de Ensamble',
      text: 'Alterna entre la pieza <strong>Ensamblada</strong> o vista en <strong>Despiece</strong> para auditar cómo encaja la tapa en el zócalo de la base antes de mandar a imprimir.',
      arrow: 'left'
    },
    {
      focus: 'left',
      target: '#baseStyleSection',
      title: 'Geometría Base',
      text: 'Elige si la base seguirá la silueta irregular (<strong>Contorno</strong>) o será empotrada en un perímetro estricto (<strong>Forma</strong>, como Círculos o Cuadrados).',
      arrow: 'left'
    },
    {
      focus: 'left',
      target: '#geometrySettingsContainer',
      title: 'Tolerancias para P2S',
      text: 'El panel crítico de tu flujo: Ajusta el número de colores AMS, activa Llaveros, manipula los Relieves e incrementa o cierra los encajes <strong>Zócalo (0.4mm base)</strong> y <strong>Cruz MX</strong> según los encogimientos térmicos del plástico.',
      arrow: 'left'
    },
    {
      focus: 'left',
      target: '#sectionSwitch',
      title: 'Posicionamiento Mecánico',
      text: 'Define la ubicación exacta (Coordenadas X/Y y Rotación) del alojamiento inferior donde encajará tu Switch mecánico.',
      arrow: 'left'
    }
  ];

  function showTutorial() {
    if (document.querySelector('.tutorial-card-container')) return;
    let stepIndex = 0;

    const backdrop = document.createElement('div');
    backdrop.className = 'tutorial-backdrop';
    const cardContainer = document.createElement('div');
    cardContainer.className = 'tutorial-card-container';
    const card = document.createElement('div');
    card.className = 'tutorial-card';
    const pointer = document.createElement('div');
    
    const renderStep = () => {
      const step = TUTORIAL_STEPS[stepIndex];
      document.body.className = `tutorial-active focus-${step.focus}`;
      
      cardContainer.style.justifyContent = 'center';
      cardContainer.style.alignItems = 'center';
      cardContainer.style.paddingLeft = '0';
      cardContainer.style.paddingRight = '0';
      
      if (step.cardPosition === 'left') {
        cardContainer.style.justifyContent = 'flex-start';
        cardContainer.style.paddingLeft = '60px';
      } else if (step.cardPosition === 'right') {
        cardContainer.style.justifyContent = 'flex-end';
        cardContainer.style.paddingRight = '60px';
      }

      document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
      const targetEl = document.querySelector(step.target) as HTMLElement;
      if (targetEl) {
        targetEl.classList.add('tutorial-highlight');
        if (targetEl instanceof HTMLDetailsElement) targetEl.open = true;
      }

      card.innerHTML = `
        <button class="tutorial-card-close" aria-label="Cerrar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <h3>${step.title} (${stepIndex + 1}/${TUTORIAL_STEPS.length})</h3>
        <p>${step.text}</p>
        <div class="tutorial-controls">
          <label class="tutorial-checkbox">
            <input type="checkbox" id="tutDontShow" ${localStorage.getItem('clicker_tutorial_dismissed') === 'true' ? 'checked' : ''} />
            No mostrar más
          </label>
          <div class="tutorial-nav">
            <button class="secondary" id="tutPrev" ${stepIndex === 0 ? 'disabled' : ''}>Anterior</button>
            <button class="primary" id="tutNext" style="background-color:#10b981;">${stepIndex === TUTORIAL_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}</button>
          </div>
        </div>
      `;

      card.querySelector('.tutorial-card-close')!.addEventListener('click', closeTutorial);
      const dontShow = card.querySelector('#tutDontShow') as HTMLInputElement;
      dontShow.addEventListener('change', () => {
        if (dontShow.checked) localStorage.setItem('clicker_tutorial_dismissed', 'true');
        else localStorage.removeItem('clicker_tutorial_dismissed');
      });

      card.querySelector('#tutPrev')?.addEventListener('click', () => { if (stepIndex > 0) { stepIndex--; renderStep(); } });
      card.querySelector('#tutNext')?.addEventListener('click', () => { if (stepIndex < TUTORIAL_STEPS.length - 1) { stepIndex++; renderStep(); } else closeTutorial(); });

      if (targetEl && step.arrow !== 'none') {
        const rect = targetEl.getBoundingClientRect();
        pointer.className = `tutorial-pointer point-${step.arrow}`;
        pointer.style.display = 'block';
        
        let arrowOffsetTop = 0;
        let arrowOffsetLeft = 0;
        
        if (step.arrow === 'right') {
          arrowOffsetTop = rect.top + rect.height / 2 - 28;
          arrowOffsetLeft = rect.left - 70;
        } else if (step.arrow === 'left') {
          arrowOffsetTop = rect.top + rect.height / 2 - 28;
          arrowOffsetLeft = rect.right + 14;
        } else if (step.arrow === 'down') {
          arrowOffsetTop = rect.top - 70;
          arrowOffsetLeft = rect.left + rect.width / 2 - 28;
        } else if (step.arrow === 'up') {
          arrowOffsetTop = rect.bottom + 14;
          arrowOffsetLeft = rect.left + rect.width / 2 - 28;
        }
        
        pointer.style.top = `${arrowOffsetTop}px`;
        pointer.style.left = `${arrowOffsetLeft}px`;
        pointer.innerHTML = `
          <div class="tutorial-pointer-inner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        `;
      } else {
        pointer.style.display = 'none';
      }
    };

    const closeTutorial = () => {
      document.body.classList.remove('tutorial-active', 'focus-left', 'focus-center', 'focus-right');
      document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
      backdrop.remove();
      cardContainer.remove();
      pointer.remove();
    };

    cardContainer.appendChild(card);
    document.body.appendChild(backdrop);
    document.body.appendChild(cardContainer);
    document.body.appendChild(pointer);
    renderStep();
  }

  function showTutorialPrompt() {
    if (document.querySelector('.welcome-overlay') || document.querySelector('.tutorial-backdrop')) return;
    const wm = document.createElement('div');
    wm.className = 'welcome-overlay';
    wm.innerHTML = `
      <div class="welcome-card" style="align-items: center; text-align: center; width: 380px; padding: 32px;">
        <h2 style="margin-bottom: 8px;">Asistencia Técnica</h2>
        <p style="margin-bottom: 24px;">¿Deseas activar el tutorial guiado de la interfaz?</p>
        <div style="display: flex; gap: 12px; justify-content: center; width: 100%;">
          <button class="secondary" id="tutPromptNo" style="flex: 1;">No</button>
          <button class="primary" id="tutPromptYes" style="flex: 1; background-color:#10b981;">Sí, iniciar</button>
        </div>
      </div>
    `;
    document.body.appendChild(wm);
    const close = () => wm.remove();
    wm.querySelector('#tutPromptNo')!.addEventListener('click', close);
    wm.querySelector('#tutPromptYes')!.addEventListener('click', () => { close(); showTutorial(); });
  }

  showWelcome();
  $('helpToggle').addEventListener('click', showTutorialPrompt);

  function update(state: UiState) {
    statusEl.innerHTML = (state.building ? '<span class="spinner"></span> ' : '') + state.status;
    forma.update(state);
    switchH.update(state);
    colores.update(state);
    viewportTools?.update(state);

    const kc = state.keychain;
    keychain.checked = kc.enabled;
    const kcOpts = document.getElementById('keychainOpts');
    if (kcOpts) kcOpts.style.display = kc.enabled ? '' : 'none';
    const kcAngleEl = document.getElementById('keychainAngleVal');
    if (kcAngleEl) kcAngleEl.textContent = `${Math.round((((kc.angleDeg % 360) + 360) % 360))}°`;
    const kcOffsetEl = document.getElementById('keychainOffsetVal');
    if (kcOffsetEl) kcOffsetEl.textContent = `${(kc.offsetMm ?? 0.0).toFixed(1)} mm`;
    const kcSizeEl = document.getElementById('keychainSizeVal');
    if (kcSizeEl) kcSizeEl.textContent = `${kc.holeDiameterMm.toFixed(1)} mm`;
    
    $<HTMLInputElement>('removebg').checked = state.removeBg;
    $<HTMLInputElement>('removebgSvg').checked = state.removeBg;
    $<HTMLInputElement>('showswitch').checked = state.showSwitch;

    for (const b of importTabs.querySelectorAll<HTMLElement>('[data-mode]')) b.classList.toggle('active', b.dataset.mode === state.importMode);
    $('imagePanel').hidden = state.importMode !== 'image';
    $('svgPanel').hidden = state.importMode !== 'svg';
    $('iconPanel').hidden = state.importMode !== 'icon';
    $('letterPanel').hidden = state.importMode !== 'text';

    for (const b of viewTabs.querySelectorAll<HTMLElement>('button')) b.classList.toggle('active', b.dataset.view === state.view);
    const exportBtn = $<HTMLButtonElement>('export');
    exportBtn.disabled = !state.hasParts || state.building;

    const overlay = $('loadingOverlay');
    if (overlay) {
      if (state.building) {
        overlay.removeAttribute('hidden');
        const textEl = overlay.querySelector('.loading-text');
        if (textEl) textEl.textContent = state.status;
      } else {
        overlay.setAttribute('hidden', '');
      }
    }

    if (state.currentIconName) {
      galleryEl.querySelectorAll('.icon').forEach((n) => n.classList.toggle('active', n.getAttribute('title') === state.currentIconName));
    }

    const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement | null;
    const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement | null;
    const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement | null;
    if (undoBtn) undoBtn.disabled = !state.canUndo;
    if (redoBtn) redoBtn.disabled = !state.canRedo;
    if (refreshBtn) refreshBtn.disabled = !state.canRefresh;

    const extrudeTooltipEl = document.getElementById('extrudeTooltip');
    if (extrudeTooltipEl) extrudeTooltipEl.classList.toggle('hidden', state.editMode !== 'extrude');
  }

  return { 
    update, 
    hexRgb, 
    showColorPopoverAt, 
    addUploadedSvg, 
    addFontOption: (font: FontOption) => { 
      addFontOption(font); 
      const lastBtn = fontGrid.lastElementChild as HTMLElement;
      if (lastBtn) lastBtn.click();
    } 
  };
}

import type { BaseShapeKind, EditMode, EdgeSetting, EdgeStyle, KeychainParams, PaletteEntry, SwitchPlacement, ViewMode, RGB } from '../types';
import type { SectionAxis } from '../viewer/viewer';
import type { RgbaImage } from '../image/decode';
import type { FontOption } from '../image/letter';
import type { PanelHandle, Shell } from './shell/types';
import { formaPanel } from './panels/forma';
import { switchPanel } from './panels/switch';
import { coloresPanel, mountColorViewportTools } from './panels/colores';
import { disenoPanel } from './panels/diseno';
import { llaveroPanel } from './panels/llavero';
import { exportarPanel } from './panels/exportar';
import { mountViewerControls } from './viewer-controls/viewerControls';
import { mountTopbarActions } from './shell/topbarActions';
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
  sidebarLeft: HTMLElement,
  sidebarRight: HTMLElement,
  statusEl: HTMLElement,
  cb: UiCallbacks,
  shell?: Shell,
  opts?: { onExplosion?: (t: number) => void },
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

    <div id="geometrySettingsContainer"></div>

  `;

  // Barra Lateral Derecha
  sidebarRight.innerHTML = '';

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

  // Panel Llavero: sin `shell` va antes del panel Switch, donde estaba el bloque de ajustes.
  let llaveroHost: HTMLElement;
  if (shell) llaveroHost = shell.panelHost('llavero');
  else {
    llaveroHost = document.createElement('div');
    $('geometrySettingsContainer').insertBefore(llaveroHost, switchHost);
  }
  const llavero = llaveroPanel.mount(llaveroHost, cb);

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

  // Panel Diseño (tarjetas de importación, imagen, SVG, iconos, texto y limpieza). Sin `shell`
  // ocupa el inicio de la barra derecha, antes del pie de exportación, donde estaba antes.
  let disenoHost: HTMLElement;
  if (shell) disenoHost = shell.panelHost('diseno');
  else {
    disenoHost = document.createElement('div');
    sidebarRight.insertBefore(disenoHost, sidebarRight.firstChild);
  }
  const diseno = disenoPanel.mount(disenoHost, cb);

  // Panel Exportar: sin `shell` se monta en la barra derecha, donde estaba el botón de descarga.
  let exportarHost: HTMLElement;
  if (shell) exportarHost = shell.panelHost('exportar');
  else {
    exportarHost = document.createElement('div');
    sidebarRight.appendChild(exportarHost);
  }
  const exportar = exportarPanel.mount(exportarHost, cb);

  // Acciones de la barra superior (historial, proyecto, ayuda, tema). Sin `shell` van al final
  // de la barra izquierda. `onHelp` conserva el aviso del tutorial hasta que se retire (tarea 10).
  let topbarHost: HTMLElement;
  if (shell) topbarHost = shell.topbarActionsEl;
  else {
    topbarHost = document.createElement('div');
    topbarHost.className = 'btn-row';
    sidebarLeft.appendChild(topbarHost);
  }
  const topbar = mountTopbarActions(topbarHost, cb, { onHelp: () => showTutorialPrompt() });

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

  // Controles del visor (explosión y ojo del switch): solo con `shell`, que es siempre el caso en main.ts.
  const viewerControls =
    shell && opts?.onExplosion ? mountViewerControls(shell.viewerControlsEl, cb, opts.onExplosion) : null;

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

  function update(state: UiState) {
    statusEl.innerHTML = (state.building ? '<span class="spinner"></span> ' : '') + state.status;
    forma.update(state);
    switchH.update(state);
    llavero.update(state);
    colores.update(state);
    diseno.update(state);
    exportar.update(state);
    topbar.update(state);
    viewportTools?.update(state);
    viewerControls?.update(state);

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

    const extrudeTooltipEl = document.getElementById('extrudeTooltip');
    if (extrudeTooltipEl) extrudeTooltipEl.classList.toggle('hidden', state.editMode !== 'extrude');
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

import type { EdgeStyle, EditMode, PaletteEntry, RGB } from '../../types';
import { FILAMENTS } from '../../types';
import type { UiCallbacks, UiState } from '../ui';
import type { PanelHandle, PanelModule } from '../shell/types';
import { bindValInput, tip } from '../shared/controls';
import { getFilamentNameAndHex, rgbHex, showColorPickerBelow } from '../shared/colorPopover';

// El contenedor conserva el id `sectionColors`; `globalEdges` (biselados de tapa y base) vive aquí.
const TEMPLATE = `
  <div class="section" id="sectionColors">
    <span class="label">Colores y Suavizado</span>
    <div class="field" id="colorCountField">
      <label for="ccount">Paleta AMS ${tip('Cantidad de colores o extrusores que utilizará tu AMS.')}</label>
      <select id="ccount">
        <option value="2">2 Colores</option>
        <option value="3">3 Colores</option>
        <option value="4">4 Colores</option>
        <option value="5">5 Colores</option>
        <option value="6">6 Colores</option>
        <option value="7">7 Colores</option>
        <option value="8">8 Colores</option>
      </select>
    </div>
    <div class="prow-stacked" id="smoothingField">
      <div class="prow-header">
        <label for="smooth">Suavizado de Vector ${tip('Nivel de simplificación de bordes. Valores altos redondean puntas, bajos conservan detalles finos.')}</label>
        <input type="text" class="val" id="smoothVal" />
      </div>
      <input type="range" id="smooth" min="0" max="1" step="0.05" />
    </div>
    <div class="palette" id="palette">
      <div class="hint">Carga una imagen/vector para asignar colores.</div>
    </div>

    <div class="global-edges" id="globalEdges" style="display:none; margin-bottom: 16px;">
      <span class="gedge-heading">Biselados (Edges) ${tip('Redondea (Fillet) o bisela a 45º (Chamfer) los bordes principales de la pieza.')}</span>
      <div class="gedge-row">
        <span class="gedge-name">Tapa (Keycap)</span>
        <div class="edge-style-btns" data-edge="capTop">
          <button class="edge-style-btn active" data-style="none" type="button">Nada</button>
          <button class="edge-style-btn" data-style="fillet" type="button">Redondo</button>
          <button class="edge-style-btn" data-style="chamfer" type="button">Bisel</button>
        </div>
        <div class="edge-size-btns gedge-size" data-edge="capTop" style="display:none;">
          <button class="btn edge-size-minus" type="button">−</button>
          <span class="edge-size-val"></span>
          <button class="btn edge-size-plus" type="button">+</button>
        </div>
      </div>
      <div class="gedge-row">
        <span class="gedge-name">Base inferior</span>
        <div class="edge-style-btns" data-edge="clickerBase">
          <button class="edge-style-btn active" data-style="none" type="button">Nada</button>
          <button class="edge-style-btn" data-style="fillet" type="button">Redondo</button>
          <button class="edge-style-btn" data-style="chamfer" type="button">Bisel</button>
        </div>
        <div class="edge-size-btns gedge-size" data-edge="clickerBase" style="display:none;">
          <button class="btn edge-size-minus" type="button">−</button>
          <span class="edge-size-val"></span>
          <button class="btn edge-size-plus" type="button">+</button>
        </div>
      </div>
    </div>
  </div>
`;

const friendlyTargetLabel = (t: string): string => {
  if (t === 'capTop') return 'Tapa Superior';
  if (t === 'baseTop') return 'Base Superior';
  if (t === 'baseBottom') return 'Base Inferior';
  if (t === 'base-body') return 'Cuerpo';
  if (t === 'top-base') return 'Marco de Tapa';
  const m = /^top-color-(\d+)-\d+$/.exec(t);
  if (m) return `Color ${+m[1] + 1}`;
  return t;
};

export const coloresPanel: PanelModule = {
  id: 'colores',
  mount(host: HTMLElement, cb: UiCallbacks): PanelHandle {
    host.insertAdjacentHTML('beforeend', TEMPLATE);
    const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;

    const ccount = $<HTMLSelectElement>('ccount');
    ccount.addEventListener('change', () => cb.onColorCount(+ccount.value));
    const smooth = $<HTMLInputElement>('smooth');
    smooth.addEventListener('input', () => cb.onSmoothing(+smooth.value));
    bindValInput('smoothVal', smooth, cb.onSmoothing, (v) => v / 100);

    const globalEdges = $('globalEdges');
    globalEdges.addEventListener('click', (e) => {
      const el = e.target as HTMLElement;
      const styleBtn = el.closest('.edge-style-btn') as HTMLElement | null;
      if (styleBtn) {
        const btnsRow = styleBtn.closest('.edge-style-btns') as HTMLElement;
        const target = btnsRow.dataset.edge;
        if (target) cb.onEdgeStyle(target, styleBtn.dataset.style as EdgeStyle);
        return;
      }
      const minus = el.closest('.edge-size-minus');
      const plus = el.closest('.edge-size-plus');
      if (minus || plus) {
        const sizeRow = el.closest('.edge-size-btns') as HTMLElement;
        const target = sizeRow.dataset.edge;
        if (target) cb.onEdgeStep(target, minus ? -0.2 : 0.2);
      }
    });

    const pal = $('palette');
    function renderPalette(palette: PaletteEntry[], bodyColorRgb: RGB, colorMode?: 'normal' | 'limited', limitedColors?: RGB[]) {
      pal.innerHTML = '';
      const chipsToRender: [string, string][] = [];
      if (colorMode === 'limited' && limitedColors && limitedColors.length > 0) {
        limitedColors.forEach((rgb) => chipsToRender.push(getFilamentNameAndHex(rgb)));
      } else {
        FILAMENTS.forEach(([name, hex]) => chipsToRender.push([name, hex]));
      }

      const bodyRow = document.createElement('div');
      bodyRow.className = 'fil-row body-row';
      bodyRow.innerHTML = `
        <span class="slot-no slot-body">Cuerpo</span>
        <span class="swatch" style="background:#787c82; opacity: 0.5;" title="Color base original"></span>
        <span class="arrow">→</span>
        <button type="button" class="fil-chip" title="Color estructural de la pieza" style="background:${rgbHex(bodyColorRgb)}"></button>
      `;
      const bodyChip = bodyRow.querySelector('.fil-chip') as HTMLElement;
      bodyChip.addEventListener('click', (e) => {
        e.stopPropagation();
        showColorPickerBelow(bodyChip, rgbHex(bodyColorRgb), chipsToRender, (hex) => cb.onBodyColor(hex));
      });
      pal.appendChild(bodyRow);

      if (palette.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'hint';
        hint.textContent = 'Carga imagen/vector para habilitar AMS.';
        pal.appendChild(hint);
        return;
      }
      palette.forEach((entry, i) => {
        const row = document.createElement('div');
        row.className = 'fil-row';
        row.innerHTML = `
          <span class="slot-no">E${i + 1}</span>
          <span class="swatch" style="background:${rgbHex(entry.quantRgb)}" title="Color original detectado"></span>
          <span class="arrow">→</span>
          <button type="button" class="fil-chip" title="Filamento" style="background:${rgbHex(entry.filamentRgb)}"></button>`;
        const chip = row.querySelector('.fil-chip') as HTMLElement;
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          showColorPickerBelow(chip, rgbHex(entry.filamentRgb), chipsToRender, (hex) => cb.onFilament(i, hex));
        });
        pal.appendChild(row);
      });

      const hint = document.createElement('div');
      hint.className = 'hint model-recolor-tip';
      hint.textContent = 'Aviso: Haz clic directo en el 3D para repintar sectores manuales.';
      pal.appendChild(hint);
    }

    const smoothVal = $<HTMLInputElement>('smoothVal');
    const colorCountField = $('colorCountField');
    const smoothingField = $('smoothingField');

    return {
      update(state: UiState) {
        if (state.colorMode === 'limited') {
          ccount.disabled = true;
          if (!ccount.querySelector(`option[value="${state.colorCount}"]`)) {
            const opt = document.createElement('option');
            opt.value = String(state.colorCount);
            opt.textContent = `${state.colorCount} Colores (Limitado)`;
            ccount.appendChild(opt);
          }
          ccount.value = String(state.colorCount);
        } else {
          ccount.disabled = false;
          ccount.querySelectorAll('option').forEach((opt) => { if (opt.textContent?.includes('Limitado')) opt.remove(); });
          ccount.value = String(state.colorCount);
        }

        smooth.value = String(state.smoothing);
        if (document.activeElement !== smoothVal) smoothVal.value = Math.round(state.smoothing * 100) + '%';

        const showSmoothingAndBg = state.importMode === 'image';
        colorCountField.style.display = showSmoothingAndBg ? 'grid' : 'none';
        smoothingField.style.display = showSmoothingAndBg ? 'grid' : 'none';

        renderPalette(state.palette, state.bodyColorRgb, state.colorMode, state.limitedColors);

        for (const target of ['capTop', 'clickerBase']) {
          const es = state.edgeSettings.find((s) => s.target === target) || { target, style: 'none' as EdgeStyle, radius: 0 };
          const btnsRow = globalEdges.querySelector(`.edge-style-btns[data-edge="${target}"]`) as HTMLElement | null;
          const sizeRow = globalEdges.querySelector(`.edge-size-btns[data-edge="${target}"]`) as HTMLElement | null;
          if (btnsRow) btnsRow.querySelectorAll('.edge-style-btn').forEach((b) => b.classList.toggle('active', (b as HTMLElement).dataset.style === es.style));
          if (sizeRow) {
            const valEl = sizeRow.querySelector('.edge-size-val') as HTMLElement | null;
            if (es.style === 'none') sizeRow.style.display = 'none';
            else { sizeRow.style.display = 'flex'; if (valEl) valEl.textContent = `${(es.radius ?? 1).toFixed(1)} mm`; }
          }
        }
      },
    };
  },
};

/**
 * Herramientas de relieve y bisel que flotan sobre el visor 3D: barra de modos de edición,
 * "Separar letras", panel de extrusión y panel de bordes. Se quedan anclados al visor (no al
 * dock) porque reaccionan a las piezas que el usuario elige con clic en el modelo.
 */
export function mountColorViewportTools(viewport: HTMLElement, cb: UiCallbacks): PanelHandle {
  const modeBar = document.createElement('div');
  modeBar.id = 'editModeBar';
  modeBar.className = 'edit-mode-bar';
  modeBar.innerHTML = `
    <button class="edit-mode-btn active" data-editmode="color" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
      Pintar Color
    </button>
    <button class="edit-mode-btn" data-editmode="extrude" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
      Extruir (Altura)
    </button>
    <button class="edit-mode-btn" data-editmode="edges" type="button" style="display:none;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" ry="4"/></svg>
      Biselado
    </button>
  `;
  viewport.appendChild(modeBar);
  modeBar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-editmode]') as HTMLElement | null;
    if (btn) cb.onEditMode(btn.dataset.editmode as EditMode);
  });

  const lettersToggle = document.createElement('div');
  lettersToggle.id = 'lettersToggle';
  lettersToggle.className = 'letters-toggle';
  lettersToggle.setAttribute('hidden', '');
  lettersToggle.innerHTML = `
    <span>Separar Letras Individuales</span>
    <label class="toggle"><input type="checkbox" id="separateLetters" /><span class="slider"></span></label>
  `;
  viewport.appendChild(lettersToggle);
  const separateEl = lettersToggle.querySelector('#separateLetters') as HTMLInputElement;
  separateEl.addEventListener('change', () => cb.onSeparateLetters(separateEl.checked));

  const extrudePanel = document.createElement('div');
  extrudePanel.id = 'extrudePanel';
  extrudePanel.className = 'edges-panel';
  extrudePanel.setAttribute('hidden', '');
  extrudePanel.innerHTML = `
    <div class="edges-title">Extruir Segmento</div>
    <div id="extrudeLevelLabel" style="text-align:center; margin-top:8px; font-size:13px; color:var(--muted);">Nivel: 0</div>
    <div style="display:flex; gap:8px; margin-top:8px;">
      <button type="button" class="btn" id="extrudeMinus" style="flex:1; font-size:18px;">-</button>
      <button type="button" class="btn" id="extrudePlus" style="flex:1; font-size:18px;">+</button>
    </div>
    <div class="extrude-chamfer-row">
      <span>Biselar bordes levantados</span>
      <label class="toggle"><input type="checkbox" id="extrudeChamfer" /><span class="slider"></span></label>
    </div>
    <div class="panel-hint">Sube o baja el relieve del color seleccionado. Shift-Clic para elegir múltiples áreas.</div>
  `;
  viewport.appendChild(extrudePanel);
  const minusBtn = extrudePanel.querySelector('#extrudeMinus') as HTMLButtonElement;
  const plusBtn = extrudePanel.querySelector('#extrudePlus') as HTMLButtonElement;
  const levelLabel = extrudePanel.querySelector('#extrudeLevelLabel') as HTMLElement;
  const chamferEl = extrudePanel.querySelector('#extrudeChamfer') as HTMLInputElement;
  minusBtn.addEventListener('click', () => cb.onExtrudeStep(-1));
  plusBtn.addEventListener('click', () => cb.onExtrudeStep(1));
  chamferEl.addEventListener('change', () => cb.onExtrudeChamfer(chamferEl.checked));

  const edgesPanel = document.createElement('div');
  edgesPanel.id = 'edgesPanel';
  edgesPanel.className = 'edges-panel';
  edgesPanel.setAttribute('hidden', '');
  edgesPanel.innerHTML = `
    <div class="edges-title" id="edgesTitle">Ajuste de Bordes</div>
    <div id="edgesContent"></div>
    <div class="panel-hint">Selecciona una zona para redondear o biselar su borde superior. Shift-Clic para múltiples.</div>
  `;
  viewport.appendChild(edgesPanel);
  const edgesTitle = edgesPanel.querySelector('#edgesTitle') as HTMLElement;
  const edgesContent = edgesPanel.querySelector('#edgesContent') as HTMLElement;
  edgesPanel.addEventListener('click', (e) => {
    const targetEl = e.target as HTMLElement;
    const styleBtn = targetEl.closest('.edge-style-btn') as HTMLElement | null;
    if (styleBtn) {
      const btnsRow = styleBtn.closest('.edge-style-btns') as HTMLElement;
      btnsRow.querySelectorAll('.edge-style-btn').forEach((b) => b.classList.remove('active'));
      styleBtn.classList.add('active');
      const target = btnsRow.dataset.edge;
      if (target) cb.onEdgeStyle(target, styleBtn.dataset.style as EdgeStyle);
    }
    if (targetEl.classList.contains('edge-size-minus') || targetEl.classList.contains('edge-size-plus')) {
      const sizeRow = targetEl.closest('.edge-size-btns') as HTMLElement;
      const target = sizeRow.dataset.edge;
      const delta = targetEl.classList.contains('edge-size-minus') ? -0.2 : 0.2;
      if (target) cb.onEdgeStep(target, delta);
    }
  });

  return {
    update(state: UiState) {
      for (const b of modeBar.querySelectorAll<HTMLElement>('[data-editmode]')) b.classList.toggle('active', b.dataset.editmode === state.editMode);

      const showLetters = state.importMode === 'text' && (state.editMode === 'color' || state.editMode === 'extrude');
      lettersToggle.toggleAttribute('hidden', !showLetters);
      separateEl.checked = state.separateLetters;

      if (state.editMode === 'extrude') {
        extrudePanel.removeAttribute('hidden');
        chamferEl.disabled = false;
        chamferEl.checked = state.extrudeChamfer;
        if (state.selectedParts.length === 0) {
          plusBtn.disabled = true;
          minusBtn.disabled = true;
          levelLabel.textContent = 'Seleccione una capa';
        } else {
          plusBtn.disabled = false;
          minusBtn.disabled = false;
          const level = state.componentHeights[state.selectedParts[0]] ?? 0;
          const n = state.selectedParts.length;
          levelLabel.textContent = n > 1 ? `${n} zonas · Relieve: ${level.toFixed(1)}` : `Relieve: ${level.toFixed(1)}`;
        }
      } else {
        extrudePanel.setAttribute('hidden', '');
      }

      if (state.editMode !== 'edges') {
        edgesPanel.setAttribute('hidden', '');
        return;
      }
      edgesPanel.removeAttribute('hidden');
      if (state.selectedParts.length === 0) {
        edgesTitle.textContent = 'Ajuste de Bordes';
        if (!edgesContent.querySelector('.edges-empty')) {
          edgesContent.innerHTML = `<div class="edges-empty">Toca una zona del modelo 3D para redondear o biselar.<br/>Los filos generales de la Tapa y Base están en el panel Colores.</div>`;
        }
        return;
      }
      const targets = state.selectedParts;
      edgesTitle.textContent = 'Bordes de la Pieza';
      const currentTargets = Array.from(edgesContent.querySelectorAll('.edge-style-btns')).map((r) => (r as HTMLElement).dataset.edge);
      if (targets.join(',') !== currentTargets.join(',')) {
        edgesContent.innerHTML = targets.map((t) => {
          const label = friendlyTargetLabel(t);
          return `
            <div class="edge-label" title="${t}" style="margin-bottom: 4px;">${label} <span class="edge-radius-label" style="color:var(--muted);"></span></div>
            <div class="edge-style-btns" data-edge="${t}" style="margin-bottom: 8px;">
              <button class="edge-style-btn active" data-style="none" type="button">Nada</button>
              <button class="edge-style-btn" data-style="fillet" type="button">Redondo</button>
              <button class="edge-style-btn" data-style="chamfer" type="button">Bisel</button>
            </div>
            <div class="edge-size-btns" data-edge="${t}" style="gap:8px; margin-bottom: 12px; display: none;">
              <button class="btn edge-size-minus" type="button" style="flex:1;">-</button>
              <button class="btn edge-size-plus" type="button" style="flex:1;">+</button>
            </div>
          `;
        }).join('');
      }
      for (const target of targets) {
        const es = state.edgeSettings.find((s) => s.target === target) || { target, style: 'none' as EdgeStyle, radius: 1.0 };
        const btnsRow = edgesContent.querySelector(`.edge-style-btns[data-edge="${target}"]`) as HTMLElement;
        const sizeRow = edgesContent.querySelector(`.edge-size-btns[data-edge="${target}"]`) as HTMLElement;
        const labelRow = edgesContent.querySelector(`.edge-label[title="${target}"] .edge-radius-label`) as HTMLElement;
        if (btnsRow) btnsRow.querySelectorAll('.edge-style-btn').forEach((b) => b.classList.toggle('active', (b as HTMLElement).dataset.style === es.style));
        if (sizeRow && labelRow) {
          if (es.style === 'none') { sizeRow.style.display = 'none'; labelRow.textContent = ''; }
          else { sizeRow.style.display = 'flex'; const safeRadius = es.radius !== undefined ? es.radius : 1.0; labelRow.textContent = `(${safeRadius.toFixed(1)} mm)`; }
        }
      }
    },
  };
}

import type { UiCallbacks, UiState } from '../ui';
import type { PanelHandle, PanelModule } from '../shell/types';
import type { FontOption } from '../../image/letter';
import { FONT_OPTIONS, loadBundledFonts } from '../../image/letter';
import { SAMPLES } from '../../image/sample';

type ImportMode = UiState['importMode'];
/** Modos con tarjeta y sub-panel propios: el modo 'icon' ya no se ofrece. */
type PanelMode = Exclude<ImportMode, 'icon'>;

// `importTabs` conserva su id porque el tutorial lo señala. Los interruptores "Eliminar fondo"
// (`removebg`, `removebgSvg`) son el paso de limpieza de la imagen y del SVG.
const TEMPLATE = `
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
      <span class="sample-heading">Muestras</span>
      <div class="sample-inline-grid"></div>
      <div class="cleanup-step">
        <span class="sample-heading">Paso de limpieza</span>
        <div class="switch-row">
          <span class="switch-label">Eliminar fondo (IA)</span>
          <label class="toggle"><input id="removebg" type="checkbox" /><span class="slider"></span></label>
        </div>
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
      <div class="cleanup-step">
        <span class="sample-heading">Paso de limpieza</span>
        <div class="switch-row">
          <span class="switch-label">Eliminar fondo SVG</span>
          <label class="toggle"><input id="removebgSvg" type="checkbox" /><span class="slider"></span></label>
        </div>
      </div>
      <button class="primary" id="generateSvg" style="margin-top: 10px; width: 100%;">Generar Geometría</button>
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
`;

/** El panel Diseño expone además las galerías que main.ts alimenta (SVG subidos y fuentes importadas). */
export interface DisenoHandle extends PanelHandle {
  /** Agrega un SVG a la galería; con `select` (por defecto) lo marca y llama `onSelectSvg`. */
  addUploadedSvg(svgText: string, name: string, select?: boolean): void;
  /** Agrega una fuente a la rejilla y la selecciona (pulsa su botón, que llama `onFontSelect`). */
  addFontOption(font: FontOption): void;
}

export const disenoPanel = {
  id: 'diseno' as const,
  mount(host: HTMLElement, cb: UiCallbacks): DisenoHandle {
    host.insertAdjacentHTML('beforeend', TEMPLATE);
    const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;

    // ---- Tarjetas de modo ----
    const importTabs = $('importTabs');
    importTabs.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest('[data-mode]') as HTMLElement | null;
      if (t) cb.onImportMode(t.dataset.mode as ImportMode);
    });

    // ---- Imagen: zona de carga, muestras y limpieza ----
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

    const sampleGrid = host.querySelector<HTMLElement>('#imagePanel .sample-inline-grid')!;
    for (const sample of SAMPLES) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'sample-inline-item';
      item.title = sample.name;
      const img = document.createElement('img');
      img.src = sample.src;
      img.alt = sample.name;
      const label = document.createElement('span');
      label.textContent = sample.name;
      item.append(img, label);
      item.addEventListener('click', () => cb.onSample(sample.load));
      sampleGrid.appendChild(item);
    }

    const removebg = $<HTMLInputElement>('removebg');
    const removebgSvg = $<HTMLInputElement>('removebgSvg');
    removebg.addEventListener('change', () => cb.onRemoveBg(removebg.checked));
    removebgSvg.addEventListener('change', () => cb.onRemoveBg(removebgSvg.checked));

    // ---- SVG: subida y galería ----
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

    $('generateSvg').addEventListener('click', () => cb.onGenerate());

    // ---- Texto: campo, rejilla de fuentes e importación ----
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

    $('generateText').addEventListener('click', () => cb.onGenerate());

    const subPanels: Record<PanelMode, HTMLElement> = {
      image: $('imagePanel'),
      svg: $('svgPanel'),
      text: $('letterPanel'),
    };

    return {
      update(state: UiState) {
        // El texto del usuario (`letterText`) nunca se reescribe desde el estado.
        removebg.checked = state.removeBg;
        removebgSvg.checked = state.removeBg;

        // 'icon' sigue en el contrato (proyectos guardados antiguos): se muestra el panel Imagen.
        const shown: PanelMode = state.importMode === 'icon' ? 'image' : state.importMode;
        for (const b of importTabs.querySelectorAll<HTMLElement>('[data-mode]')) b.classList.toggle('active', b.dataset.mode === shown);
        for (const mode of Object.keys(subPanels) as PanelMode[]) subPanels[mode].hidden = mode !== shown;
      },
      addUploadedSvg,
      addFontOption(font: FontOption) {
        addFontOption(font);
        const lastBtn = fontGrid.lastElementChild as HTMLElement;
        if (lastBtn) lastBtn.click();
      },
    };
  },
} satisfies PanelModule;

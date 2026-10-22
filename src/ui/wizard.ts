// Asistente estilo Bambu: conversión de imagen a modelo 3D. Un paso modal único:
//   Preprocesamiento: proporción de recorte, grosor y controles deslizantes de tono/color.
// La eliminación del fondo se activa/desactiva en la barra lateral principal (no aquí), por lo que
// este asistente solo ajusta tonos y recorta la imagen. Al confirmar, entrega la imagen ajustada
// (con el fondo intacto) junto con los parámetros; el proceso llamador ejecuta el flujo de
// vectorizado y construcción 3D (donde se vuelve a calcular la eliminación de fondo, con valor
// predeterminado keepBackground = false).
// La extracción y asignación de colores ahora ocurre en tiempo real en el visor 3D, por lo que
// este asistente ya no requiere seleccionar modos de color ni perfiles manuales de filamento.
import type { RgbaImage } from '../image/decode';
import { preprocessImage } from '../image/adjust';
import { removeBackground } from '../image/matte';
import { DEFAULT_PREPROCESS, type CropRatio, type PreprocessParams, type RGB } from '../types';

export interface WizardResult {
  adjusted: RgbaImage; // Imagen recortada con ajuste de tono (el fondo original se conserva aquí)
  preprocess: PreprocessParams;
  colorCount: number;
  colorMode: 'normal' | 'limited';
  limitedColors?: RGB[];
  paletteOverrides?: RGB[];
}

interface WizardOpts {
  baseImage: RgbaImage;
  initialColorCount: number;
  onComplete(result: WizardResult): void;
  onCancel?(): void;
}

const SLIDERS: [keyof PreprocessParams, string][] = [
  ['exposure', 'Exposición'],
  ['contrast', 'Contraste'],
  ['saturation', 'Saturación'],
  ['brightness', 'Brillo'],
  ['whiteBalance', 'Balance de Blancos'],
  ['highlights', 'Altas Luces'],
  ['shadows', 'Sombras'],
];

const RATIOS: [CropRatio, string][] = [
  ['free', 'Libre'],
  ['1:1', '1:1'],
  ['4:3', '4:3'],
  ['3:2', '3:2'],
  ['16:9', '16:9'],
];

const ALPHA_THRESHOLD = 128;

/** Devuelve verdadero si la imagen aún conserva primer plano tras remover el fondo; es decir,
 *  si el motor de construcción geométrica encontrará un contorno válido para trazar la pieza.
 *  Mantener el fondo implica que cada píxel cuenta como figura, por lo que siempre habrá silueta. */
function hasOutline(img: RgbaImage, keepBackground: boolean): boolean {
  if (keepBackground) return true;
  const clone: RgbaImage = {
    data: new Uint8ClampedArray(img.data),
    width: img.width,
    height: img.height,
  };
  removeBackground(clone); // Modifica solo el clon en memoria, nunca la imagen de vista previa activa
  let fg = 0;
  for (let p = 3; p < clone.data.length; p += 4) if (clone.data[p] >= ALPHA_THRESHOLD) fg++;
  return fg > 8; // Unos pocos píxeles dispersos o ruido no conforman una región imprimible
}

function imageToCanvas(img: RgbaImage): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d')!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
  return c;
}

export function runWizard(opts: WizardOpts) {
  const params: PreprocessParams = { ...DEFAULT_PREPROCESS };
  const colorCount = [4, 8, 12].includes(opts.initialColorCount) ? opts.initialColorCount : 4;

  const overlay = document.createElement('div');
  overlay.className = 'wz-overlay';
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  const cancel = () => {
    close();
    opts.onCancel?.();
  };

  // Genera la imagen ajustada (con el fondo intacto) utilizando los parámetros actuales
  const adjusted = () => preprocessImage(opts.baseImage, params);

  // ---------- Preprocesamiento de Geometría y Tono ----------
  function stepPreprocess() {
    overlay.innerHTML = `
      <div class="wz-modal lg">
        <div class="wz-head">Preprocesamiento de Imagen · SHAMMAH Studio</div>
        <div class="wz-body">
          <div class="wz-left">
            <div class="wz-canvas checker" id="wzPrev"></div>
            <div class="wz-info">
              <div class="wz-info-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
                ¿Qué tipo de imagen funciona mejor?
              </div>
              <ul>
                <li><strong>Colores sólidos y planos</strong> con formas bien contrastadas y separadas.</li>
                <li><strong>Logos 2D, vectores, iconos o clipart</strong> ofrecen la vectorización más limpia.</li>
              </ul>
              <p class="wz-info-warn"><strong>No recomendado:</strong> Fotografías de objetos reales con sombras graduales o texturas complejas.</p>
              <p>¿Faltan detalles en la silueta? Sube el <strong>Contraste</strong> y la <strong>Exposición</strong> para definir los trazos.</p>
            </div>
          </div>
          <div class="wz-controls">
            <div class="wz-label">Proporción de Recorte</div>
            <div class="seg" id="wzRatio">${RATIOS.map(
              ([k, l]) => `<button data-r="${k}">${l}</button>`,
            ).join('')}</div>

            <div class="wz-row spread">
              <span class="wz-label">Grosor de Relieve / Imagen</span>
              <span class="wz-num"><input type="number" id="wzThick" min="0.2" max="10" step="0.2" /> mm</span>
            </div>

            <div class="wz-label">Ajuste de Tono y Color</div>
            ${SLIDERS.map(
              ([k, l]) => `
              <div class="wz-adj">
                <span>${l}</span>
                <input type="range" data-k="${k}" min="0" max="2" step="0.05" />
                <span class="wz-num"><input type="number" data-n="${k}" min="0" max="2" step="0.05" /></span>
              </div>`,
            ).join('')}
          </div>
        </div>
        <div class="wz-foot">
          <span class="wz-error" id="wzErr" hidden>No se detectó un contorno válido. Ajusta la imagen o el contraste e intenta de nuevo.</span>
          <button id="wzCancel">Cancelar</button>
          <button class="primary" id="wzDone">Confirmar e Importar</button>
        </div>
      </div>`;

    const prev = overlay.querySelector<HTMLElement>('#wzPrev')!;
    const done = overlay.querySelector<HTMLButtonElement>('#wzDone')!;
    const err = overlay.querySelector<HTMLElement>('#wzErr')!;
    
    // Replica la verificación de silueta del motor de renderizado para evitar que
    // el usuario confirme una imagen (p. ej. oscurecida en exceso) que no produciría
    // ningún volumen tridimensional imprimible.
    const redraw = () => {
      const a = adjusted();
      prev.innerHTML = '';
      prev.appendChild(imageToCanvas(a));
      const ok = hasOutline(a, params.keepBackground);
      done.disabled = !ok;
      err.hidden = ok;
    };
    redraw();

    for (const b of overlay.querySelectorAll<HTMLElement>('#wzRatio button')) {
      b.classList.toggle('active', b.dataset.r === params.cropRatio);
      b.addEventListener('click', () => {
        params.cropRatio = b.dataset.r as CropRatio;
        for (const x of overlay.querySelectorAll('#wzRatio button')) x.classList.remove('active');
        b.classList.add('active');
        redraw();
      });
    }

    const thick = overlay.querySelector<HTMLInputElement>('#wzThick')!;
    thick.value = String(params.thicknessMm);
    thick.addEventListener('input', () => (params.thicknessMm = +thick.value || 1));

    let raf = 0;
    const scheduleRedraw = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(redraw);
    };
    for (const [k] of SLIDERS) {
      const range = overlay.querySelector<HTMLInputElement>(`input[data-k="${k}"]`)!;
      const num = overlay.querySelector<HTMLInputElement>(`input[data-n="${k}"]`)!;
      range.value = num.value = String(params[k]);
      const apply = (v: number) => {
        (params[k] as number) = v;
        range.value = num.value = String(v);
        scheduleRedraw();
      };
      range.addEventListener('input', () => apply(+range.value));
      num.addEventListener('input', () => apply(+num.value));
    }

    overlay.querySelector('#wzCancel')!.addEventListener('click', cancel);
    done.addEventListener('click', () => {
      if (done.disabled) return;
      close();
      opts.onComplete({
        adjusted: adjusted(),
        preprocess: { ...params },
        colorCount,
        colorMode: 'normal',
      });
    });
  }

  stepPreprocess();
}

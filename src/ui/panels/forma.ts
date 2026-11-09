import type { BaseShapeKind } from '../../types';
import type { UiCallbacks, UiState } from '../ui';
import type { PanelHandle, PanelModule } from '../shell/types';
import { bindValInput, tip } from '../shared/controls';

/** Tolerancia neutra base (mm). El control muestra la desviación sobre este número. */
const BASE_SOCKET_TOL = 0.4;

const TEMPLATE = `
  <div class="section" id="baseStyleSection">
    <span class="label">Estilo de base ${tip('Contorno recorta la silueta exacta; Forma ubica tu diseño sobre una base sólida predefinida.')}</span>
    <div class="field">
      <div class="tabs" id="shapeTypeTabs" role="tablist" style="margin-bottom: 12px;">
        <button class="tab" data-style="outline" type="button">Contorno</button>
        <button class="tab" data-style="shape" type="button">Forma</button>
      </div>
    </div>
    <div class="field" id="shapeSelectField" style="margin-bottom: 12px;">
      <label for="shapeSelect">Geometría de la forma</label>
      <select id="shapeSelect">
        <option value="circle">Círculo</option>
        <option value="square">Cuadrado</option>
        <option value="hexagon">Hexágono</option>
        <option value="heart">Corazón</option>
        <option value="star">Estrella</option>
        <option value="egg">Huevo</option>
      </select>
    </div>
    <div class="prow-stacked">
      <div class="prow-header">
        <label for="width">Tamaño general ${tip('Longitud máxima de la pieza final (en mm). Escala todo el modelo proporcionalmente.')}</label>
        <input type="text" class="val" id="widthVal" />
      </div>
      <input type="range" id="width" min="20" max="70" step="1" />
    </div>
  </div>

  <div class="section" id="formaSettings">
    <span class="label">Ajustes y Tolerancias P2S</span>
    <div class="prow-stacked">
      <div class="prow-header">
        <label for="topthick">Grosor de respaldo ${tip('Grosor de la base sólida debajo de los colores de la imagen, en mm.')}</label>
        <input type="text" class="val" id="topthickVal" />
      </div>
      <input type="range" id="topthick" min="1" max="4" step="0.1" />
    </div>
    <div class="prow-stacked">
      <div class="prow-header">
        <label for="imgdepth">Relieve del color ${tip('Altura a la que se extruyen los colores por encima de la base, en mm.')}</label>
        <input type="text" class="val" id="imgdepthVal" />
      </div>
      <input type="range" id="imgdepth" min="0.2" max="3" step="0.1" />
    </div>
    <div class="prow-stacked">
      <div class="prow-header">
        <label>Holgura de deslizamiento (Zócalo MX) ${tip('Controla la fricción entre la tapa y la base. (+) afloja, (−) aprieta. Por defecto 0 (0.4mm reales).')}</label>
      </div>
      <div class="tol-stepper" id="socketTolStepper">
        <button class="btn" id="socketTolMinus" type="button">−</button>
        <span class="tol-val" id="socketTolVal">0.00 mm</span>
        <button class="btn" id="socketTolPlus" type="button">+</button>
      </div>
    </div>
    <div class="prow-stacked">
      <div class="prow-header">
        <label>Tolerancia de la cruz (Vástago MX) ${tip('Ajusta el agarre del switch en la tapa. (+) afloja, (−) aprieta. Recomendado +0.05mm si se quiebra al entrar.')}</label>
      </div>
      <div class="tol-stepper" id="stemTolStepper">
        <button class="btn" id="stemTolMinus" type="button">−</button>
        <span class="tol-val" id="stemTolVal">0.0 mm</span>
        <button class="btn" id="stemTolPlus" type="button">+</button>
      </div>
    </div>
  </div>
`;

const fmtSigned = (v: number, dec: number) => (v > 0.0001 ? '+' : v < -0.0001 ? '−' : '') + Math.abs(v).toFixed(dec) + ' mm';

export const formaPanel: PanelModule = {
  id: 'forma',
  mount(host: HTMLElement, cb: UiCallbacks): PanelHandle {
    host.insertAdjacentHTML('beforeend', TEMPLATE);
    const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;

    const shapeTypeTabs = $('shapeTypeTabs');
    const shapeSelect = $<HTMLSelectElement>('shapeSelect');
    shapeTypeTabs.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest('[data-style]') as HTMLElement | null;
      if (!t) return;
      if (t.dataset.style === 'outline') cb.onShape('outline');
      else cb.onShape(shapeSelect.value as BaseShapeKind);
    });
    shapeSelect.addEventListener('change', () => cb.onShape(shapeSelect.value as BaseShapeKind));

    const width = $<HTMLInputElement>('width');
    width.addEventListener('input', () => cb.onWidth(+width.value));
    const topthick = $<HTMLInputElement>('topthick');
    topthick.addEventListener('input', () => cb.onTopThickness(+topthick.value));
    const imgdepth = $<HTMLInputElement>('imgdepth');
    imgdepth.addEventListener('input', () => cb.onImageDepth(+imgdepth.value));

    $('socketTolMinus').addEventListener('click', () => cb.onSocketTolStep(-0.05));
    $('socketTolPlus').addEventListener('click', () => cb.onSocketTolStep(0.05));
    $('stemTolMinus').addEventListener('click', () => cb.onStemTolStep(-0.2));
    $('stemTolPlus').addEventListener('click', () => cb.onStemTolStep(0.2));

    bindValInput('widthVal', width, cb.onWidth);
    bindValInput('topthickVal', topthick, cb.onTopThickness);
    bindValInput('imgdepthVal', imgdepth, cb.onImageDepth);

    const setVal = (id: string, text: string) => {
      const el = $<HTMLInputElement>(id);
      if (document.activeElement !== el) el.value = text;
    };

    return {
      update(state: UiState) {
        width.value = String(state.capWidthMm);
        setVal('widthVal', state.capWidthMm + ' mm');
        topthick.value = String(state.topThickness);
        setVal('topthickVal', state.topThickness.toFixed(1) + ' mm');
        imgdepth.value = String(state.imageDepth);
        setVal('imgdepthVal', state.imageDepth.toFixed(1) + ' mm');
        $('socketTolVal').textContent = fmtSigned(state.tolerance - BASE_SOCKET_TOL, 2);
        $('stemTolVal').textContent = fmtSigned(state.stemTolerance, 1);

        const outlineTab = shapeTypeTabs.querySelector<HTMLElement>('[data-style="outline"]');
        if (outlineTab) outlineTab.style.display = state.importMode === 'icon' ? 'none' : '';
        const treatAsOutline = state.baseShape === 'outline' && state.importMode !== 'icon';
        for (const btn of shapeTypeTabs.querySelectorAll<HTMLElement>('button')) btn.classList.toggle('active', btn.dataset.style === (treatAsOutline ? 'outline' : 'shape'));
        if (treatAsOutline) shapeSelect.disabled = true;
        else { shapeSelect.disabled = false; shapeSelect.value = state.baseShape === 'outline' ? 'circle' : state.baseShape; }
      },
    };
  },
};

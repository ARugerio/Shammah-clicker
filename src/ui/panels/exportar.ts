import type { UiCallbacks, UiState } from '../ui';
import type { PanelHandle, PanelModule } from '../shell/types';

const TEMPLATE = `
  <div class="export-panel">
    <div class="export-summary">
      <span class="export-summary-count">Colores en uso: 0</span>
      <div class="export-chips" aria-label="Colores en uso"></div>
    </div>
    <button class="primary export-btn" id="export" type="button">Descargar 3MF (Bambu Studio)</button>
    <p class="sidebar-credit">Motor base: Vostok Labs · Herramienta personalizada por SHAMMAH 3D</p>
  </div>
`;

export const exportarPanel: PanelModule = {
  id: 'exportar',
  mount(host: HTMLElement, cb: UiCallbacks): PanelHandle {
    host.insertAdjacentHTML('beforeend', TEMPLATE);
    const exportBtn = host.querySelector<HTMLButtonElement>('#export')!;
    const count = host.querySelector<HTMLElement>('.export-summary-count')!;
    const chips = host.querySelector<HTMLElement>('.export-chips')!;
    exportBtn.addEventListener('click', () => cb.onExport());

    return {
      update(state: UiState) {
        exportBtn.disabled = !state.hasParts || state.building;
        const n = state.palette.length;
        count.textContent = `${n === 1 ? 'Color en uso' : 'Colores en uso'}: ${n}`;
        chips.replaceChildren(
          ...state.palette.map((p) => {
            const chip = document.createElement('span');
            chip.className = 'export-chip';
            const [r, g, b] = p.filamentRgb;
            chip.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            chip.title = `rgb(${r}, ${g}, ${b})`;
            return chip;
          }),
        );
      },
    };
  },
};

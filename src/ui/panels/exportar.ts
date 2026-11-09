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
        // Colores distintos del 3MF: regiones (palette ya trae los cambios de paleta), cuerpo, base y piezas.
        const seen = new Set<string>();
        const colors: number[][] = [];
        const add = (rgb: ArrayLike<number> | null | undefined) => {
          if (!rgb) return;
          const k = `${rgb[0]},${rgb[1]},${rgb[2]}`;
          if (seen.has(k)) return;
          seen.add(k);
          colors.push([rgb[0], rgb[1], rgb[2]]);
        };
        state.palette.forEach((p) => add(p.filamentRgb));
        add(state.bodyColorRgb);
        add(state.baseColorOverride);
        Object.values(state.partOverrides ?? {}).forEach(add);
        const n = colors.length;
        count.textContent = `${n === 1 ? 'Color en uso' : 'Colores en uso'}: ${n}`;
        chips.replaceChildren(
          ...colors.map((c) => {
            const chip = document.createElement('span');
            chip.className = 'export-chip';
            const [r, g, b] = c;
            chip.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            chip.title = `rgb(${r}, ${g}, ${b})`;
            return chip;
          }),
        );
      },
    };
  },
};

import type { UiCallbacks, UiState } from '../ui';
import { readTheme } from '../themeStore';

const ico = (inner: string, cls = '') =>
  `<svg${cls ? ` class="${cls}"` : ''} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const btn = (id: string, label: string, title: string, inner: string, extra = '') =>
  `<button id="${id}" class="topbar-btn topbar-action" type="button" aria-label="${label}" title="${title}"${extra}>${inner}</button>`;

const TEMPLATE =
  btn('undoBtn', 'Deshacer', 'Deshacer (Ctrl+Z)', ico('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'), ' disabled') +
  btn('redoBtn', 'Rehacer', 'Rehacer (Ctrl+Shift+Z)', ico('<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'), ' disabled') +
  btn('refreshBtn', 'Revertir', 'Revertir a Original', ico('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'), ' disabled') +
  btn('saveProj', 'Guardar', 'Guardar proyecto', ico('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>')) +
  btn('loadProj', 'Cargar', 'Cargar proyecto', ico('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>')) +
  `<input type="file" id="projFile" accept="application/json" hidden />` +
  btn('helpToggle', 'Ayuda', 'Ayuda', ico('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>')) +
  btn(
    'themeToggle', 'Tema', 'Cambiar tema claro/oscuro',
    ico('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>', 'icon-sun') +
      ico('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>', 'icon-moon') +
      '<span id="themeLabel" class="visually-hidden">Modo Oscuro</span>',
  );

/** Acciones de la barra superior: historial, proyecto, ayuda y tema. */
export function mountTopbarActions(
  host: HTMLElement,
  cb: UiCallbacks,
  opts: { onHelp?: () => void } = {},
): { update(state: UiState): void } {
  host.insertAdjacentHTML('beforeend', TEMPLATE);
  const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;

  const undoBtn = $<HTMLButtonElement>('undoBtn');
  const redoBtn = $<HTMLButtonElement>('redoBtn');
  const refreshBtn = $<HTMLButtonElement>('refreshBtn');
  undoBtn.addEventListener('click', () => cb.onUndo());
  redoBtn.addEventListener('click', () => cb.onRedo());
  refreshBtn.addEventListener('click', () => cb.onRefresh());
  $('saveProj').addEventListener('click', () => cb.onSaveProject());

  const projFile = $<HTMLInputElement>('projFile');
  $('loadProj').addEventListener('click', () => projFile.click());
  projFile.addEventListener('change', () => {
    if (projFile.files?.[0]) cb.onLoadProject(projFile.files[0]);
    projFile.value = '';
  });

  $('helpToggle').addEventListener('click', () => opts.onHelp?.());

  const currentTheme = () => document.documentElement.getAttribute('data-theme') ?? readTheme();
  const themeLabel = $('themeLabel');
  const syncThemeLabel = () => {
    themeLabel.textContent = currentTheme() === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
  };
  syncThemeLabel();
  $('themeToggle').addEventListener('click', () => {
    cb.onThemeChange(currentTheme() === 'dark' ? 'light' : 'dark');
    syncThemeLabel();
  });

  return {
    update(state: UiState) {
      undoBtn.disabled = !state.canUndo;
      redoBtn.disabled = !state.canRedo;
      refreshBtn.disabled = !state.canRefresh;
      syncThemeLabel();
    },
  };
}

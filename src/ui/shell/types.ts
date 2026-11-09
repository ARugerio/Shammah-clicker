import type { UiState, UiCallbacks } from '../ui';

export type PanelId = 'forma' | 'diseno' | 'colores' | 'switch' | 'llavero' | 'exportar';

export interface PanelHandle {
  update(state: UiState): void;
}

export interface PanelModule {
  id: PanelId;
  mount(host: HTMLElement, cb: UiCallbacks): PanelHandle;
}

export interface Shell {
  viewportEl: HTMLElement;
  statusEl: HTMLElement;
  topbarActionsEl: HTMLElement;
  viewerControlsEl: HTMLElement;
  legacyLeftEl: HTMLElement;
  legacyRightEl: HTMLElement;
  panelHost(id: PanelId): HTMLElement;
  openPanel(id: PanelId | null): void;
  openPanelId(): PanelId | null;
}

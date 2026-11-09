import type { UiCallbacks, UiState } from '../ui';

const EYE_OPEN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7c2 0 3.8.6 5.3 1.5M22 12s-3.6 7-10 7c-2 0-3.8-.6-5.3-1.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/></svg>';

/**
 * Controles flotantes del visor: explosión continua de la tapa y ojo para mostrar/ocultar el switch.
 * El deslizador en 0 es la vista ensamblada; cualquier valor mayor es la vista despiezada.
 */
export function mountViewerControls(
  host: HTMLElement,
  cb: UiCallbacks,
  onExplosion: (t: number) => void,
): { update(state: UiState): void } {
  host.insertAdjacentHTML(
    'beforeend',
    `<div class="vc-card">
      <label class="vc-explode">
        <span class="vc-label">Explosión</span>
        <input type="range" min="0" max="1" step="0.01" value="0" aria-label="Explosión" />
      </label>
      <button type="button" class="vc-eye" aria-label="Mostrar switch" title="Mostrar switch" aria-pressed="true">${EYE_OPEN}</button>
    </div>`,
  );
  const slider = host.querySelector<HTMLInputElement>('.vc-explode input')!;
  const eye = host.querySelector<HTMLButtonElement>('.vc-eye')!;

  let exploded = false;
  let showSwitch = true;

  slider.addEventListener('input', () => {
    const t = Math.min(1, Math.max(0, Number(slider.value)));
    const nowExploded = t > 0;
    if (nowExploded !== exploded) {
      exploded = nowExploded;
      cb.onView(nowExploded ? 'exploded' : 'assembled');
    }
    onExplosion(t);
  });

  eye.addEventListener('click', () => cb.onShowSwitch(!showSwitch));

  return {
    update(state) {
      showSwitch = state.showSwitch;
      eye.setAttribute('aria-pressed', String(showSwitch));
      eye.innerHTML = showSwitch ? EYE_OPEN : EYE_OFF;
      // La vista manda: ensamblada fuerza 0; despiezada con el deslizador en 0 (p. ej. al deshacer
      // o cargar un proyecto) lo lleva a 1. Con un valor intermedio no se toca, para no pelear con el arrastre.
      if (state.view === 'assembled') {
        slider.value = '0';
        exploded = false;
      } else if (state.view === 'exploded') {
        if (Number(slider.value) === 0) slider.value = '1';
        exploded = true;
      }
    },
  };
}

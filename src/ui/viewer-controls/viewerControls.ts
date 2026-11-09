import type { UiCallbacks, UiState } from '../ui';

const EYE_OPEN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7c2 0 3.8.6 5.3 1.5M22 12s-3.6 7-10 7c-2 0-3.8-.6-5.3-1.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/></svg>';

const SPLIT = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2.5" width="14" height="6" rx="1.5"/><rect x="5" y="15.5" width="14" height="6" rx="1.5"/><path d="M12 10.5v3M10.5 12 12 10.5 13.5 12M10.5 12 12 13.5 13.5 12"/></svg>';

const DURATION_MS = 350;
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Controles flotantes del visor: un botón que separa o junta las piezas con una animación suave
 * y un ojo para mostrar/ocultar el switch.
 */
export function mountViewerControls(
  host: HTMLElement,
  cb: UiCallbacks,
  onExplosion: (t: number) => void,
): { update(state: UiState): void } {
  host.insertAdjacentHTML(
    'beforeend',
    `<div class="vc-card">
      <button type="button" class="vc-split" aria-label="Juntar piezas" title="Juntar piezas" aria-pressed="true">${SPLIT}</button>
      <button type="button" class="vc-eye" aria-label="Mostrar switch" title="Mostrar switch" aria-pressed="true">${EYE_OPEN}</button>
    </div>`,
  );
  const split = host.querySelector<HTMLButtonElement>('.vc-split')!;
  const eye = host.querySelector<HTMLButtonElement>('.vc-eye')!;

  let separated = true; // la app arranca despiezada
  let t = 1; // separación actual (0 a 1)
  let lastView: string | null = null;
  let showSwitch = true;
  let raf = 0;

  const paint = () => {
    const label = separated ? 'Juntar piezas' : 'Separar piezas';
    split.setAttribute('aria-label', label);
    split.title = label;
    split.setAttribute('aria-pressed', String(separated));
  };
  const cancel = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  const emit = (v: number) => {
    t = v;
    onExplosion(v);
  };
  const animateTo = (target: number) => {
    cancel();
    const from = t;
    if (from === target) return;
    if (prefersReducedMotion()) {
      emit(target);
      return;
    }
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const p = Math.min(1, (now - start) / DURATION_MS);
      if (p >= 1) {
        raf = 0;
        emit(target);
        return;
      }
      emit(from + (target - from) * easeOut(p));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  split.addEventListener('click', () => {
    const from = t;
    separated = !separated;
    lastView = separated ? 'exploded' : 'assembled';
    cb.onView(separated ? 'exploded' : 'assembled');
    // El visor salta al extremo al cambiar de vista; se repone el valor actual para animar desde ahí.
    emit(from);
    paint();
    animateTo(separated ? 1 : 0);
  });

  eye.addEventListener('click', () => cb.onShowSwitch(!showSwitch));

  return {
    update(state) {
      showSwitch = state.showSwitch;
      eye.setAttribute('aria-pressed', String(showSwitch));
      eye.innerHTML = showSwitch ? EYE_OPEN : EYE_OFF;
      if (state.view === lastView) return; // sin cambio de vista: no se toca la animación
      lastView = state.view;
      if (state.view === 'exploded' || state.view === 'assembled') {
        separated = state.view === 'exploded';
        cancel();
        emit(separated ? 1 : 0);
        paint();
      }
    },
  };
}

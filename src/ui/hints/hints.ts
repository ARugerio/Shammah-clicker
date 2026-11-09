// Pistas de primera visita: una tarjeta pequeña sobre el dock, sin bloquear la interfaz.
// El descarte se recuerda en localStorage; si el almacenamiento falla, las pistas salen en cada visita.
export const HINTS_KEY = 'shammah-hints-v1';

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(HINTS_KEY) === '1';
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    localStorage.setItem(HINTS_KEY, '1');
  } catch {
    /* almacenamiento bloqueado: las pistas volverán en la próxima visita */
  }
}

export function mountHints(dock: HTMLElement): { show(): void; dismiss(): void } {
  const card = document.createElement('div');
  card.className = 'hints-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', 'Pistas para empezar');
  card.hidden = true;
  card.innerHTML = `
    <p class="hints-title">Para empezar</p>
    <ol class="hints-steps">
      <li><strong>Elige o sube un diseño</strong> en Diseño.</li>
      <li><strong>Ajusta</strong> la forma, los colores y el switch.</li>
      <li><strong>Exporta</strong> tu 3MF para Bambu Studio en Exportar.</li>
    </ol>
    <button type="button" class="hints-close">Cerrar</button>`;
  // Va dentro del contenedor del dock para anclarse justo encima de él.
  (dock.parentElement ?? dock).appendChild(card);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') dismiss();
  };

  function show(): void {
    if (!card.hidden) return;
    card.hidden = false;
    document.addEventListener('keydown', onKey);
  }

  function dismiss(): void {
    card.hidden = true;
    document.removeEventListener('keydown', onKey);
    persistDismissed();
  }

  card.querySelector<HTMLButtonElement>('.hints-close')!.addEventListener('click', dismiss);
  if (!wasDismissed()) show();
  return { show, dismiss };
}

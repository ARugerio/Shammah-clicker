/** Controles compartidos por los paneles (ayuda emergente y campo numérico enlazado a un deslizador). */

/** Burbuja de ayuda "?" con el texto como atributo accesible. Devuelve HTML. */
export const tip = (text: string) =>
  `<span class="help-tip" tabindex="0" role="img" aria-label="Ayuda: ${text.replace(/"/g, '&quot;')}" data-tip="${text.replace(/"/g, '&quot;')}">?</span>`;

/**
 * Enlaza el campo de texto `valId` con un deslizador: al confirmar (Enter o perder foco)
 * lee el número, lo acota al rango del deslizador y llama a `callback`.
 */
export function bindValInput(valId: string, slider: HTMLInputElement, callback: (v: number) => void, parse?: (raw: number) => number) {
  const el = document.getElementById(valId) as HTMLInputElement;
  const commit = () => {
    const raw = parseFloat(el.value.replace(/[^0-9.\-]/g, ''));
    if (isNaN(raw)) return;
    const v = parse ? parse(raw) : raw;
    const clamped = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), v));
    slider.value = String(clamped);
    callback(clamped);
  };
  el.addEventListener('focus', () => el.select());
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); el.blur(); } });
  el.addEventListener('blur', commit);
}

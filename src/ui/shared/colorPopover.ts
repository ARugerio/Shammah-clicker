/** Popover flotante para elegir un color de filamento (paleta lateral y clic en el modelo 3D). */
import type { RGB } from '../../types';
import { FILAMENTS } from '../../types';

export const rgbHex = (rgb: RGB) =>
  '#' + rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');

export const hexRgb = (hex: string): RGB => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/** Filamento de catálogo más cercano a `rgb`: [nombre, hex]. */
export function getFilamentNameAndHex(rgb: RGB): [string, string] {
  let bestHex = rgbHex(rgb);
  let bestName = 'Color Personalizado';
  let bestD = Infinity;
  for (const [name, hex] of FILAMENTS) {
    const [fr, fg, fb] = hexRgb(hex);
    const dr = rgb[0] - fr;
    const dg = rgb[1] - fg;
    const db = rgb[2] - fb;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      bestHex = hex;
      bestName = name;
    }
  }
  return [bestName, bestHex];
}

export interface ColorPopoverHandlers {
  onSelect(hex: string): void;
  onClose?(): void;
}

/** Retira el popover abierto y sus manejadores sin avisar a su `onClose` (lo reemplaza otro). */
let teardownCurrent: (() => void) | null = null;

export function showColorPopoverAt(clientX: number, clientY: number, currentHex: string, options: RGB[], handlers: ColorPopoverHandlers): void {
  teardownCurrent?.();
  document.getElementById('sbColorPopover')?.remove();
  const popover = document.createElement('div');
  popover.id = 'sbColorPopover';
  popover.className = 'color-popover';
  document.body.appendChild(popover);

  const dismiss = (e: MouseEvent) => { if (!popover.contains(e.target as Node)) close(); };
  // El clic-fuera se arma con un pequeño retraso para que el clic que abrió el popover no lo cierre.
  let armTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    armTimer = null;
    document.addEventListener('mousedown', dismiss);
  }, 50);

  let done = false;
  const teardown = () => {
    done = true;
    if (armTimer !== null) { clearTimeout(armTimer); armTimer = null; }
    else document.removeEventListener('mousedown', dismiss);
    popover.remove();
    if (teardownCurrent === teardown) teardownCurrent = null;
  };
  const close = () => {
    if (done) return;
    teardown();
    handlers.onClose?.();
  };
  teardownCurrent = teardown;

  options.forEach((rgb) => {
    const hex = rgbHex(rgb);
    const [name] = getFilamentNameAndHex(rgb);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.background = hex;
    btn.title = name;
    if (hex.toLowerCase() === currentHex.toLowerCase()) btn.classList.add('active');
    btn.addEventListener('click', () => { handlers.onSelect(hex); close(); });
    popover.appendChild(btn);
  });

  const custom = document.createElement('label');
  custom.className = 'cp-custom';
  custom.title = 'Color personalizado (Hex)';
  const inp = document.createElement('input');
  inp.type = 'color';
  inp.value = /^#[0-9a-f]{6}$/i.test(currentHex) ? currentHex : '#888888';
  inp.addEventListener('input', () => handlers.onSelect(inp.value));
  custom.appendChild(inp);
  popover.appendChild(custom);

  const w = popover.offsetWidth || 170;
  const h = popover.offsetHeight || 180;
  popover.style.left = `${Math.max(8, Math.min(clientX, window.innerWidth - w - 8))}px`;
  popover.style.top = `${Math.max(8, Math.min(clientY, window.innerHeight - h - 8))}px`;
}

/** Abre el popover justo debajo de `triggerEl` con los filamentos `options` ([nombre, hex]). */
export function showColorPickerBelow(triggerEl: HTMLElement, currentHex: string, options: [string, string][], onSelect: (hex: string) => void): void {
  const rect = triggerEl.getBoundingClientRect();
  showColorPopoverAt(rect.left, rect.bottom + 6, currentHex, options.map(([, hex]) => hexRgb(hex)), { onSelect });
}

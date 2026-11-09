/** Aviso que dice dónde está el botón que aplica el cambio pendiente (panel Diseño, SVG o Texto). */
export const GENERATE_HINT = 'Pulsa «Generar geometría» en el panel Diseño para ver el cambio.';

export const msgSvgSelected = (name: string) => `SVG seleccionado: ${name}. ${GENERATE_HINT}`;
export const msgIconSelected = (name: string) => `Icono seleccionado: ${name}. ${GENERATE_HINT}`;
export const msgTextChanged = () => `Texto actualizado. ${GENERATE_HINT}`;
export const msgFontChanged = () => `Fuente cambiada. ${GENERATE_HINT}`;
export const msgFontImported = (name: string) => `¡Fuente ${name} importada! ${GENERATE_HINT}`;

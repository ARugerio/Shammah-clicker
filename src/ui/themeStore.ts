export type Theme = 'light' | 'dark';
export const THEME_KEY = 'clicker-theme';

/** Lee el tema guardado; claro si el almacenamiento está bloqueado, vacío o con un valor inválido. */
export function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function writeTheme(theme: string): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* almacenamiento bloqueado: el tema solo dura la sesión */
  }
}

/** Aplica el tema guardado a <html> y lo devuelve. */
export function applyStoredTheme(): Theme {
  const theme = readTheme();
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
}

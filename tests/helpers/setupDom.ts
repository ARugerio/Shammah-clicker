// Stubs de APIs de navegador que happy-dom no trae (o que createUi usa al montar).
// Importar ANTES de src/ui/ui.ts.
const g = globalThis as any;

if (!g.matchMedia) {
  g.matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, dispatchEvent: () => false,
  });
}
if (!g.ResizeObserver) {
  g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}
// Las fuentes se piden por red en el navegador; en la prueba no hay nada que cargar.
g.fetch = async () => new Response('', { status: 404 });

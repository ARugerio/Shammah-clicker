import type { PanelId, Shell } from './types';

const svg = (inner: string) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const PANELS: { id: PanelId; label: string; icon: string }[] = [
  { id: 'forma', label: 'Forma', icon: svg('<path d="M12 3 3 8v8l9 5 9-5V8z"/><path d="m3 8 9 5 9-5M12 13v8"/>') },
  { id: 'diseno', label: 'Diseño', icon: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4-4L5 21"/>') },
  { id: 'colores', label: 'Colores', icon: svg('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2H17a4 4 0 0 0 4-4c0-4.4-4-7.4-9-7.400Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16.5" cy="10" r="1"/>') },
  { id: 'switch', label: 'Switch', icon: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>') },
  { id: 'llavero', label: 'Llavero', icon: svg('<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.300M16 7l3 3M14 9l2 2"/>') },
  { id: 'exportar', label: 'Exportar', icon: svg('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>') },
];

const BACK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const WA_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.920v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.670A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.110L8.09 9.910a16 16 0 0 0 6 6l1.27-1.270a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.920z"/></svg>';
const MENU_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';

/** Construye el esqueleto: barra superior, visor a pantalla completa, drawers provisionales y dock. */
export function createShell(root: HTMLElement): Shell {
  root.innerHTML = `
    <header id="topbar">
      <div class="topbar-group topbar-left">
        <a class="topbar-btn topbar-back" href="https://arugerio.github.io/Shammah3d/">${BACK_ICON}<span class="topbar-label">Volver al Mostrador</span></a>
        <span class="topbar-brand">SHAMMAH Studio<span class="topbar-label"> · Bambu Lab P2S</span></span>
      </div>
      <div class="topbar-group topbar-right">
        <div class="topbar-group" data-slot="topbar-actions"></div>
        <button type="button" class="topbar-btn" data-drawer="left" aria-expanded="false" aria-label="Opciones (izquierda)">${MENU_ICON}<span class="topbar-label">Opciones</span></button>
        <button type="button" class="topbar-btn" data-drawer="right" aria-expanded="false" aria-label="Ajustes (derecha)">${MENU_ICON}<span class="topbar-label">Ajustes</span></button>
        <a class="topbar-btn topbar-wa" href="https://api.whatsapp.com/send?phone=5215559650025" target="_blank" rel="noopener noreferrer">${WA_ICON}<span class="topbar-label">Soporte WhatsApp</span></a>
      </div>
    </header>
    <div id="layout">
      <div id="viewport">
        <div id="app"></div>
        <div id="status">Iniciando motor 3D...</div>
        <div class="viewer-controls" data-slot="viewer-controls"></div>
      </div>
      <aside id="sidebar-left" class="sidebar left legacy-drawer" hidden></aside>
      <aside id="sidebar-right" class="sidebar right legacy-drawer" hidden></aside>
      <div class="dock-wrap">
        <div class="dock-panels"></div>
        <nav class="dock" aria-label="Herramientas"></nav>
      </div>
    </div>`;

  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const panelsEl = q('.dock-panels');
  const dockEl = q('.dock');
  const hosts = new Map<PanelId, HTMLElement>();
  const panelEls = new Map<PanelId, HTMLElement>();
  const btns = new Map<PanelId, HTMLButtonElement>();

  for (const p of PANELS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dock-btn';
    btn.setAttribute('aria-label', p.label);
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `${p.icon}<span class="dock-label">${p.label}</span>`;
    dockEl.appendChild(btn);
    btns.set(p.id, btn);

    const panel = document.createElement('section');
    panel.className = 'dock-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', p.label);
    const host = document.createElement('div');
    host.className = 'dock-panel-body';
    panel.appendChild(host);
    panelsEl.appendChild(panel);
    panelEls.set(p.id, panel);
    hosts.set(p.id, host);
  }

  let current: PanelId | null = null;
  const ac = new AbortController();
  const openPanel = (id: PanelId | null) => {
    if (id !== null && !hosts.has(id)) return;
    current = id;
    for (const p of PANELS) {
      const open = p.id === id;
      panelEls.get(p.id)!.hidden = !open;
      btns.get(p.id)!.setAttribute('aria-expanded', String(open));
    }
  };
  for (const p of PANELS) {
    btns.get(p.id)!.addEventListener('click', () => openPanel(current === p.id ? null : p.id));
  }
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && current !== null) openPanel(null);
    },
    { signal: ac.signal },
  );

  // Drawers provisionales (barras viejas): abiertos por defecto solo en pantallas anchas.
  const wide = typeof window.innerWidth === 'number' && window.innerWidth >= 1000;
  root.querySelectorAll<HTMLButtonElement>('[data-drawer]').forEach((btn) => {
    const drawer = q(btn.dataset.drawer === 'left' ? '#sidebar-left' : '#sidebar-right');
    const set = (open: boolean) => {
      drawer.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    };
    set(wide);
    btn.addEventListener('click', () => set(drawer.hidden));
  });

  return {
    viewportEl: q('#viewport'),
    statusEl: q('#status'),
    topbarActionsEl: q('[data-slot="topbar-actions"]'),
    viewerControlsEl: q('[data-slot="viewer-controls"]'),
    legacyLeftEl: q('#sidebar-left'),
    legacyRightEl: q('#sidebar-right'),
    panelHost: (id) => hosts.get(id)!,
    openPanel,
    openPanelId: () => current,
    dispose: () => ac.abort(),
  };
}

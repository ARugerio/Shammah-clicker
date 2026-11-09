import type { UiCallbacks, UiState } from '../ui';
import type { PanelHandle, PanelModule } from '../shell/types';
import { tip } from '../shared/controls';

/** Paso (mm) de cada pulsación de las flechas del pad. */
const SWITCH_STEP = 1;

// El contenedor conserva el id `sectionSwitch` porque el tutorial lo señala.
const TEMPLATE = `
  <div class="section" id="sectionSwitch">
    <span class="label">3 · Posición de Interruptor</span>
  <div class="field" style="margin-bottom:10px;">
        <label>Nº de Switches ${tip('Puedes usar de 1 a 3 switches mecánicos para piezas muy anchas o largas.')}</label>
        <div class="tabs" id="switchCount" role="tablist">
          <button class="tab active" data-count="1" type="button">1</button>
          <button class="tab" data-count="2" type="button">2</button>
          <button class="tab" data-count="3" type="button">3</button>
        </div>
      </div>
      <div class="tabs" id="switchChips" role="tablist" style="display:none; margin-bottom:10px;"></div>
      <p class="switch-pad-hint">Mover y rotar switch MX interno</p>
      <div class="switch-pad" id="switchPad">
        <button type="button" class="switch-pad-btn pad-rotl" data-rot="3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <button type="button" class="switch-pad-btn pad-rotr" data-rot="-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
        <button type="button" class="switch-pad-btn pad-up" data-dir="up">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
        </button>
        <button type="button" class="switch-pad-btn pad-left" data-dir="left">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        </button>
        <button type="button" class="switch-pad-center" id="switchReset" title="Centrar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
        </button>
        <button type="button" class="switch-pad-btn pad-right" data-dir="right">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
        <button type="button" class="switch-pad-btn pad-down" data-dir="down">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
        </button>
      </div>
      <div class="switch-pad-readout" id="switchReadout">Centrado</div>
      <button class="secondary" id="switchResetAll" type="button" style="display:none; width:100%; margin-top:8px;">Reiniciar posiciones</button>
  </div>
`;

export const switchPanel: PanelModule = {
  id: 'switch',
  mount(host: HTMLElement, cb: UiCallbacks): PanelHandle {
    host.insertAdjacentHTML('beforeend', TEMPLATE);
    const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;

    $('switchPad').addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const rotBtn = target.closest('[data-rot]') as HTMLElement | null;
      if (rotBtn) { cb.onSwitchRotate(+rotBtn.dataset.rot!); return; }
      const btn = target.closest('[data-dir]') as HTMLElement | null;
      if (!btn) return;
      switch (btn.dataset.dir) {
        case 'up': cb.onSwitchNudge(0, SWITCH_STEP); break;
        case 'down': cb.onSwitchNudge(0, -SWITCH_STEP); break;
        case 'left': cb.onSwitchNudge(-SWITCH_STEP, 0); break;
        case 'right': cb.onSwitchNudge(SWITCH_STEP, 0); break;
      }
    });
    $('switchReset').addEventListener('click', () => cb.onSwitchReset());
    $('switchCount').addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest('[data-count]') as HTMLElement | null;
      if (t) cb.onSwitchCount(+t.dataset.count!);
    });
    $('switchChips').addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest('[data-sw]') as HTMLElement | null;
      if (t) cb.onActiveSwitch(+t.dataset.sw!);
    });
    $('switchResetAll').addEventListener('click', () => cb.onSwitchResetAll());

    return {
      update(state: UiState) {
        const switchCountN = state.switches.length;
        const activeIdx = Math.min(state.activeSwitchIndex, switchCountN - 1);
        const active = state.switches[activeIdx] ?? { x: 0, y: 0, rotation: 0 };
        const bits: string[] = [];
        if (Math.abs(active.x) >= 0.05 || Math.abs(active.y) >= 0.05) bits.push(`X ${active.x > 0 ? '+' : ''}${active.x.toFixed(1)} · Y ${active.y > 0 ? '+' : ''}${active.y.toFixed(1)} mm`);
        if (Math.abs(active.rotation) >= 0.5) bits.push(`${active.rotation > 0 ? '↺' : '↻'} ${Math.abs(active.rotation)}°`);
        const body = bits.length ? bits.join('  ·  ') : 'Centrado';
        $('switchReadout').textContent = switchCountN > 1 ? `S${activeIdx + 1} · ${body}` : body;

        for (const b of $('switchCount').querySelectorAll<HTMLElement>('[data-count]')) b.classList.toggle('active', +b.dataset.count! === switchCountN);

        const chipsEl = $('switchChips');
        if (switchCountN > 1) {
          chipsEl.style.display = 'flex';
          if (chipsEl.querySelectorAll('[data-sw]').length !== switchCountN) {
            chipsEl.innerHTML = state.switches.map((_, i) => `<button class="tab" data-sw="${i}" type="button">S${i + 1}</button>`).join('');
          }
          for (const b of chipsEl.querySelectorAll<HTMLElement>('[data-sw]')) b.classList.toggle('active', +b.dataset.sw! === activeIdx);
        } else {
          chipsEl.style.display = 'none';
        }
        $('switchResetAll').style.display = switchCountN > 1 ? 'block' : 'none';
      },
    };
  },
};

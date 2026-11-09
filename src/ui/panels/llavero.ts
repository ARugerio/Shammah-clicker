import type { UiCallbacks, UiState } from '../ui';
import type { PanelHandle, PanelModule } from '../shell/types';
import { tip } from '../shared/controls';

const TEMPLATE = `
  <div class="keychain-panel" style="margin-bottom: 16px;">
    <div class="switch-row" style="margin-bottom: 12px;">
      <span class="switch-label">Llavero ${tip('Agrega un aro para enganchar tu clicker a las llaves.')}</span>
      <label class="toggle"><input id="keychain" type="checkbox" /><span class="slider"></span></label>
    </div>
    <div id="keychainOpts" style="display:none;">
      <div class="prow-stacked">
        <div class="prow-header"><label>Posición del aro</label></div>
        <div class="tol-stepper" id="keychainRotStepper">
          <button class="btn" id="keychainRotMinus" type="button">⟲</button>
          <span class="tol-val" id="keychainAngleVal">90°</span>
          <button class="btn" id="keychainRotPlus" type="button">⟳</button>
        </div>
      </div>
      <div class="prow-stacked">
        <div class="prow-header"><label>Deslizamiento (offset)</label></div>
        <div class="tol-stepper" id="keychainOffsetStepper">
          <button class="btn" id="keychainOffsetMinus" type="button">−</button>
          <span class="tol-val" id="keychainOffsetVal">0.0 mm</span>
          <button class="btn" id="keychainOffsetPlus" type="button">+</button>
        </div>
      </div>
      <div class="prow-stacked">
        <div class="prow-header"><label>Tamaño del agujero</label></div>
        <div class="tol-stepper" id="keychainSizeStepper">
          <button class="btn" id="keychainSizeMinus" type="button">−</button>
          <span class="tol-val" id="keychainSizeVal">5.2 mm</span>
          <button class="btn" id="keychainSizePlus" type="button">+</button>
        </div>
      </div>
    </div>
  </div>
`;

export const llaveroPanel: PanelModule = {
  id: 'llavero',
  mount(host: HTMLElement, cb: UiCallbacks): PanelHandle {
    host.insertAdjacentHTML('beforeend', TEMPLATE);
    const $ = <T extends HTMLElement>(id: string) => host.querySelector<T>('#' + id)!;

    const keychain = $<HTMLInputElement>('keychain');
    keychain.addEventListener('change', () => cb.onKeychainToggle(keychain.checked));
    $('keychainRotMinus').addEventListener('click', () => cb.onKeychainRotate(-15));
    $('keychainRotPlus').addEventListener('click', () => cb.onKeychainRotate(15));
    $('keychainOffsetMinus').addEventListener('click', () => cb.onKeychainOffset(-1.0));
    $('keychainOffsetPlus').addEventListener('click', () => cb.onKeychainOffset(1.0));
    $('keychainSizeMinus').addEventListener('click', () => cb.onKeychainSize(-0.4));
    $('keychainSizePlus').addEventListener('click', () => cb.onKeychainSize(0.4));

    return {
      update(state: UiState) {
        const kc = state.keychain;
        keychain.checked = kc.enabled;
        $('keychainOpts').style.display = kc.enabled ? '' : 'none';
        $('keychainAngleVal').textContent = `${Math.round((((kc.angleDeg % 360) + 360) % 360))}°`;
        $('keychainOffsetVal').textContent = `${(kc.offsetMm ?? 0.0).toFixed(1)} mm`;
        $('keychainSizeVal').textContent = `${kc.holeDiameterMm.toFixed(1)} mm`;
      },
    };
  },
};

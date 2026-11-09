import type { UiCallbacks } from '../../src/ui/ui';

/** Callbacks que registran sus argumentos en `calls[nombre]` (una entrada por invocación). */
export function makeCallbacks(): { cb: UiCallbacks; calls: Record<string, unknown[][]> } {
  const calls: Record<string, unknown[][]> = {};
  const rec = (name: string) => (...args: unknown[]) => {
    (calls[name] ??= []).push(args);
  };
  const cb = {
    onUpload: rec('onUpload'),
    onSample: rec('onSample'),
    onColorCount: rec('onColorCount'),
    onSmoothing: rec('onSmoothing'),
    onFilament: rec('onFilament'),
    onShape: rec('onShape'),
    onWidth: rec('onWidth'),
    onTopThickness: rec('onTopThickness'),
    onImageDepth: rec('onImageDepth'),
    onSocketTolStep: rec('onSocketTolStep'),
    onStemTolStep: rec('onStemTolStep'),
    onSwitchNudge: rec('onSwitchNudge'),
    onSwitchRotate: rec('onSwitchRotate'),
    onSwitchReset: rec('onSwitchReset'),
    onSwitchCount: rec('onSwitchCount'),
    onActiveSwitch: rec('onActiveSwitch'),
    onSwitchResetAll: rec('onSwitchResetAll'),
    onKeychainToggle: rec('onKeychainToggle'),
    onKeychainRotate: rec('onKeychainRotate'),
    onKeychainSize: rec('onKeychainSize'),
    onKeychainOffset: rec('onKeychainOffset'),
    onRemoveBg: rec('onRemoveBg'),
    onView: rec('onView'),
    onShowSwitch: rec('onShowSwitch'),
    onSection: rec('onSection'),
    onExport: rec('onExport'),
    onRenderPng: rec('onRenderPng'),
    onAiPrompt: rec('onAiPrompt'),
    onSaveProject: rec('onSaveProject'),
    onLoadProject: rec('onLoadProject'),
    onBodyColor: rec('onBodyColor'),
    onImportMode: rec('onImportMode'),
    onSvgUpload: rec('onSvgUpload'),
    onSelectSvg: rec('onSelectSvg'),
    onSelectIcon: rec('onSelectIcon'),
    onTextChange: rec('onTextChange'),
    onFontSelect: rec('onFontSelect'),
    onImportFont: rec('onImportFont'),
    onThemeChange: rec('onThemeChange'),
    onEditMode: rec('onEditMode'),
    onEdgeStyle: rec('onEdgeStyle'),
    onEdgeStep: rec('onEdgeStep'),
    onExtrudeStep: rec('onExtrudeStep'),
    onExtrudeChamfer: rec('onExtrudeChamfer'),
    onSeparateLetters: rec('onSeparateLetters'),
    onGenerate: rec('onGenerate'),
    onUndo: rec('onUndo'),
    onRedo: rec('onRedo'),
    onRefresh: rec('onRefresh'),
  } as unknown as UiCallbacks;
  return { cb, calls };
}

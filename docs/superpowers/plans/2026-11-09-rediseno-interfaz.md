# Rediseño de interfaz SHAMMAH Clicker Studio — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar las tres columnas heredadas por un visor a pantalla completa con dock de paneles flotantes, estilo "Taller cálido", código de interfaz dividido en componentes y contenido propio, sin tocar el motor ni el 3MF que se exporta.

**Architecture:** `createUi` conserva su firma (más un parámetro opcional `shell`) y pasa a componer módulos de panel (`PanelModule`) montados en el dock. Durante la migración las barras laterales viejas siguen funcionando como "drawers" provisionales y cada panel migrado sale de ellas; al final se eliminan. Una red de pruebas (IDs del DOM y 3MF dorado) protege cada paso.

**Tech Stack:** Vite, TypeScript, Vitest + happy-dom (nuevas, MIT), three, manifold-3d (sin cambios).

**Spec:** `docs/superpowers/specs/2026-11-09-rediseno-interfaz-design.md` (repo `~/Shammah-clicker-studio`, rama `rediseno` cortada desde `higiene-legal`).

## Global Constraints

- Rama de trabajo `rediseno`; sin push, sin deploy, sin publicar nada sin confirmación de la persona.
- El crédito a Vostok Labs debe ser visible en la interfaz nueva (texto "Motor base: Vostok Labs · Herramienta personalizada por SHAMMAH 3D").
- Congelado: `src/geometry/`, `src/export/`, `src/image/` (salvo la lista de muestras de `src/image/sample.ts`), `src/viewer/` (salvo añadir `setExplosion`, ver Tarea 9), el contrato `UiCallbacks` y `public/assets/switch/mx/*.3mf`.
- Interfaz 100% en español. Tipografía Plus Jakarta Sans 400–800.
- Tokens Taller cálido: fondo crema `#f6f1ea`, superficie blanca, borde `#ddd2c2`, acento `#db2777`, texto `#1f1b16`, texto apagado `#8a7f70`, sombra suave, radios 12–16 px, espaciado en múltiplos de 8 px. Tema claro por defecto, oscuro opcional.
- Debe funcionar en escritorio y en móvil de 375 px de ancho, sin scroll horizontal de página.
- Cada tarea deja en verde: `npm test`, `npm run typecheck`, `npm run build`.
- Dependencias nuevas se anotan en `CREDITS.md` en el mismo commit.
- Navegador: las verificaciones "en el navegador" usan el servidor `npm run dev` (puerto 5180, `--strictPort`) y el panel del navegador; se detiene al terminar.

## Review Focus

1. Mover HTML pierde un ID o un evento sin que se note: la prueba de IDs (únicos y existentes) y una prueba de callbacks por panel corren en cada tarea. → Tareas 1 y 3–8.
2. Dock y paneles en móvil de 375 px: el panel no se sale de la pantalla, solo hay uno abierto, Escape lo cierra, los botones tienen etiqueta accesible. → Tarea 2.
3. `localStorage` bloqueado (modo privado) rompe tema o pistas de primera vez: debe caer a los valores por defecto sin lanzar. → Tareas 8 y 10.
4. `update(state)` llega con un panel cerrado o mientras se escribe en un campo: no pierde el valor ni el foco. → Tarea 2 (contrato) y Tarea 6 (campo de texto).
5. El 3MF exportado cambia por accidente: la prueba dorada falla. → Tarea 1, corre siempre.
6. El crédito a Vostok desaparece en un tema o tamaño de pantalla: prueba de que existe en el DOM en claro y oscuro. → Tarea 8.

---

### Task 1: Red de seguridad y fotos "antes" (Fase 0)

**Files:**
- Modify: `vitest.config.ts`, `package.json`, `.gitignore`, `CREDITS.md`
- Delete: `tests/unit/font-manager.test.ts` (importa `src/modules/font-manager/loadFont`, que no existe)
- Create: `tests/helpers/loadDefaultParts.ts`, `tests/helpers/idInventory.ts`, `tests/fixtures/uiState.ts`, `tests/fixtures/callbacks.ts`, `tests/golden-3mf.test.ts`, `tests/ids.test.ts`, `tests/__snapshots__/` (generado), `docs/rediseno/antes/`

**Interfaces:**
- Consumes: `buildThreeMF(parts: ClickerPart[]): Uint8Array` (`src/export/threemfExport.ts`), `createUi(sidebarLeft, sidebarRight, statusEl, cb)` y `UiState`/`UiCallbacks` (`src/ui/ui.ts`), `ClickerPart` (`src/types.ts`).
- Produces:
  - `loadDefaultParts(): ClickerPart[]` — lee `public/assets/default-clicker.json` y lo convierte igual que `loadDefaultClicker` en `src/main.ts` (Float32Array/Uint32Array).
  - `collectReferencedIds(): string[]` — IDs que `src/**/*.ts` busca con `getElementById('x')`, `$('x')`/`$<T>('x')` o `querySelector('#x')`.
  - `makeUiState(over?: Partial<UiState>): UiState` y `makeCallbacks(): { cb: UiCallbacks; calls: Record<string, unknown[][]> }` (cada callback registra sus argumentos).

- [ ] **Step 1: Crear la rama** con `git checkout -b rediseno` (desde `higiene-legal`) y verificar `git branch --show-current` = `rediseno`. Añadir `.superpowers/` a `.gitignore`.
- [ ] **Step 2: Capturas "antes".** Con `npm run dev` y el panel del navegador, guardar capturas del estado actual (escritorio 1440×860 y móvil 375 px, con el modal de bienvenida cerrado) en `docs/rediseno/antes/escritorio.png` y `movil.png`.
- [ ] **Step 3: Escribir las pruebas que fallan.**
  - `tests/golden-3mf.test.ts`: `buildThreeMF(loadDefaultParts())` → `unzipSync` (fflate); afirma que existen `[Content_Types].xml`, `3D/3dmodel.model` y `Metadata/model_settings.config`; calcula SHA-256 de cada archivo de texto tras quitar `CreationDate`, `ModificationDate` y atributos `UUID`; `expect(hashes).toMatchSnapshot()`; corre dos veces para comprobar que es determinista.
  - `tests/ids.test.ts` (`// @vitest-environment happy-dom`): carga el `<body>` de `index.html`, llama `createUi(...)` con `makeCallbacks().cb` y `ui.update(makeUiState())`; afirma que cada ID de `collectReferencedIds()` existe en el DOM (salvo los listados en una lista permitida con comentario de por qué se crean bajo demanda) y que no hay IDs duplicados (`[id]` únicos).
- [ ] **Step 4: Ejecutar y ver que falla:** `npx vitest run` → FAIL (la configuración actual importa `@vitejs/plugin-react`, que no está instalado, y `vitest`/`happy-dom` no están en `package.json`).
- [ ] **Step 5: Arreglar la base.** Instalar `vitest` y `happy-dom` como devDependencies; `scripts.test` = `vitest run`; reescribir `vitest.config.ts` con `environment: 'node'` e `include: ['tests/**/*.test.ts']` (sin React ni jsdom); eliminar la prueba vieja; añadir `vitest` y `happy-dom` (MIT) a `CREDITS.md`. Si `createUi` necesita APIs ausentes en happy-dom (`matchMedia`, `ResizeObserver`, `fetch` de fuentes), añadir stubs en un `tests/helpers/setupDom.ts` importado por la prueba.
- [ ] **Step 6: Verificar:** `npm test` → PASS dos veces seguidas (snapshot estable); `npm run typecheck` y `npm run build` sin errores.
- [ ] **Step 7: Commit** (`test: red de seguridad con vitest, IDs del DOM y 3MF dorado`) incluyendo el snapshot y las capturas.

### Task 2: Tokens, esqueleto y dock (Fase 1)

**Files:**
- Create: `src/ui/theme.css`, `src/ui/shell/types.ts`, `src/ui/shell/shell.ts`, `src/ui/shell/shell.css`
- Modify: `index.html`, `src/main.ts`, `src/ui/ui.ts` (solo la firma), `src/style.css` (las barras viejas pasan a `.legacy-drawer`)
- Test: `tests/ui/shell.test.ts`

**Interfaces:**
- Consumes: `UiState`, `UiCallbacks` (`src/ui/ui.ts`); `makeCallbacks`, `makeUiState` (Tarea 1).
- Produces:
  - `type PanelId = 'forma' | 'diseno' | 'colores' | 'switch' | 'llavero' | 'exportar'`
  - `interface PanelHandle { update(state: UiState): void }`
  - `interface PanelModule { id: PanelId; mount(host: HTMLElement, cb: UiCallbacks): PanelHandle }`
  - `interface Shell { viewportEl: HTMLElement; statusEl: HTMLElement; topbarActionsEl: HTMLElement; viewerControlsEl: HTMLElement; legacyLeftEl: HTMLElement; legacyRightEl: HTMLElement; panelHost(id: PanelId): HTMLElement; openPanel(id: PanelId | null): void; openPanelId(): PanelId | null }`
  - `createShell(root: HTMLElement): Shell` (en `src/ui/shell/shell.ts`)
  - `createUi(sidebarLeft, sidebarRight, statusEl, cb, shell?: Shell)` — quinto parámetro opcional; sin él se comporta como hoy.

- [ ] **Step 1: Pruebas que fallan** en `tests/ui/shell.test.ts` (happy-dom): `createShell` genera seis botones de dock con `aria-label` "Forma", "Diseño", "Colores", "Switch", "Llavero", "Exportar" y `aria-expanded="false"`; `openPanel('colores')` deja visible solo ese `panelHost` y `aria-expanded="true"` en su botón; abrir otro cierra el anterior (nunca dos visibles); `openPanel(null)` cierra todo; presionar `Escape` cierra; hacer clic en el botón abierto lo cierra.
- [ ] **Step 2: Verificar que falla:** `npx vitest run tests/ui/shell.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3: Implementar `createShell`** y estilos: visor a pantalla completa, barra superior (conserva los enlaces existentes "Volver al Mostrador" y "Soporte WhatsApp" del `index.html`), dock inferior centrado, paneles flotantes con scroll interno y ancho máximo `min(360px, 100vw - 32px)`. Las barras laterales viejas se reparenten a `legacyLeftEl`/`legacyRightEl` como drawers provisionales sobre el visor, funcionales como hoy. `theme.css` define los tokens de Global Constraints para claro y oscuro, reutilizando el mecanismo y la clave de persistencia que ya usa `onThemeChange`.
- [ ] **Step 4: Verificar:** `npm test` (incluye ID y 3MF dorado) → PASS; typecheck y build limpios.
- [ ] **Step 5: En el navegador:** la app carga con aspecto cálido, el dock abre y cierra paneles (vacíos) y los drawers viejos siguen operativos; a 375 px el dock cabe sin scroll horizontal (`document.documentElement.scrollWidth <= window.innerWidth`).
- [ ] **Step 6: Commit** (`feat: tema Taller cálido, esqueleto y dock`).

### Task 3: Panel Forma (con ajustes y tolerancias)

**Files:**
- Create: `src/ui/panels/forma.ts`, `src/ui/shared/controls.ts`
- Modify: `src/ui/ui.ts` (sale la plantilla y el cableado de forma/ajustes)
- Test: `tests/ui/panels/forma.test.ts`

**Interfaces:**
- Consumes: `PanelModule`, `PanelHandle` (Tarea 2); `UiCallbacks.onShape`, `onWidth`, `onTopThickness`, `onImageDepth`, `onSocketTolStep`, `onStemTolStep`; `UiState.baseShape`, `capWidthMm`, `topThickness`, `imageDepth`, `tolerance`, `stemTolerance`.
- Produces: `formaPanel: PanelModule` (id `'forma'`); `tip(text: string): string` y `bindValInput(valId, slider, callback, parse?)` movidas de `ui.ts` a `src/ui/shared/controls.ts` (las usarán las tareas 4–7).

- [ ] **Step 1: Prueba que falla:** monta `formaPanel` con `makeCallbacks()`; mover el control de tamaño general a 40 llama `onWidth(40)`; cambiar el grosor superior y la profundidad de imagen llama a sus callbacks; pulsar los botones de tolerancia llama `onSocketTolStep`/`onStemTolStep` con ±paso; `update(makeUiState({ capWidthMm: 55 }))` refleja 55 en el control y el rótulo.
- [ ] **Step 2: Verificar que falla:** `npx vitest run tests/ui/panels/forma.test.ts` → FAIL.
- [ ] **Step 3: Mover** a `forma.ts` el bloque "Estilo de base" (pestañas Contorno/Forma, selector de geometría, tamaño general) y la sección `sectionShape` ("Ajustes y Tolerancias P2S") de `ui.ts`, con sus IDs intactos y la parte de `update()` que los refresca; `createUi` monta el panel en `shell.panelHost('forma')` cuando recibe `shell`. Los controles de llavero que vivan en esa sección se dejan en su sitio hasta la Tarea 7.
- [ ] **Step 4: Verificar:** `npm test` → PASS (los IDs no se pierden); typecheck y build limpios.
- [ ] **Step 5: En el navegador:** el panel Forma del dock cambia forma, tamaño y tolerancias y el visor responde como antes.
- [ ] **Step 6: Commit** (`refactor: panel Forma en su propio módulo`).

### Task 4: Panel Switch

**Files:** Create `src/ui/panels/switch.ts`; Modify `src/ui/ui.ts`; Test `tests/ui/panels/switch.test.ts`.

**Interfaces:**
- Consumes: `onSwitchNudge(dx, dy)`, `onSwitchRotate(deltaDeg)`, `onSwitchReset()`, `onSwitchCount(n)`, `onActiveSwitch(i)`, `onSwitchResetAll()`; `UiState.switches`, `activeSwitchIndex`; helpers de `src/ui/shared/controls.ts`.
- Produces: `switchPanel: PanelModule` (id `'switch'`).

- [ ] **Step 1: Prueba que falla:** pulsar el selector de cantidad con `data-count="2"` llama `onSwitchCount(2)`; con `update(makeUiState({ switches: [a, b], activeSwitchIndex: 1 }))` aparecen dos chips y el segundo queda activo; pulsar el chip 1 llama `onActiveSwitch(0)`; los botones de mover/rotar/reiniciar llaman sus callbacks.
- [ ] **Step 2: Ejecutar y ver que falla** (`npx vitest run tests/ui/panels/switch.test.ts`).
- [ ] **Step 3: Mover** la sección `sectionSwitch` ("Posición de Interruptor", incluidos `#switchCount`, `#switchChips`, `#switchReadout`, `#switchResetAll`) y su parte de `update()` a `switch.ts`; montar en `shell.panelHost('switch')`.
- [ ] **Step 4: Verificar** `npm test`, typecheck y build; en el navegador mover el switch y ver que el visor lo sigue.
- [ ] **Step 5: Commit** (`refactor: panel Switch en su propio módulo`).

### Task 5: Panel Colores (colores, suavizado, relieve y bisel)

**Files:** Create `src/ui/panels/colores.ts`, `src/ui/shared/colorPopover.ts`; Modify `src/ui/ui.ts`; Test `tests/ui/panels/colores.test.ts`.

**Interfaces:**
- Consumes: `onColorCount`, `onSmoothing`, `onFilament`, `onBodyColor`, `onEditMode`, `onEdgeStyle`, `onEdgeStep`, `onExtrudeStep`, `onExtrudeChamfer`, `onSeparateLetters`, `onGenerate`; `UiState.colorCount`, `palette`, `smoothing`, `bodyColorRgb`, `colorMode`, `limitedColors`, `paletteOverrides`, `baseColorOverride`, `partOverrides`, `editMode`, `edgeSettings`, `extrudeChamfer`, `separateLetters`, `extrudeHeight`, `componentHeights`, `selectedParts`.
- Produces: `coloresPanel: PanelModule` (id `'colores'`); `showColorPopoverAt(clientX, clientY, currentHex, options: RGB[], handlers: { onSelect(hex: string): void; onClose?(): void }): void` en `src/ui/shared/colorPopover.ts` (`createUi` sigue devolviendo `showColorPopoverAt`).

- [ ] **Step 1: Prueba que falla:** `update(makeUiState({ palette: [p1, p2], colorCount: 2 }))` pinta dos filas de paleta; elegir un color llama `onFilament(i, hex)`; mover suavizado a 3 llama `onSmoothing(3)`; cambiar el modo de edición llama `onEditMode`; con `editMode` de relieve y `selectedParts` no vacío se ven los pasos de extrusión y llaman `onExtrudeStep(±)`; `showColorPopoverAt` abre un popover con las opciones y cierra al elegir.
- [ ] **Step 2: Ejecutar y ver que falla.**
- [ ] **Step 3: Mover** `sectionColors` ("Colores y Suavizado"), `renderPalette`, el selector de color del cuerpo y los paneles de relieve y bisel (los creados programáticamente: barra de modos, `extrudePanel`, `edgesPanel`, superposición de carga) a `colores.ts`; montar en `shell.panelHost('colores')`.
- [ ] **Step 4: Verificar** `npm test`, typecheck y build; en el navegador cambiar colores, relieve y bisel de una imagen de muestra.
- [ ] **Step 5: Commit** (`refactor: panel Colores en su propio módulo`).

### Task 6: Panel Diseño (importar, texto, iconos, quitar fondo)

**Files:** Create `src/ui/panels/diseno.ts`; Modify `src/ui/ui.ts`, `src/ui/wizard.ts` (solo si importa algo movido); Test `tests/ui/panels/diseno.test.ts`.

**Interfaces:**
- Consumes: `onUpload`, `onSample`, `onImportMode`, `onSvgUpload`, `onSelectSvg`, `onSelectIcon`, `onTextChange`, `onFontSelect`, `onImportFont`, `onRemoveBg`; `UiState.importMode`, `currentIconName`, `removeBg`; `SAMPLES`, `SVG_SAMPLES` (`src/image/sample.ts`).
- Produces: `disenoPanel: PanelModule` (id `'diseno'`) con el interruptor "Eliminar fondo" dentro; `createUi` sigue devolviendo `addUploadedSvg` y `addFontOption` (ahora delegando en este módulo).

- [ ] **Step 1: Prueba que falla:** las tarjetas Imagen/SVG/Icono/Texto llaman `onImportMode` con su modo y muestran su sub-panel; escribir "Hola" en el campo de texto llama `onTextChange('Hola')`; un `update()` mientras el campo tiene foco conserva su valor y su foco (Review Focus 4); el interruptor "Eliminar fondo" llama `onRemoveBg(true)`; elegir una muestra llama `onSample` con una función que devuelve una promesa.
- [ ] **Step 2: Ejecutar y ver que falla.**
- [ ] **Step 3: Mover** las tarjetas de modo, `#imagePanel`, `#svgPanel`, `#iconPanel`, `#letterPanel`, `#fontGrid`, la galería de iconos Lucide, la zona de carga y el interruptor de quitar fondo a `diseno.ts`; el interruptor queda como "paso de limpieza" del panel; montar en `shell.panelHost('diseno')`.
- [ ] **Step 4: Verificar** `npm test`, typecheck y build; en el navegador subir una imagen, probar texto e iconos.
- [ ] **Step 5: Commit** (`refactor: panel Diseño en su propio módulo`).

### Task 7: Panel Llavero

**Files:** Create `src/ui/panels/llavero.ts`; Modify `src/ui/ui.ts`; Test `tests/ui/panels/llavero.test.ts`.

**Interfaces:**
- Consumes: `onKeychainToggle(on)`, `onKeychainRotate(deltaDeg)`, `onKeychainSize(deltaMm)`, `onKeychainOffset(deltaMm)`; `UiState.keychain`.
- Produces: `llaveroPanel: PanelModule` (id `'llavero'`).

- [ ] **Step 1: Prueba que falla:** el interruptor llama `onKeychainToggle(true)`; los botones de rotar, tamaño y desfase llaman sus callbacks con el delta del botón; con `keychain` apagado los controles quedan deshabilitados o ocultos.
- [ ] **Step 2: Ejecutar y ver que falla.**
- [ ] **Step 3: Mover** los controles de llavero (buscar IDs que contengan `keychain` en `ui.ts`) a `llavero.ts`; montar en `shell.panelHost('llavero')`.
- [ ] **Step 4: Verificar** `npm test`, typecheck y build; en el navegador activar el llavero y ver el aro en el visor.
- [ ] **Step 5: Commit** (`refactor: panel Llavero en su propio módulo`).

### Task 8: Panel Exportar y barra superior (crédito incluido)

**Files:** Create `src/ui/panels/exportar.ts`, `src/ui/shell/topbarActions.ts`; Modify `src/ui/ui.ts`; Test `tests/ui/panels/exportar.test.ts`, `tests/ui/topbarActions.test.ts`.

**Interfaces:**
- Consumes: `onExport`, `onRenderPng`, `onAiPrompt`, `onSaveProject`, `onLoadProject`, `onThemeChange(theme: string)`, `onUndo`, `onRedo`, `onRefresh`; `UiState.hasParts`, `building`, `canUndo`, `canRedo`, `canRefresh`, `palette`.
- Produces: `exportarPanel: PanelModule` (id `'exportar'`); `mountTopbarActions(host: HTMLElement, cb: UiCallbacks): { update(state: UiState): void }`.

- [ ] **Step 1: Pruebas que fallan:** "Exportar" queda deshabilitado con `hasParts: false` o `building: true` y llama `onExport` cuando está activo; muestra el resumen de piezas y colores a partir de `palette`; la barra superior tiene iconos con `aria-label` en español para Deshacer, Rehacer, Revertir, Guardar, Cargar, Ayuda y Tema, que llaman sus callbacks (`onSaveProject`, `onThemeChange`, etc.); el texto "Motor base: Vostok Labs · Herramienta personalizada por SHAMMAH 3D" existe en el DOM con tema claro y con tema oscuro (Review Focus 6); con `localStorage` que lanza al leer/escribir, el cambio de tema no lanza y cae al valor por defecto (Review Focus 3).
- [ ] **Step 2: Ejecutar y ver que falla.**
- [ ] **Step 3: Mover** el botón de descarga, renderizar PNG y la petición de IA al panel Exportar; Guardar, Cargar, Ayuda, Tema y los botones Deshacer/Rehacer/Revertir a la barra superior (esquina derecha); reubicar la línea de crédito al pie del panel Exportar y en la ayuda.
- [ ] **Step 4: Verificar** `npm test`, typecheck y build; en el navegador exportar un 3MF y comprobar que se descarga.
- [ ] **Step 5: Commit** (`refactor: panel Exportar y acciones de la barra superior`).

### Task 9: Controles del visor (explosión, ojo del switch, corte)

**Files:** Create `src/ui/viewer-controls/viewerControls.ts`; Modify `src/viewer/viewer.ts` (solo añadir `setExplosion`), `src/ui/ui.ts`, `src/main.ts`; Test `tests/ui/viewerControls.test.ts`, `tests/viewer/explosion.test.ts`.

**Interfaces:**
- Consumes: `Viewer` (`src/viewer/viewer.ts`); `onView(mode: ViewMode)`, `onShowSwitch(on)`, `onSection(axis: SectionAxis, pos: number)`; `UiState.view`, `showSwitch`.
- Produces: `Viewer.setExplosion(t: number): void` (t en [0, 1], se acota; 0 = ensamblado, 1 = separación actual de "exploded"; método aditivo, `setView` no cambia); `mountViewerControls(host: HTMLElement, cb: UiCallbacks, onExplosion: (t: number) => void): { update(state: UiState): void }`.

- [ ] **Step 1: Pruebas que fallan:** `tests/viewer/explosion.test.ts`: `setExplosion(2)` y `setExplosion(-1)` se acotan a 1 y 0 y no lanzan; `setExplosion(0.5)` deja la tapa a la mitad del desplazamiento que `setView('exploded')`. `tests/ui/viewerControls.test.ts`: mover el deslizador a 40 % llama `onExplosion(0.4)`; el ojo llama `onShowSwitch(false)` al pulsarlo con el switch visible; el control de corte conserva `onView('section')` y `onSection(axis, pos)`.
- [ ] **Step 2: Ejecutar y ver que falla.**
- [ ] **Step 3: Implementar** `setExplosion` reutilizando `explodeOffset` y la posición de `capGroup`; montar los controles en `shell.viewerControlsEl` y cablear `onExplosion` a `viewer.setExplosion` en `main.ts`; retirar de la interfaz los botones Ensamblado/Despiezado y el interruptor "Mostrar switch MX" (el corte permanece como icono secundario).
- [ ] **Step 4: Verificar** `npm test`, typecheck y build; en el navegador mover el deslizador y ocultar el switch.
- [ ] **Step 5: Commit** (`feat: controles del visor con explosión continua`).

### Task 10: Contenido propio y pistas de primera vez

**Files:** Create `public/assets/samples/{monograma-s,llama,rayo,engrane,flor}.svg`, `src/ui/hints/hints.ts`, `tests/ui/hints.test.ts`, `tests/no-legacy-content.test.ts`; Modify `src/image/sample.ts`, `src/ui/ui.ts`.

**Interfaces:**
- Consumes: `SampleInfo`/`SvgSampleInfo` (`src/image/sample.ts`); `loadUrlToImage(url)` (`src/image/decode`).
- Produces: `SAMPLES: SampleInfo[]` y `SVG_SAMPLES: SvgSampleInfo[]` con exactamente los cinco diseños propios; `mountHints(dock: HTMLElement): { dismiss(): void }`.

- [ ] **Step 1: Pruebas que fallan:** `tests/no-legacy-content.test.ts` recorre `src/` e `index.html` y falla si aparece cualquiera de: "Últimas actualizaciones", "Trazado ultra-fino", "Módulo de Llavero", "Bienvenido a SHAMMAH Clicker Studio", `heart.png`, `paw.png`, `dog.png`, `cheese.png`, `radiation.png`, `bambulab.svg`, `instagram.svg`, `youtube.svg`; `SAMPLES` y `SVG_SAMPLES` tienen 5 entradas con nombres propios y cada `src` existe en `public/`; `tests/ui/hints.test.ts`: las pistas aparecen en la primera visita, `dismiss()` las oculta y no reaparecen; con `localStorage` bloqueado no lanza y se muestran sin persistir (Review Focus 3).
- [ ] **Step 2: Ejecutar y ver que falla.**
- [ ] **Step 3: Crear los cinco SVG** dibujados desde cero (monograma S, llama, rayo, engrane, flor), de un solo color, con contornos cerrados y sin texto; actualizar `sample.ts`; `SAMPLES` carga cada SVG con `loadUrlToImage` (si el decodificador no admite SVG, rasterizar a canvas de 512 px y convertir a `RgbaImage`); eliminar de `ui.ts` los modales de novedades, bienvenida y tutorial y sustituirlos por `mountHints` con texto nuevo en español.
- [ ] **Step 4: Verificar** `npm test`, typecheck y build; en el navegador cargar cada muestra y comprobar que genera geometría.
- [ ] **Step 5: Commit** (`feat: muestras y pistas propias; fuera el contenido heredado`).

### Task 11: Limpieza final y verificación (Fase 5)

**Files:** Delete `public/assets/media/images/*`, `public/assets/media/svg/*`; Modify `src/ui/ui.ts`, `src/style.css`, `index.html`, `CREDITS.md`; Create `docs/rediseno/checklist.md`, `docs/rediseno/despues/`.

- [ ] **Step 1: Quitar lo provisional.** Eliminar los drawers `.legacy-drawer`, `legacyLeftEl`/`legacyRightEl` y el `ui.ts` residual que ya no se use; borrar reglas CSS muertas; quitar de `CREDITS.md` el aviso de assets pendientes que ya no existen (el de los modelos del switch permanece).
- [ ] **Step 2: Verificar:** `npm test` (IDs, 3MF dorado, contenido heredado) → PASS; `npm run typecheck`; `npm run build`; confirmar que `src/ui/ui.ts` ya no tiene plantillas de panel.
- [ ] **Step 3: Checklist de rasgos.** Crear `docs/rediseno/checklist.md` con una fila por rasgo del spec (sección 4), su reemplazo y la ruta de captura en `docs/rediseno/antes/` y `docs/rediseno/despues/` (escritorio y móvil); marcar cada fila como cumplida solo con captura.
- [ ] **Step 4: Prueba manual del 3MF.** Exportar un clicker desde la app, abrirlo en Bambu Studio y comprobar que carga sin error y con los colores asignados; anotar versión de Bambu Studio y resultado en `docs/rediseno/checklist.md`.
- [ ] **Step 5: Commit** (`chore: retirar lo provisional y documentar la verificación`). No se hace push ni deploy.

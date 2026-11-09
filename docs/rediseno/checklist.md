# Rediseño de la interfaz: checklist de rasgos heredados

Una fila por rasgo de la tabla del spec (sección 4,
`docs/superpowers/specs/2026-11-09-rediseno-interfaz-design.md`).

Una fila queda **Cumplida** solo si una captura o una prueba automática lo demuestra.
Si falta algo, la fila dice **Parcial** o **Pendiente** y explica por qué.

## Capturas

- **Antes** (`docs/rediseno/antes/`, tema oscuro de la versión heredada, escritorio):
  - `escritorio-novedades.jpg`: tres columnas, botones Ensamblado/Despiezado, interruptor
    "Mostrar switch MX", paleta azul marino y modal "Últimas actualizaciones".
  - `escritorio-tutorial.jpg`: el tutorial modal (paso 1/9).
  - No hay capturas "antes" de la columna derecha (Eliminar fondo, Guardar/Cargar/Ayuda/Tema,
    botón verde "Descargar 3MF"), de las imágenes de muestra viejas ni de los iconos sociales.
    Esas filas se demuestran con la captura "después" más una prueba.
- **Después** (`docs/rediseno/despues/`, tomadas el 2026-11-09 con el servidor de desarrollo y
  la muestra "Monograma S" cargada a través del diálogo de preprocesamiento):

  | Vista | Claro | Oscuro |
  |---|---|---|
  | Escritorio 1440×860, muestra cargada | `escritorio-claro-muestra.jpg` | `escritorio-oscuro-muestra.jpg` |
  | Escritorio, panel Colores abierto | `escritorio-claro-colores.jpg` | `escritorio-oscuro-colores.jpg` |
  | Escritorio, panel Exportar abierto | `escritorio-claro-exportar.jpg` | `escritorio-oscuro-exportar.jpg` |
  | Móvil 375×812, muestra cargada | `movil-claro-muestra.jpg` | `movil-oscuro-muestra.jpg` |
  | Móvil, panel Colores abierto | `movil-claro-colores.jpg` | `movil-oscuro-colores.jpg` |
  | Móvil, panel Exportar abierto | `movil-claro-exportar.jpg` | `movil-oscuro-exportar.jpg` |

  Capturas de apoyo (escritorio, tema claro):
  - `escritorio-claro-diseno.jpg`: panel Diseño con las cinco muestras propias y el paso de limpieza.
  - `escritorio-claro-explosion-ojo.jpg`: captura tomada con el deslizador anterior (explosión al 40 %) y el switch oculto con el ojo; el control actual es un botón único.
  - `escritorio-claro-popover.jpg`: selector de color abierto desde el panel Colores.
  - `escritorio-claro-pistas.jpg`: pistas de primera visita, reabiertas con Ayuda.

## Rasgos

| # | Rasgo heredado | Reemplazo construido | Antes | Después | Prueba | Estado |
|---|---|---|---|---|---|---|
| 1 | Tres columnas (ajustes izq., visor centro, importar/descargar der.) | El visor ocupa toda la pantalla. Un dock inferior con seis iconos (Forma, Diseño, Colores, Switch, Llavero, Exportar) abre paneles flotantes, uno a la vez: a la derecha en escritorio y como hoja inferior en móvil. Ya no hay drawers provisionales ni botones Opciones/Ajustes. | `antes/escritorio-novedades.jpg` | `despues/escritorio-claro-muestra.jpg`, `despues/escritorio-claro-colores.jpg`, `despues/movil-claro-colores.jpg` | `tests/ui/shell.test.ts` ("crea seis botones de dock…", "no quedan drawers provisionales ni sus botones", "openPanel muestra solo ese panel…") | Cumplida |
| 2 | Botones Ensamblado / Despiezado | Botón único con icono («Separar piezas» / «Juntar piezas») y animación suave, arriba a la izquierda del visor | `antes/escritorio-novedades.jpg` | `despues/escritorio-claro-explosion-ojo.jpg` | `tests/ui/viewerControls.test.ts` ("monta un solo botón de separar y un solo ojo…", "clic desde separado…", "un segundo clic a mitad de animación…") | Cumplida |
| 3 | Interruptor "Mostrar switch MX" | Botón de ojo junto al botón de separar. Usa `aria-pressed` y cambia al ojo tachado cuando el switch está oculto. | `antes/escritorio-novedades.jpg` | `despues/escritorio-claro-explosion-ojo.jpg` | `tests/ui/viewerControls.test.ts` ("el ojo llama onShowSwitch(false)…") | Cumplida |
| 4 | Interruptor "Eliminar fondo" en la columna derecha | Bloque "Paso de limpieza" dentro del panel Diseño, en las vistas Imagen y SVG, con separador propio (`.cleanup-step`) | sin captura | `despues/escritorio-claro-diseno.jpg` | `tests/ui/panels/diseno.test.ts` ("Eliminar fondo es un paso de limpieza dentro del panel…") | **Parcial**: el paso existe dentro de Diseño, pero la "vista antes/después" del spec no está construida. El panel solo muestra el interruptor. |
| 5 | Cinco imágenes de muestra (corazón, pata, perro, queso, radiación) | Cinco SVG propios (Monograma S, Llama, Rayo, Engrane, Flor) en `public/assets/samples/`. Las imágenes viejas se borraron de `public/assets/media/images/`. | sin captura | `despues/escritorio-claro-diseno.jpg` | `tests/no-legacy-content.test.ts` ("SAMPLES y SVG_SAMPLES son los cinco diseños propios", "cada src existe en public/", "… es un SVG limpio de un solo color", "public/assets/media … ya no existe") | Cumplida |
| 6 | Modal "Últimas actualizaciones" | Se eliminó. Al cargar no aparece ningún modal. | `antes/escritorio-novedades.jpg` | `despues/escritorio-claro-muestra.jpg` | `tests/no-legacy-content.test.ts`: prohíbe "Últimas actualizaciones", "Trazado ultra-fino", "Módulo de Llavero", "Múltiples Switches" y "Entendido". `tests/ui/hints.test.ts`: "no hay modales heredados y Ayuda abre las pistas". | Cumplida |
| 7 | Modal de bienvenida y tutorial | Pistas breves sobre el dock en la primera visita, con texto nuevo ("Para empezar", tres pasos, botón Cerrar). El botón Ayuda las reabre. | `antes/escritorio-tutorial.jpg` | `despues/escritorio-claro-pistas.jpg` | `tests/ui/hints.test.ts`. `tests/no-legacy-content.test.ts` prohíbe "Bienvenido a SHAMMAH Clicker Studio", "Menú de Importación" y "Comenzar a diseñar". | Cumplida |
| 8 | Guardar, Cargar, Ayuda y Tema en la columna derecha | Iconos en la esquina superior derecha: Deshacer, Rehacer, Revertir, Guardar, Cargar, Ayuda y Tema, más Soporte WhatsApp. En móvil bajan a una segunda fila. | sin captura | `despues/escritorio-claro-muestra.jpg`, `despues/movil-claro-muestra.jpg` | `tests/ui/topbarActions.test.ts` ("con shell: un solo #undoBtn y #themeToggle, en topbarActionsEl" y callbacks) | Cumplida |
| 9 | Botón verde "Descargar 3MF" abajo a la derecha | Panel "Exportar" en el dock: cuenta de colores en uso, una muestra por color, botón "Descargar 3MF (Bambu Studio)" y el crédito "Motor base: Vostok Labs · Herramienta personalizada por SHAMMAH 3D" | sin captura | `despues/escritorio-claro-exportar.jpg`, `despues/movil-oscuro-exportar.jpg` | `tests/ui/panels/exportar.test.ts` ("el resumen muestra un chip por entrada de la paleta y la cuenta", crédito, un solo #export) | **Parcial**: el resumen enseña los colores pero no las piezas que se van a exportar. Falta la parte "resumen de piezas" del spec. |
| 10 | Iconos sociales (Instagram, YouTube, Bambu Lab) en `public/assets/media/svg` | Retirados. `public/assets/media/` y `public/icons/` (copias de los iconos sociales y de otras marcas) ya no existen y nada los referencia. | sin captura | (no aplica: es un borrado) | `tests/no-legacy-content.test.ts` ("public/assets/media … ya no existe", "public/icons … ya no existe" y ningún `bambulab/instagram/youtube.svg` en `public/`; prohíbe "bambulab.svg", "instagram.svg", "youtube.svg" y "assets/media" en `src/` e `index.html`) | Cumplida |
| 11 | Paleta azul marino oscuro | "Taller cálido": fondo crema `#f6f1ea`, paneles blancos con sombra suave y acento rosa `#db2777` (`src/ui/theme.css`). El tema claro es el de inicio. El oscuro (cálido) es opcional y se activa con el botón Tema. | `antes/escritorio-novedades.jpg` | `despues/escritorio-claro-colores.jpg`, `despues/escritorio-oscuro-colores.jpg` | `tests/ui/themeStore.test.ts` ("usa claro si falta o es inválido…") | Cumplida |

**Resumen:** 9 cumplidas y 2 parciales (filas 4 y 9). Las dos parciales describen funciones
del spec que no se construyeron en las tareas 1 a 11. No son regresiones de la limpieza.

## Observaciones de la verificación en navegador (2026-11-09)

- Se recorrieron, a 1440×860 y 375×812, en tema claro y oscuro: carga de muestra por el diálogo
  de preprocesamiento, los seis paneles del dock, botón de separar piezas, ojo, selector de color,
  modo Extruir (relieve), Ayuda y Tema. No hubo errores de JavaScript de la app. La consola solo
  mostró los fallos del WebSocket de recarga en caliente de Vite propios del panel de vista previa.
- El motor 3D se dibujó en el panel de vista previa, así que las capturas muestran el modelo real.
- Problemas que ya existían antes de esta tarea y siguen abiertos:
  - El diálogo de preprocesamiento (`src/ui/wizard.ts`) no se adapta a 375 px. La vista previa
    de la imagen no se ve y la caja "¿Qué tipo de imagen funciona mejor?" se monta sobre los
    deslizadores. Con el `style.css` original (c93e228) se ve igual: no es una regresión.
  - En tema oscuro el fondo del visor 3D es azul muy oscuro, no el `#1c1814` del tema. Lo fija
    `viewer.setTheme` en `src/viewer/`, que quedó fuera del alcance.

## Prueba manual en Bambu Studio

Estado: **pendiente (la hace la persona)**. Nadie la ha hecho todavía. Las herramientas de
navegador de esta sesión no pueden interceptar la descarga del archivo.

Pasos:

1. `npm run dev` y abrir la app en `http://localhost:5173/Shammah-clicker-studio/`
   (o el puerto que indique Vite).
2. Abrir **Diseño** en el dock, elegir la muestra **Monograma S** y pulsar
   **Confirmar e Importar** en el diálogo de preprocesamiento.
3. En **Colores**, cambiar el color de `E1` (por ejemplo a rosa) y anotar los colores del cuerpo
   y de `E1`.
4. Abrir **Exportar** y pulsar **Descargar 3MF (Bambu Studio)**.
5. Abrir el `.3mf` descargado en Bambu Studio y comprobar:
   - que carga sin errores ni avisos de geometría;
   - que las piezas (tapa con relieve, cuerpo y, si aplica, switch) aparecen en su sitio;
   - que cada color asignado en la app está en su ranura de filamento (AMS) y en la pieza correcta.
6. Anotar aquí la versión de Bambu Studio, el sistema operativo y el resultado:

| Fecha | Versión de Bambu Studio | Sistema | Resultado | Notas |
|---|---|---|---|---|
| | | | pendiente | |

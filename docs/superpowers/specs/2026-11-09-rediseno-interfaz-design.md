# SHAMMAH Clicker Studio — Spec del rediseño de interfaz

Estado: BORRADOR para revisión, sin commit.
Fecha: 2026-11-09
Repo: `~/Shammah-clicker-studio` (rama de trabajo `rediseno`, cortada desde `higiene-legal`, sin push)

## 1. Objetivo
Rediseñar la interfaz y ordenar el código del generador, de modo que el producto final no conserve la
apariencia, la marca ni el layout de la versión original de Vostok Labs publicada en MakerWorld, como exige la
licencia comercial adquirida por SHAMMAH 3D. El motor (geometría, exportación 3MF, imagen, visor) no cambia.

Éxito: (a) cada rasgo heredado de la tabla de la sección 4 está reemplazado, no solo recoloreado;
(b) la app genera y exporta exactamente los mismos 3MF que antes; (c) un 3MF exportado se abre en Bambu Studio
sin error; (d) hay pruebas automáticas que protegen la interfaz y el 3MF.

## 2. Obligaciones de la licencia que este spec cumple
- Rediseñar interfaz y código (no conservar apariencia, marca ni layout originales).
- Mantener el crédito a Vostok Labs (ya agregado en el commit `25c5849` de la rama `higiene-legal`: pie de la
  barra lateral, `LICENSE`, `CREDITS.md`). El rediseño debe reubicar ese crédito en la nueva interfaz, visible.
- No redistribuir ni revender el motor base; el repo permanece privado en cuanto la persona lo decida (pendiente suyo).
- No se publica nada sin confirmación explícita.

## 3. Alcance
Dentro:
- Nueva estructura: visor 3D a pantalla completa + dock inferior de iconos con paneles flotantes + barra superior.
- Estilo "Taller cálido" (claro por defecto, oscuro opcional).
- Partir `src/ui/ui.ts` (1,681 líneas de HTML en plantillas) en componentes pequeños.
- Red de seguridad: pruebas con `vitest` y `happy-dom`.
- Contenido propio: cinco diseños de muestra en SVG, pistas de primera vez con texto nuevo; eliminar el modal de novedades.

Excepciones al congelado, decididas al planificar contra el código real (2026-11-09):
- `src/viewer/viewer.ts` solo admite modos discretos (ensamblado/despiezado/corte). El deslizador de "Explosión" continuo
  exige un método aditivo `setExplosion(t: number)` (t en [0, 1]); `setView` no cambia.
- `src/image/sample.ts` (42 líneas de datos) se reescribe para listar las cinco muestras propias.
- `createUi` conserva su firma y gana un quinto parámetro opcional `shell`.
- Deshacer, Rehacer y Revertir pasan a la barra superior; el control de corte existente se conserva como icono secundario del visor.

Fuera (congelado):
- `src/geometry/`, `src/export/`, `src/image/`, `src/viewer/` y el contrato `UiCallbacks` no cambian.
- Los modelos del switch `public/assets/switch/mx/*.3mf`: permanecen hasta que Vostok confirme su origen.
- Nuevas funciones de producto, despliegue y publicación.

## 4. Rasgos heredados y su reemplazo (criterio de aceptación)
| Rasgo heredado | Reemplazo |
|---|---|
| Tres columnas (ajustes izq., visor centro, importar/descargar der.) | Visor a pantalla completa; dock inferior con paneles flotantes que se abren por icono |
| Botones Ensamblado / Despiezado | Deslizador continuo "Explosión" dentro del visor |
| Interruptor "Mostrar switch MX" | Icono de ojo junto al deslizador, en el visor |
| Interruptor "Eliminar fondo" en la columna derecha | Paso de limpieza dentro del panel Diseño, con vista antes/después |
| Cinco imágenes de muestra (corazón, pata, perro, queso, radiación) | Cinco SVG propios dibujados desde cero (monograma S, llama, rayo, engrane, flor) |
| Modal "Últimas actualizaciones" | Se elimina |
| Modal de bienvenida y tutorial | Pistas breves en el dock la primera vez, con texto nuevo |
| Guardar, Cargar, Ayuda, Tema en la columna derecha | Iconos en la esquina superior derecha |
| Botón verde "Descargar 3MF" abajo a la derecha | "Exportar" en el dock, con resumen de piezas y colores antes de descargar |
| Iconos sociales (Instagram, YouTube, Bambu Lab) en `public/assets/media/svg` | Se retiran en la fase 5 |
| Paleta azul marino oscuro | Taller cálido: crema `#f6f1ea`, paneles blancos con sombra suave, acento rosa `#db2777` |

Cada fila se verifica con capturas de antes y después.

## 5. Estilo (Taller cálido)
- Tokens en variables CSS: fondo crema `#f6f1ea`, superficie blanca, borde `#ddd2c2`, acento `#db2777`, texto oscuro
  `#1f1b16`, texto apagado `#8a7f70`, sombra suave; radios 12–16 px; espaciado en múltiplos de 8 px.
- Tipografía: Plus Jakarta Sans 400–800 (la del index de SHAMMAH).
- Tema claro por defecto y tema oscuro opcional (alternar desde la barra superior).
- Debe funcionar en escritorio y en móvil (375 px de ancho).

## 6. Arquitectura del código
`createUi(state, callbacks)` se mantiene como fachada con la misma firma, para que `main.ts` siga funcionando.
`src/ui/` se organiza en:
- `shell/`: layout (visor completo, barra superior, dock).
- `panels/`: un archivo por panel — Forma, Diseño, Colores, Switch, Llavero, Exportar.
- `viewer-controls/`: deslizador de explosión y ojo del switch.
- `hints/`: pistas de primera vez.
- `samples/`: los cinco SVG de muestra propios.
- `theme.css` (tokens) y estilos por componente en lugar del `style.css` único de 2,045 líneas.
Cada archivo tiene una responsabilidad; `main.ts` se adelgaza gradualmente sin cambiar su contrato.

## 7. Red de seguridad
Hoy no corre ninguna prueba: `npm test` ejecuta `vitest`, que no está en `package.json`.
- Instalar `vitest` y `happy-dom` (ambas MIT; añadirlas a `CREDITS.md`).
- Prueba de inventario de IDs: extrae los IDs que el TypeScript busca en el DOM (`getElementById`, `$('id')`) y
  comprueba que existan en la interfaz renderizada.
- Prueba dorada del 3MF: exporta el clicker de `public/assets/default-clicker.json` y compara estructura y huellas de las mallas.
- Cada fase deja verdes estas pruebas, el typecheck (`npm run typecheck`) y el build (`npm run build`).

## 8. Fases
0. Red de seguridad + `.gitignore` (`.superpowers/`) + rama `rediseno`. Listo: `npm test` corre en verde con el código actual.
1. Tokens y esqueleto: tema, visor completo, barra superior, dock vacío. Listo: carga con el nuevo aspecto y las pruebas siguen verdes.
2. Paneles uno por uno, de `ui.ts` a `panels/`. Listo: cada panel funciona igual que antes, comprobado en el navegador.
3. Controles del visor: explosión continua y ojo del switch. Listo: el modelo se separa de forma continua y el switch se oculta.
4. Contenido propio: SVG de muestra, pistas, sin modal de novedades. Listo: no queda imagen ni texto de Vostok en la interfaz (salvo el crédito requerido).
5. Limpieza y verificación: retirar imágenes de muestra e iconos sociales de `public/assets`, checklist de rasgos con capturas, exportar un 3MF y abrirlo en Bambu Studio.
Después de cada fase: commit en la rama local. Una fase a la vez.

## 9. Riesgos
- Mover HTML de `ui.ts` puede romper enlaces entre elementos (IDs y eventos) sin que se note a simple vista: mitigado por la prueba de IDs, que se corre tras cada panel.
- La interfaz usa HTML en plantillas con estilos en línea: se normalizan al migrar cada panel.
- Dependencias entre paneles dentro de `ui.ts` aún no mapeadas: se descubren en la fase 2; si una es mayor de lo esperado, se detiene y se rehace el plan de esa fase.

## 10. Pendientes externos (de la persona)
- Pasar el repo de GitHub a privado (Pages puede requerir plan de pago) o publicar solo `dist/` en otro repo.
- Enviar el correo a Vostok sobre redistribución, origen de los modelos del switch y texto exacto del crédito.
- Decidir qué hacer con `~/Shammah-clicker-studio-v2` (obsoleta).

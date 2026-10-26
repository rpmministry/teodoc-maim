# Documentos PDF

La generación se implementa en `lib/pdf/` con `jspdf` en el navegador. No requiere un servidor de impresión ni almacena documentos.

## Documentos y nombres

| Modalidad | Constructor | Nombre |
| --- | --- | --- |
| General | `construirPdfGeneral` | `teodoc-maim-analisis-general.pdf` |
| Grupos | `construirPdfGrupos` | `teodoc-maim-grupos-pequenos.pdf` |
| Jóvenes | `construirPdfJovenes` | `teodoc-maim-jovenes.pdf` |
| Niños | `construirPdfNinos` | `teodoc-maim-clase-infantil.pdf` |
| Devocionales | `construirPdfDevocionales` | `teodoc-maim-devocionales-7-dias.pdf` |

La descarga general adicional siempre usa `teodoc-maim-analisis-general.pdf`.

## Formato

- A4 vertical, unidad punto.
- Márgenes: 72 pt izquierdo, 52 pt derecho, 58 pt superior e inferior.
- Fuente **IBM Plex Sans** regular, negrita, itálica y negrita-itálica, incrustada desde `public/fonts/`.
- Acentos y caracteres españoles verificados en el texto seleccionable (extracción con PDF.js).
- Portada con logotipo oficial de MAIM Casa de Oración, título, predicador opcional, fecha opcional y etiqueta de modalidad.
- Cabecera y pie en páginas interiores; numeración `Página X de Y`.
- Metadatos del PDF: título, asunto, autor, palabras clave y creador.
- Sin imágenes remotas: logo y fuentes se cargan del mismo origen.
- Se evita dejar títulos huérfanos y se conserva juntos el encabezado y su primer bloque cuando el contenido lo permite.
- El contenido largo fluye entre páginas; no se recorta el texto.

## Identidad visual

- Coral oficial `#f04e59` y crema oficial `#ffefb4` tomados del logotipo.
- Tinta `#2b1f1e` y superficies crema para asegurar contraste.
- Las pequeñas etiquetas con texto usan coral oscuro `#b5303b` con texto blanco, no el coral brillante.
- El logotipo se inserta como imagen oficial, sin redibujarlo.
- La portada usa el logotipo horizontal oficial; el pie usa el isotipo oficial como sello discreto.

## Recursos

- `public/institucional/maim-portada.jpg`: logotipo horizontal oficial.
- `public/institucional/maim-perfil.jpg`: isotipo oficial.
- `public/fonts/IBMPlexSans-*.ttf`: fuentes SIL OFL.
- `public/fonts/OFL.txt`: licencia.
- `lib/pdf/recursos.ts`: carga los recursos en el navegador y los convierte a base64.
- `lib/pdf/base.ts`: portada, tipografía, párrafos, listas, citas, cajas, agendas y numeración.

## Word (.docx)

`lib/docx/` genera las cinco versiones Word con `docx` y `Packer.toBlob`:

- portada con metadatos;
- títulos y subtítulos jerárquicos;
- citas en cajas con borde;
- tablas de agenda y referencias;
- pie con numeración `Página X de Y`;
- estructuras propias por especialidad;
- nota de verificación bíblica.

Los nombres siguen el mismo patrón que los PDF, con extensión `.docx`. La descarga se realiza en el navegador y no se almacena en un servidor.
## Verificación

`npm run test:pdf` genera los cinco documentos con fixtures y comprueba:

- nombre exacto;
- número de páginas y tamaño;
- portada, título, predicador, institución y marca;
- acentos y ausencia de `undefined`, `null`, `NaN` o caracteres de reemplazo;
- secciones distintivas de cada modalidad;
- numeración de todas las páginas;
- siete jornadas devocionales;
- rango de edad y duración de la clase infantil;
- omisión correcta del bloque de predicador cuando no se proporciona.

Además se revisaron visualmente las páginas renderizadas con PyMuPDF y se descargó un PDF real desde el navegador (`teodoc-maim-jovenes.pdf`, 6 páginas) con el predictor y los acentos presentes.

Los archivos de prueba se guardan en `tmp/pdf/` y no se versionan.

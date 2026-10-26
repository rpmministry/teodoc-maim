# Pruebas y verificación

## Comandos

```bash
npm run lint
npm run typecheck
npm run build
npm run verificar
```

`npm run verificar` ejecuta:

| Comando | Qué cubre | Resultado esperado |
| --- | --- | --- |
| `test:logica` | proporcionalidad y riqueza del contenido | 11 |
| `test:modalidades` | cinco modalidades, metadatos, referencias, normalización y prompts | 14 |
| `test:biblia` | normalización y verificación con fuente abierta | 4 |
| `test:biblia-rvc` | adaptador API.Bible/RVC con prueba simulada | 2 |
| `test:pdf` | cinco PDF reales, fuentes, acentos, secciones y paginación | 10 |
| `test:word` | cinco DOCX reales, estructura, acentos y paginación | 6 |
| `test:entrega` | descarga, iOS, vista previa, retiro de infografías | 10 |
| `test:seguridad` | cabeceras, rate limit, SSRF, límites y prompt | 9 |
| `test:resiliencia` | wake lock, TTL, recuperación y limpieza | 9 |
| `test:identidad` | nombre oficial, activos, colores y fuente | 8 |
| `test:biblioteca` | persistencia, historial y regeneración independiente | 4 |
| **Total** | | **87** |

La suite no necesita servidor ni claves de IA. Los PDF y DOCX se generan con fixtures en `scripts/fixtures/demo.ts` y se escriben en `tmp/pdf/` y `tmp/docx/`.

## Verificación de PDF y Word

`scripts/verificar-pdf.mts` comprueba página por página con PDF.js:

- nombre exacto de los cinco archivos;
- mínimo de páginas por modalidad;
- tamaño superior a 20 KB (fuentes incrustadas);
- título, predicador, institución y marca;
- acentos y ausencia de caracteres de reemplazo;
- secciones distintivas;
- numeración `Página X de Y`;
- siete jornadas devocionales;
- edad y duración de la clase infantil;
- portada sin bloque de predicador cuando el campo está vacío.

Resultados de la última ejecución:

```text
Verificación funcional de los cinco PDF
  ✓ Se generan los cinco PDF con el nombre exacto solicitado
  ✓ Todos los PDF son multipágina y superan el tamaño mínimo con fuentes incrustadas
  ✓ Los PDF incluyen la portada institucional, el título y el predicador
  ✓ Los PDF preservan acentos y no contienen placeholders técnicos
  ✓ Cada PDF contiene las secciones distintivas de su modalidad
  ✓ La numeración de páginas aparece en todos los documentos
  ✓ El plan devocional conserva las siete jornadas completas
  ✓ La clase infantil respeta el rango de edad seleccionado
  ✓ Un título largo no se recorta en la portada
  ✓ El nombre es opcional: sin predicador no se imprime un campo vacío

10 pruebas superadas. Archivos en tmp/pdf/.
```

Páginas observadas en PDF: general 6, grupos 6, jóvenes 6, niños 5, devocionales 12.

## Verificación bíblica abierta

`scripts/verificar-biblia.mts` comprueba con `fetch` simulado:

- normalización de nombres y abreviaturas españolas;
- asignación de texto, traducción, licencia y fuente;
- referencias no disponibles marcadas como pendientes;
- ausencia de traducciones inventadas cuando falla la consulta.

La prueba real con GetBible y `sse` verificó 6 de 6 referencias del fixture y devolvió textos de Sagradas Escrituras (1569), marcados como dominio público. Una prueba de extremo a extremo posterior (45 s) verificó `Santiago 2:17` en el análisis generado. La consulta real no forma parte de la suite para evitar dependencia de red.
## Verificación de Word

`scripts/verificar-word.mts` genera los cinco DOCX y comprueba:

- que son archivos ZIP válidos con `word/document.xml`;
- título, predicador, institución, portada y paginación;
- estructura propia de cada especialidad;
- acentos y ausencia de marcadores técnicos;
- siete jornadas en el plan devocional;
- propiedades del documento.

La descarga real desde el navegador se comprobó con `teodoc-maim-jovenes.docx`; el aviso de descarga no ofrece vista previa para Word y mantiene Compartir y Descargar de nuevo.
## Verificación visual

Se renderizaron los PDF con PyMuPDF y se revisaron portadas y páginas interiores:

- cortes de texto corregidos midiendo con la fuente y el tamaño definitivos;
- etiquetas largas de portada con ancho dinámico;
- contraste de etiquetas pequeñas corregido a coral oscuro;
- encabezados huérfanos evitados en casos y oración devocional;
- sin desbordes horizontales en la interfaz móvil (`scrollWidth === innerWidth === 390`).

Se capturaron:

- portada y formulario en escritorio;
- portada, formulario, selector de niños y validación en móvil;
- resultados generales y de jóvenes en móvil;
- aviso de descarga y vista previa.

## Selector de audio en móviles

La interfaz simplificada no expone un editor de transcripción: el texto se obtiene del audio y la API conserva la entrada de texto para integraciones.

El botón de audio usa activación nativa mediante `<label htmlFor="audio-file-input">` y un `input type="file"` accesible con `sr-only`. No se depende de `input.click()` programático, que algunos navegadores móviles bloquean.

Se verificó en perfiles de Android, iPhone, tablet y Mac:

- el selector de archivos se abre;
- el objetivo táctil mide 48 px de alto;
- el input acepta `audio/*` y formatos habituales;
- no hay desbordamiento horizontal;
- el botón no queda deshabilitado sin una operación en curso.

No hay dispositivos físicos iOS/Android conectados a este entorno; la comprobación se hizo con emulación de navegador y revisión de la activación nativa.

## Biblioteca y generación independiente

`scripts/verificar-biblioteca.mts` simula `localStorage` y comprueba:

- que el análisis general se conserva al agregar una especialidad;
- que una nueva especialidad no borra las anteriores;
- que se recuperan texto y metadatos;
- que el historial tolera datos corruptos.

En navegador se simuló la respuesta de `/api/analyze` para generar las tres especialidades faltantes y se verificó que la biblioteca pasó de 2/5 a 5/5 sin errores, con descarga PDF/Word por documento.
## Prueba de descarga real en navegador

Con Edge headless + CDP se inyectó un resultado fixture, se seleccionó la pestaña **Jóvenes** y se pulsó **Descargar PDF de esta modalidad**:

- se creó `teodoc-maim-jovenes.pdf`;
- 6 páginas;
- texto con «Samuel Rojas»;
- aviso «Archivo disponible» y botones Ver, Compartir y Descargar de nuevo.

Esto valida la carga de fuentes y logotipo desde `public/`, la generación del `Blob` y el flujo de descarga del navegador.

## Pruebas de API

Se verificó manualmente:

- `POST /api/analyze` sin texto → 400;
- texto menor de 120 caracteres → 400;
- modalidad inválida → 400;
- niños sin rango de edad → 400;
- cuerpo no JSON → 400;
- texto mayor de 250 000 caracteres → 413.

Se ejecutó una generación real de análisis general con 347 caracteres: HTTP 200 en 96 s, 3 puntos y acentos conservados. Gemini `3.8-flash` agotó el tiempo por alta demanda y `4.0-flash` respondió 404; la cadena pasó a OpenRouter/DeepSeek. La transcripción de audio y las cinco especialidades en vivo no se probaron en la suite automatizada; la estructura y exportación se validan con fixtures.

## Verificación de identidad

Se consultó el plugin público de la página oficial de Facebook el 26/10/2026. La extracción devolvió:

- nombre: `MAIM Casa de Oración`;
- categoría: `Organización religiosa`;
- descripción con `Movimiento de Adoración e Intercesión «Maranatha»`.

La fuente directa de Facebook respondió 400; el plugin público fue la vía de verificación. No se inventaron misión, visión, doctrina, autoridades ni organigrama.

## Limitaciones conocidas

- No hay claves de IA en el entorno de auditoría: la generación real de contenido y la transcripción no se pueden ejecutar de extremo a extremo.
- No se realizó despliegue en producción.
- Se publicó la rama `main`; no se crearon PR ni releases y no se desplegó en Vercel.
- El repositorio remoto no es públicamente verificable (404 en la API de GitHub sin credenciales).
- Los fixtures prueban estructura, normalización y PDF; no sustituyen una revisión editorial de contenido generado por IA.

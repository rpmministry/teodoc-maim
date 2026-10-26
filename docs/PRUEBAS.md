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
| `test:modalidades` | cinco modalidades, metadatos, normalización y prompts | 13 |
| `test:pdf` | cinco PDF reales, fuentes, acentos, secciones y paginación | 10 |
| `test:entrega` | descarga, iOS, vista previa, retiro de infografías | 10 |
| `test:seguridad` | cabeceras, rate limit, SSRF, límites y prompt | 9 |
| `test:resiliencia` | wake lock, TTL, recuperación y limpieza | 9 |
| `test:identidad` | nombre oficial, activos, colores y fuente | 8 |
| **Total** | | **70** |

La suite no necesita servidor ni claves de IA. Los PDF se generan con fixtures en `scripts/fixtures/demo.ts` y se escriben en `tmp/pdf/`.

## Verificación de PDF

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

Páginas observadas: general 6, grupos 6, jóvenes 6, niños 5, devocionales 12.

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

No se pudo verificar la generación real porque el entorno no tiene `GEMINI_API_KEY`, `OPENROUTER_API_KEY` ni `DEEPSEEK_API_KEY`. El servidor responde de forma controlada (503) y la interfaz conserva la transcripción para reintentar. Las pruebas de normalización y PDF cubren la estructura completa con fixtures deterministas.

## Verificación de identidad

Se consultó el plugin público de la página oficial de Facebook el 26/10/2026. La extracción devolvió:

- nombre: `MAIM Casa de Oración`;
- categoría: `Organización religiosa`;
- descripción con `Movimiento de Adoración e Intercesión «Maranatha»`.

La fuente directa de Facebook respondió 400; el plugin público fue la vía de verificación. No se inventaron misión, visión, doctrina, autoridades ni organigrama.

## Limitaciones conocidas

- No hay claves de IA en el entorno de auditoría: la generación real de contenido y la transcripción no se pueden ejecutar de extremo a extremo.
- No se realizó despliegue en producción.
- No se hicieron operaciones remotas (`push`, releases, PR).
- El repositorio remoto no es públicamente verificable (404 en la API de GitHub sin credenciales).
- Los fixtures prueban estructura, normalización y PDF; no sustituyen una revisión editorial de contenido generado por IA.

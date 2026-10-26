# Reporte de intervención — TeoDoc MAIM

**Fecha:** 26 de octubre de 2026
**Remoto configurado:** `https://github.com/rpmministry/teodoc-maim.git`
**Alcance:** ejecución autónoma del prompt maestro, publicada en GitHub (`origin/main`), sin despliegue en Vercel ni operaciones remotas destructivas.

## Resumen

Se transformó el proyecto en **TeoDoc MAIM**: una aplicación de análisis bíblico con identidad institucional verificada, campo opcional de predicador, cinco modalidades, cuatro análisis especializados y cinco PDF. Se retiró por completo la generación de infografías, conservando transcripción, análisis general y componentes compartidos.

## Estados

### COMPLETADO

- Auditoría inicial, estado de Git y pruebas de línea base.
- Identidad institucional verificada en la página oficial de Facebook y activos oficiales incorporados.
- Campo «Predicador o expositor» opcional, separado de la transcripción.
- Selector de cinco modalidades y rango de edad para niños.
- Análisis general preservado y ampliado con las modalidades.
- Cuatro análisis especializados: grupos, jóvenes, niños y devocionales.
- Generación de los cinco PDF en el navegador.
- Descarga, vista previa, Web Share y nombres de archivo exactos.
- Retiro de infografías, ilustraciones y dependencias exclusivas.
- Nueva interfaz responsive y accesible.
- README, manual, reporte y documentación temática.
- Pruebas de lógica, modalidades, PDF, entrega, seguridad, resiliencia e identidad.
- Build, lint y typecheck.

### PARCIAL

- **Generación real con IA:** la lógica está implementada, pero no hay claves en el entorno. No se pudo ejecutar una prédica real de extremo a extremo.
- **Transcripción real:** los endpoints y la carga por partes se conservan; no se pudo probar con las claves de AssemblyAI/Deepgram.
- **URL pública del fork:** el remoto está configurado y el push se verificó con credenciales; GitHub devuelve 404 sin credenciales, por lo que no es verificable públicamente desde este entorno.
- **Verificación visual:** se revisaron capturas y PDF renderizados; no se ejecutó una auditoría automatizada con axe.

### PENDIENTE

- Configurar claves y ejecutar una prueba real de IA y transcripción.
- Revisión pastoral de los materiales generados con contenido real.
- Despliegue en el entorno definitivo.
- Publicación del fork/PR si el equipo lo autoriza.
- Auditar contraste y accesibilidad con herramientas automatizadas en el navegador final.

## Cambios principales

- `app/page.tsx`: nueva experiencia, flujo de audio/texto, selección, resultados y descarga.
- `app/api/analyze/route.ts`: general + especialidad, metadatos, validaciones y esquemas.
- `lib/ai/modalidades.ts`: reglas y esquemas de las cuatro especialidades.
- `lib/tipos.ts`, `lib/normalizar.ts`, `lib/modalidades.ts`, `lib/validacion-formulario.ts`.
- `lib/pdf/` y `lib/docx/`: cinco constructores PDF y cinco DOCX.
- `lib/referencias.ts` y `lib/biblia.ts`: inventario y verificación con GetBible/Sagradas Escrituras 1569 (dominio público).
- `lib/biblioteca.ts` y `components/resultados/biblioteca.tsx`: persistencia, generación independiente e historial local.
- `components/marca.tsx`, `components/formulario-analisis.tsx`, `components/resultados/`.
- `app/globals.css`, `app/layout.tsx`.
- `public/institucional/`, `public/fonts/`, iconos de la app.
- Pruebas y fixtures en `scripts/`.
- Documentación en `README.md`, `MANUAL_TECNICO_TEODOC.md`, `docs/`.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` | 0 errores |
| `npm run typecheck` | 0 errores |
| `npm run build` | correcto |
| `test:logica` | 11 superadas |
| `test:modalidades` | 14 superadas |
| `test:biblia` | 4 superadas |
| `test:pdf` | 10 superadas |
| `test:word` | 6 superadas |
| `test:entrega` | 10 superadas |
| `test:seguridad` | 9 superadas |
| `test:resiliencia` | 9 superadas |
| `test:identidad` | 8 superadas |
| `test:biblioteca` | 4 superadas |
| **Total** | **85** |

PDF observados: general 6 páginas, grupos 6, jóvenes 6, niños 5, devocionales 12. Word: cinco DOCX válidos, con portada, estructura propia y paginación. Descarga real en navegador: `teodoc-maim-jovenes.pdf` y `teodoc-maim-jovenes.docx`. La biblioteca pasó de 2/5 a 5/5 con respuestas simuladas, sin errores.

## Identidad

- Nombre: MAIM Casa de Oración.
- Categoría: Organización religiosa.
- Descripción oficial con «Movimiento de Adoración e Intercesión "Maranatha"».
- Fuente: https://www.facebook.com/casamaialasnaciones (consulta 26/10/2026).
- Logotipo e isotipo oficiales; coral `#f04e59` y crema `#ffefb4`.
- Sin misión, visión, doctrina, autoridades ni organigrama inventados.

## Limitaciones de la especialización

- La verificación bíblica del análisis general usa GetBible V2 y Sagradas Escrituras (1569), de dominio público. Si la API falla, la referencia queda pendiente; no se presenta una reconstrucción de memoria como cita canónica. Las lecturas internas de las especialidades no se verifican automáticamente.
- La biblioteca es local (localStorage, 30 días, máximo seis predicaciones), no una base de datos multiusuario.
- No se implementó un historial de versiones por documento; se conserva la última versión de cada modalidad.
- La generación real general se ejecutó con 347 caracteres (HTTP 200 en 96 s), pero Gemini 3.8 estaba saturado y 4.0 no existe; respondió el respaldo. La verificación con GetBible comprobó 6/6 referencias con Sagradas Escrituras 1569. Las especialidades en vivo y la transcripción controlada no se probaron.

## Incidencias corregidas durante la verificación

- Etiqueta larga de portada desbordada.
- Texto cortado en cajas por medición con fuente/tamaño anteriores.
- Encabezados huérfanos en casos juveniles y oración devocional.
- Páginas devocionales casi vacías por salto forzado.
- Contraste insuficiente de etiquetas pequeñas sobre coral.
- Errores de validación poco visibles en el formulario móvil.
- Mojibake en archivos editados por herramientas de línea de comandos, corregido y confirmado.

No se publicaron secretos, no se generaron gastos, no se desplegó a producción y no se ejecutaron operaciones remotas destructivas.

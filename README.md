# TeoDoc MAIM

**De la prédica al estudio que transforma.**

TeoDoc MAIM es una aplicación web para convertir la transcripción de una prédica, enseñanza o conferencia en un análisis bíblico estructurado y en materiales listos para enseñar. Conserva el análisis general y añade una de cinco modalidades de estudio, cada una con su propio PDF.

## Estado del proyecto

- Análisis general, cinco modalidades, campo opcional de predicador y PDF implementados.
- Interfaz responsive con carga de audio, selector de modalidad y descarga de documentos.
- Funcionalidad de infografías retirada por completo; la transcripción, el análisis y los componentes compartidos se conservan.
- Verificación técnica local: `lint`, `typecheck`, `build`, pruebas de lógica, PDF, seguridad y resiliencia.
- Publicado en GitHub; sin despliegue en producción ni operaciones remotas destructivas.
- La generación real con IA requiere credenciales de los proveedores; no hay claves incluidas en el repositorio.

## Identidad institucional verificada

La identidad se consultó en la página oficial de Facebook de la organización el **26 de octubre de 2026**:

- **Nombre público:** MAIM Casa de Oración
- **Categoría pública:** Organización religiosa
- **Descripción oficial:** «MAIM Casa de Oración, es un Movimiento de Adoración e Intercesión "Maranatha", nuestro anhelo es preparar el camino para el regreso del Amado a través de un corazón ardiente por su presencia y el evangelismo y discipulado en las naciones.»
- **Fuente:** https://www.facebook.com/casamaialasnaciones
- **Logotipo y colores:** se usan los archivos oficiales de esa página. El coral `#f04e59` y el crema `#ffefb4` se tomaron del logotipo. No se redibujó ni se alteró la marca.

No se localizó un sitio web institucional independiente. Por eso **no se inventaron** misión, visión, organigrama, himnos, doctrina, autoridades ni declaraciones que no aparezcan en la fuente consultada. Toda afirmación institucional del producto se limita a la descripción pública anterior.

> TeoDoc MAIM es una herramienta de apoyo al estudio. No sustituye la lectura de la Biblia, la revisión pastoral ni el discernimiento de la comunidad.

## Cinco modalidades

| Modalidad | Para quién | PDF generado |
| --- | --- | --- |
| Análisis general | Predicadores, líderes y estudiantes | `teodoc-maim-analisis-general.pdf` |
| Grupos pequeños, células y familias | Líderes de células y familias | `teodoc-maim-grupos-pequenos.pdf` |
| Jóvenes | Adolescentes, jóvenes y líderes juveniles | `teodoc-maim-jovenes.pdf` |
| Niños | Maestros de escuela dominical y familias | `teodoc-maim-clase-infantil.pdf` |
| Devocionales de siete días | Creyentes y familias | `teodoc-maim-devocionales-7-dias.pdf` |

El **análisis general siempre se conserva**. La modalidad seleccionada añade un desarrollo especializado:

- **Grupos pequeños:** objetivo, agenda de 60–90 minutos, materiales, preguntas de inicio, comprensión y reflexión, actividad, caso práctico, aplicaciones, compromiso, oración y orientaciones para el líder.
- **Jóvenes:** objetivo, tema, contexto, conceptos, reflexión individual, conversación grupal, casos, dinámica, aplicaciones, desafío semanal, oración y guía del líder.
- **Niños:** objetivo de aprendizaje, relato adaptado, versículo clave, preguntas, actividad, juego, aplicación, actividad familiar, oración, recomendaciones para el maestro y duración. El rango de edad (3–5, 6–8 o 9–12) se selecciona antes de generar.
- **Devocionales:** introducción, propósito y siete jornadas con lectura principal, lecturas complementarias, contexto, reflexión, enseñanza central, pregunta de introspección, aplicación, acción y oración.

## Personalización con el predicador

El campo **Predicador o expositor** es opcional y se guarda como metadato separado de la transcripción. Se usa para:

- identificarlo en la cabecera de los resultados;
- incluirlo en la portada y la ficha de fuente de los cinco PDF;
- conservar la trazabilidad del mensaje.

No se envía al modelo como una instrucción biográfica. La aplicación no genera biografías, cargos, trayectorias ni atribuciones que no estén en la transcripción. Tampoco inventa citas, versículos, autores o doctrina para rellenar secciones.

El título y la fecha también son opcionales. Si no se escribe un título, se usa el sugerido por el análisis. Si no se escribe un predicador, el diseño omite el bloque en lugar de mostrar un campo vacío.

## Flujo de uso

1. **Identifica el mensaje:** título, predicador y fecha, todos opcionales.
2. **Elige la modalidad y sube el audio:** la transcripción se procesa automáticamente. La API conserva la entrada de texto para integraciones externas.
3. **Elige una modalidad:** el análisis general se mantiene y se añade el material especializado.
4. **Genera:** se valida el contenido, se analiza y se redacta la modalidad.
5. **Descarga y revisa:** cada documento se puede previsualizar, descargar y compartir. En iOS se usa la hoja de compartir en lugar de forzar una descarga.

Formatos de audio aceptados: MP3, M4A, WAV, AAC, FLAC, OGG, OPUS, WMA, AMR, WebM, MP4, MOV, AIFF, CAF y 3GP, hasta 500 MB. Los archivos grandes se suben por partes a Cloudinary. AssemblyAI es el transcriptor principal y Deepgram `nova-2` el respaldo.

## Análisis y arquitectura de IA

El análisis se genera con una cadena de proveedores y tolerancia a fallos:

1. **Google Gemini** mediante el SDK oficial, con los modelos configurados en `lib/ai-gemini.ts`.
2. **OpenRouter**, seleccionando modelos gratuitos con contexto suficiente.
3. **DeepSeek** como último respaldo cuando la clave está disponible.

La modalidad especializada se genera en una segunda llamada que recibe la transcripción y un resumen del análisis general. Si la modalidad falla, el análisis general se devuelve igualmente y la interfaz informa que el material especializado está incompleto. Si el plan devocional no logra siete jornadas sin inventar, se conservan las jornadas sustentables y se advierte.

La profundidad del análisis es proporcional al contenido real: extensión, densidad, diversidad de ideas, referencias y peso teológico. No se rellenan secciones para alcanzar un número de páginas.

## Tecnologías

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4.
- `jspdf` para los PDF, con IBM Plex Sans incrustada (licencia SIL OFL) para acentos y texto seleccionable.
- Google GenAI SDK, OpenRouter y DeepSeek para el análisis.
- AssemblyAI, Deepgram y Cloudinary para audio.
- Almacenamiento local con expiración de 48 horas y Screen Wake Lock.

## Instalación local

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

### Variables de entorno

Crea un archivo `.env.local` (no se versiona) con las claves disponibles. No se incluyen secretos en el repositorio.

```bash
GEMINI_API_KEY=
OPENROUTER_API_KEY=
DEEPSEEK_API_KEY=
ASSEMBLYAI_API_KEY=
DEEPGRAM_API_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

La aplicación falla de forma controlada si no hay proveedor de análisis disponible: muestra un mensaje de servicio ocupado y conserva la transcripción para reintentar. En producción, define `NEXT_PUBLIC_SITE_URL` con la URL pública para que las imágenes Open Graph se resuelvan correctamente.

## Publicación en GitHub y Vercel

El proyecto está publicado en GitHub (`origin/main`) y preparado para desplegarse en Vercel con Node.js 22. La guía completa, el detalle de cada variable, la creación del preset de Cloudinary, el despliegue, la verificación y el diagnóstico están en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

Resumen:

1. Copia `.env.example` a `.env.local` y completa las claves reales.
2. Ejecuta `npm run lint`, `npm run typecheck`, `npm run verificar` y `npm run build`.
3. El repositorio ya está publicado; para nuevos cambios, `git push origin main`.
4. Importa el repositorio en Vercel, usa Node 22 y carga las variables de entorno.
5. Despliega, prueba una prédica real y descarga los PDF.
6. Actualiza `NEXT_PUBLIC_SITE_URL` con el dominio final y redespliega.

No se incluyen claves ni `.env.local` en el repositorio.

## Scripts

```bash
npm run dev            # desarrollo
npm run build          # compilación de producción
npm run start          # servidor de producción
npm run lint           # ESLint
npm run typecheck      # TypeScript sin emitir
npm run verificar      # suite completa de pruebas
npm run test:logica    # proporcionalidad del análisis
npm run test:modalidades
npm run test:pdf       # genera y audita los cinco PDF en tmp/pdf/
npm run test:entrega
npm run test:seguridad
npm run test:resiliencia
npm run test:identidad
```

Los PDF de prueba se escriben en `tmp/pdf/` y no se versionan. Las capturas y artefactos de revisión visual también quedan en `tmp/`.

## Resultados de verificación

Última ejecución local:

- `npm run lint`: 0 errores.
- `npm run typecheck`: 0 errores.
- `npm run build`: compilación correcta.
- `npm run verificar`: 70 pruebas superadas (lógica 11, modalidades 13, PDF 10, entrega 10, seguridad 9, resiliencia 9, identidad 8).
- Verificación visual de los cinco PDF y de la interfaz en escritorio y móvil.
- Descarga real desde el navegador comprobada con `teodoc-maim-jovenes.pdf` (6 páginas, texto con predicador y acentos).

La generación real mediante IA **no se pudo ejecutar** en este entorno porque no hay claves de proveedores configuradas. Las pruebas de contenido, normalización y PDF usan fixtures deterministas. Consulta `docs/PRUEBAS.md` para el detalle y `docs/IDENTIDAD.md` para las fuentes.

## Privacidad y cuidado

- La transcripción se envía al proveedor de IA para generar el estudio y no se almacena en el servidor de TeoDoc.
- El último resultado se guarda en `localStorage` durante 48 horas para recuperarlo ante una recarga. Se puede borrar desde la interfaz.
- La transcripción activa se conserva en `sessionStorage` de la pestaña.
- Si se sube audio, se procesa en Cloudinary y en el proveedor de transcripción. No se graba audio desde el navegador.
- Los resultados deben revisarse a la luz de la Biblia y con acompañamiento pastoral. No publiques datos personales sensibles en la transcripción.

## Documentación

- [`docs/MODALIDADES.md`](docs/MODALIDADES.md): estructura de cada modalidad.
- [`docs/PDF.md`](docs/PDF.md): diseño, recursos y nombres de los documentos.
- [`docs/IDENTIDAD.md`](docs/IDENTIDAD.md): fuente institucional, activos y límites.
- [`docs/PRUEBAS.md`](docs/PRUEBAS.md): cobertura, comandos y resultados.
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): flujo, endpoints, persistencia y seguridad.
- [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md): configuración de claves, Cloudinary, GitHub y Vercel.

## Repositorio

El remoto configurado de este trabajo es `https://github.com/rpmministry/teodoc-maim.git`. El repositorio fue publicado en `origin/main` con credenciales de Git; no es verificable públicamente sin credenciales (la API de GitHub respondió 404 en el entorno de trabajo). No se configuró un remoto `upstream` y no se desplegó en Vercel desde este entorno.

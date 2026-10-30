# Manual técnico — TeoDoc MAIM

**Versión:** 1.2.0
**Stack:** Next.js 16 (App Router con Turbopack), React 19, TypeScript, Tailwind CSS 4, jsPDF, docx, FFmpeg 7.1, yt-dlp, pdfjs-dist, JSZip.
**Alcance:** Ingesta unificada multimodo (enlace de video con probe/descarga/extracción directa de audio, subida de archivos multimedia, carga de documentos Word/PDF/ODT/RTF y texto directo pegado), análisis bíblico y teológico profundo, seis modalidades ministeriales adaptadas a modelos reales MAIM, generación de PDF y Word, biblioteca local y seguridad perimetral anti-SSRF.

La documentación detallada está en:

- [`README.md`](README.md)
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)
- [`docs/MODALIDADES.md`](docs/MODALIDADES.md)
- [`docs/PDF.md`](docs/PDF.md)
- [`docs/IDENTIDAD.md`](docs/IDENTIDAD.md)
- [`docs/REFERENCIAS.md`](docs/REFERENCIAS.md)
- [`docs/ESTRUCTURAS.md`](docs/ESTRUCTURAS.md)
- [`docs/PRUEBAS.md`](docs/PRUEBAS.md)

## 1. Flujo Unificado de Análisis

1. La persona accede a la ventana unificada de entrada con 3 orígenes disponibles:
   - **Enlace de YouTube:** Detección de enlace de prédica en YouTube, sondeo instantáneo de metadatos (`/api/multimedia/probe`) y extracción de transcripción/audio oficial (`/api/youtube`) en 1.5 segundos sin descargas pesadas de video en Vercel Serverless, pasando directamente al análisis ministerial completo. Para otras fuentes (ej. Facebook), se orienta al uso del enlace de YouTube o a la carga del audio en la pestaña multimedia.
   - **Archivo multimedia:** Subida directa de archivos de audio/video locales (`audio-file-input`), con procesamiento por fragmentos.
   - **Documento o texto:** Extracción automática de texto en servidor (`/api/document/extract`) para Word (`.docx`), PDF seleccionable (con alerta si es documento escaneado), OpenDocument (`.odt`), `.rtf` y texto plano (`.txt`), o pegado directo con contador de palabras y caracteres.
2. Si el contenido proviene de audio/video, se transcribe con AssemblyAI (respaldo: Deepgram `nova-2`).
3. Si proviene de documento o texto pegado, el contenido extraído entra directamente a la etapa de revisión editorial y análisis, ahorrando tiempo y costos de transcripción.
4. Se validan texto (mínimo 120 caracteres, máximo 250 000), modalidad y edad (si aplica a niños).
5. El servidor genera el análisis general y, si se eligió una especialidad, una segunda respuesta con el material específico siguiendo los modelos de liderazgo de MAIM (párrafos amplios continuos de 150 a 350+ palabras, tono en primera persona y cero alucinaciones).
6. El cliente muestra el análisis en pestañas interactivas y genera los documentos PDF y Word descargables en el navegador.

## 2. Estructura del Proyecto

```text
app/
  page.tsx                       Orquestación de la experiencia y retención
  layout.tsx                     Metadatos y tipografía IBM Plex Sans
  globals.css                    Tokens y componentes visuales Carbon/MAIM
  api/analyze/route.ts           Análisis general + modalidad ministerial
  api/transcribe/route.ts        Speech-to-text (AssemblyAI / Deepgram)
  api/upload/route.ts            Subida multimedia alternativa
  api/validate/route.ts          Validación orientativa
  api/youtube/route.ts           Compatibilidad de enlaces YouTube
  api/multimedia/
    probe/route.ts               Sondeo seguro de metadatos y formatos de video
    process/route.ts             Extracción de audio o descarga de video
    status/route.ts              Consulta de progreso SSE/polling de tareas
    download/route.ts            Entrega de archivos descargados con cabeceras seguras
  api/document/
    extract/route.ts             Extracción de texto para DOCX, PDF, ODT, RTF y TXT
components/
  formulario-analisis.tsx        Ventana unificada (Enlace, Archivo, Documento/Texto)
  editor-texto-pegar.tsx         Área de pegado directo y conteo persistente
  marca.tsx                      Marca y activos institucionales MAIM
  resultados/                    Presentación general y especializada
  liquid-orb.tsx                 Componente visual de estado conservado
lib/
  multimedia/
    detector.ts                  Detección de proveedores y firewall anti-SSRF
    job-manager.ts               Gestor asíncrono de tareas y ciclo de vida staging
    extractor.ts                 Envoltura segura de yt-dlp y FFmpeg con spawn
  documentos/
    extractor.ts                 Extracción de DOCX (JSZip), PDF (pdfjs) y detección escaneados
  tipos.ts                       Modelos compartidos
  modalidades.ts                 Catálogo, nombres de PDF y reglas editoriales MAIM
  normalizar.ts                  Saneamiento y normalización
  validacion-formulario.ts       Reglas del formulario
  audio-upload.ts                Cloudinary por partes
  entrega.ts                     Descarga y Web Share
  institucional.ts               Identidad verificada
  pdf/                           Generación de los seis PDF adaptados a párrafos extensos
  docx/                          Generación de los seis Word
  biblioteca.ts                  Persistencia local e historial
  referencias.ts                 Inventario y estado de verificación
  biblia.ts                      Verificación con GetBible y dominio público
bin/
  ffmpeg.exe                     Binario estático FFmpeg 7.1
  yt-dlp.exe                     Binario estático yt-dlp 2026.10.26
scripts/                         Pruebas unitarias y de integración
public/
  institucional/                 Logotipo e isotipo oficiales
  fonts/                         IBM Plex Sans + licencia OFL
```

## 3. Seguridad Perimetral y Protección Anti-SSRF

El sistema implementa una barrera estricta antes de procesar cualquier URL remota:
- **Validación de esquema:** Únicamente `http:` y `https:`.
- **Filtro Anti-SSRF:** Bloqueo incondicional de direcciones locales (`localhost`, `127.0.0.1`, `::1`), redes privadas IPv4 (RFC 1918: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Carrier-Grade NAT (`100.64.0.0/10`), Link-Local (`169.254.0.0/16`), metadatos de proveedores de nube (`169.254.169.254`, `metadata.google.internal`), nombres `.local` y credenciales incrustadas en URL (`usuario:password@host`).
- **Aislamiento de procesos:** La ejecución de `yt-dlp` y `ffmpeg` se realiza mediante arrays de argumentos en `spawn` de Node.js, erradicando inyecciones de comandos shell.
- **Ciclo de vida de archivos temporales:** Directorio `tmp/staging/` con TTL de 30 minutos y limpieza automática de huérfanos.

## 4. Calidad Editorial y Modelos Ministeriales MAIM

Se integraron las características de los documentos oficiales de liderazgo de la iglesia MAIM (`ACTIVANDO UN PENTECOSTES...` y `EL DESBORDAMIENTO...`):
- **Menos divisiones fragmentadas:** El análisis general y el bosquejo ministerial se articulan en 2 a 4 grandes secciones magistrales.
- **Párrafos de amplio desarrollo:** Cada punto central contiene reflexiones continuas de 150 a 350+ palabras sin viñetas telegráficas ni listas artificiales.
- **Voz ministerial unificada:** Redacción inspiradora en primera persona plural ("reconozco", "anhelamos", "estamos llamados") o pastoral vivencial. Prohibición estricta de meta-narrador en tercera persona distante ("el predicador dijo", "el orador menciona").
- **Estudio de términos bíblicos originales:** Rescate de palabras en hebreo o griego (ej. *KOINONIA*, *BAPTIZO*, *EKBALO*) y contextualización profética.
- **Cero alucinación:** Las citas bíblicas se verifican con la base de datos textual y no se inventan biografías ni eventos ajenos a la prédica analizada.

## 5. Pruebas y Verificación

```bash
npm run typecheck
npm run build
npm run verificar
```

La suite local (98 pruebas automatizadas en 12 archivos de prueba) cubre:
- Extracción de modelos Word MAIM y detección de términos clave.
- Extracción de texto PDF página a página y detección de documentos escaneados.
- Extracción y normalización de texto plano y RTF.
- Filtrado anti-SSRF y detección de proveedores de video.
- Ciclo de vida y cancelación del Job Manager.
- Detección de binarios FFmpeg y yt-dlp.
- Lógica de riqueza, modalidades ministeriales, verificación bíblica RVC.
- Generación de los seis PDF y seis documentos Word.
- Biblioteca local, resiliencia (Screen Wake Lock), seguridad perimetral e identidad institucional.

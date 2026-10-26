# Manual técnico — TeoDoc MAIM

**Versión:** 1.0.0
**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, jsPDF.
**Alcance:** análisis bíblico, cinco modalidades, PDF, Word, referencias detectadas y biblioteca local. La generación de infografías fue retirada.

La documentación detallada está en:

- [`README.md`](README.md)
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)
- [`docs/MODALIDADES.md`](docs/MODALIDADES.md)
- [`docs/PDF.md`](docs/PDF.md)
- [`docs/IDENTIDAD.md`](docs/IDENTIDAD.md)
- [`docs/REFERENCIAS.md`](docs/REFERENCIAS.md)
- [`docs/ESTRUCTURAS.md`](docs/ESTRUCTURAS.md)
- [`docs/PRUEBAS.md`](docs/PRUEBAS.md)

## 1. Flujo

1. La persona elige la modalidad y sube el audio del mensaje.
2. El audio se sube a Cloudinary y se transcribe con AssemblyAI (respaldo: Deepgram `nova-2`).
3. La transcripción se revisa y se edita.
4. Se validan texto, modalidad y edad.
5. El servidor genera el análisis general y, si se eligió una especialidad, una segunda respuesta con el material específico.
6. El cliente muestra el análisis en pestañas y genera el PDF en el navegador.

## 2. Estructura

```text
app/
  page.tsx                    Orquestación de la experiencia
  layout.tsx                  Metadatos y tipografía
  globals.css                 Tokens y componentes visuales
  api/analyze/route.ts        Análisis general + modalidad
  api/transcribe/route.ts     Speech-to-text
  api/upload/route.ts         Subida alternativa
  api/validate/route.ts       Validación orientativa
components/
  formulario-analisis.tsx     Datos, modalidad y audio
  marca.tsx                   Marca y activos
  resultados/                 Presentación general y especializada
  liquid-orb.tsx              Componente visual compartido conservado
lib/
  tipos.ts                    Modelos compartidos
  modalidades.ts              Catálogo y nombres de PDF
  normalizar.ts               Saneamiento y normalización
  validacion-formulario.ts    Reglas del formulario
  audio-upload.ts             Cloudinary por partes
  entrega.ts                  Descarga y Web Share
  institucional.ts            Identidad verificada
  pdf/                        Generación de los cinco PDF
  docx/                       Generación de los cinco Word
  biblioteca.ts               Persistencia local e historial
  referencias.ts              Inventario y estado de verificación
  biblia.ts                   Verificación con GetBible y dominio público
scripts/                      Pruebas y fixtures
public/
  institucional/              Logotipo e isotipo oficiales
  fonts/                      IBM Plex Sans + licencia OFL
```

## 3. API de análisis

`POST /api/analyze` recibe `text`, `modalidad`, `rangoEdad`, `titulo`, `predicador` y `fecha`. Devuelve el análisis general, los metadatos y `especializado`. El nombre del predicador se conserva como metadato separado y no se usa para inventar una biografía.

Cadena de proveedores: Gemini → OpenRouter → DeepSeek. Si falla la especialidad, el general se conserva y se informa. Límites: 120–250 000 caracteres, rate limit por IP y modalidad validada.

## 4. Persistencia y privacidad

- Servidor: sin almacenamiento de transcripciones ni resultados.
- `localStorage`: último resultado, TTL 48 h.
- `sessionStorage`: transcripción de la pestaña.
- Cloudinary y el transcriptor reciben el audio.
- La descarga del PDF ocurre en el cliente; el documento no se sube a un servidor.
- Las claves de IA viven solo en el entorno del servidor.

## 5. PDF

- A4 vertical, jsPDF, fuente IBM Plex Sans incrustada.
- Logotipo oficial en portada, isotipo en el pie.
- Numeración `Página X de Y`, metadatos del documento, secciones y tablas.
- Nombres exactos en `lib/modalidades.ts`.
- Se omite el bloque del predicador si el campo está vacío.

## 6. Identidad

Nombre público verificado: **MAIM Casa de Oración**. Fuente: página oficial de Facebook, consultada el 26/10/2026. No se inventaron misión, visión, doctrina, autoridades ni organigrama. Ver `docs/IDENTIDAD.md`.

## 7. Pruebas

```bash
npm run lint
npm run typecheck
npm run build
npm run verificar
```

La suite local (87 pruebas) cubre lógica, modalidades, verificación bíblica y RVC, los cinco PDF, los cinco Word, biblioteca, entrega, seguridad, resiliencia e identidad. No requiere claves. La generación real general se probó con 347 caracteres (HTTP 200, 96 s) mediante el respaldo; Gemini 3.8 estaba saturado y 4.0 no disponible.

## 8. Límites

- Publicado en GitHub (`origin/main`).
- Sin despliegue en Vercel ni operaciones remotas destructivas.
- La transcripción de audio y las cinco especialidades en vivo no se probaron; la generación general real sí se verificó.
- La revisión editorial del contenido generado sigue siendo responsabilidad del equipo pastoral.

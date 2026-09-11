# Reporte Técnico de Traspaso — TeoDoc (analizador-ministerial)
**Auditor:** Arquitecto de Software / Auditor de Código Senior
**Repositorio analizado:** `rpmministry/teodoc-app` (código fuente subido como `analizador-ministerial.zip`)
**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
**Fecha del análisis:** Septiembre 2026

---

## 1. Resumen Ejecutivo

**TeoDoc** es una aplicación web que convierte grabaciones de audio de prédicas o enseñanzas eclesiásticas en material de estudio estructurado. El flujo central es:

`Audio subido → Transcripción (Speech-to-Text) → Análisis teológico (LLM) → Reporte + infografía + PDF descargables`

El proyecto está construido enteramente como una app Next.js de una sola página, con tres rutas de API server-side que actúan como *proxies* hacia servicios de IA de terceros (transcripción y modelos de lenguaje), bajo una filosofía explícita de "costo cero" (usar exclusivamente niveles gratuitos de APIs externas con failover entre proveedores).

**Diagnóstico general:** el software es funcional y la idea de producto es sólida, pero el código presenta las características típicas de un proyecto desarrollado de forma iterativa y asistida por IA sin una fase de arquitectura ("vibe coding"): un componente monolítico de 701 líneas que mezcla UI, orquestación de red y generación de documentos; ausencia total de autenticación, autorización y límites de tasa en endpoints que consumen APIs de pago/cuota; credenciales reales expuestas en un archivo de entorno incluido en el traspaso; una arquitectura "fantasma" duplicada y no utilizada (componentes y libs completos sin importar); y una lista larga de dependencias instaladas pero nunca usadas. No hay pruebas automatizadas de ningún tipo.

**Prioridad de intervención:** Seguridad y control de costos primero (claves expuestas, endpoints sin protección, subida no firmada a Cloudinary), luego modularización del frontend, y finalmente limpieza de deuda técnica y dependencias.

---

## 2. Arquitectura Actual y Flujo de Datos

### 2.1 Estructura real (código vivo)

```
app/
 ├─ page.tsx                 ← Componente monolítico (701 líneas): UI completa,
 │                              subida de archivo, orquestación del pipeline,
 │                              generación de PDF e infografía, modal de feedback.
 ├─ layout.tsx                ← Layout raíz (fuentes, metadata)
 └─ api/
     ├─ upload/route.ts       ← Sube a Cloudinary usando API secret (server-side)
     ├─ transcribe/route.ts   ← AssemblyAI (principal) → Deepgram (fallback)
     └─ analyze/route.ts      ← OpenRouter (principal, modelos gratuitos dinámicos)
                                 → Google Gemini SDK (fallback)
```

### 2.2 Flujo de datos real (el que efectivamente se ejecuta)

1. El usuario selecciona un archivo de audio en `page.tsx` (validación de tamaño/extensión **solo en cliente**).
2. `page.tsx` sube el archivo **directamente desde el navegador a Cloudinary** (`uploadFileToCloudinary`), usando un *unsigned upload preset* (`teodoc_preset`) y un `cloud_name` hardcodeado como valor de respaldo (`antbfat3`).
3. Con la `secure_url` devuelta por Cloudinary, el cliente llama a `POST /api/transcribe` con esa URL.
4. `transcribe/route.ts` intenta transcribir con AssemblyAI; si falla, hace `fetch` directo a la API REST de Deepgram.
5. El texto transcrito se envía a `POST /api/analyze`.
6. `analyze/route.ts` primero consulta dinámicamente el catálogo de modelos gratuitos de OpenRouter, intenta hasta 3 veces con backoff exponencial contra los primeros 3 modelos `:free`; si todo falla, usa el SDK nativo de Google GenAI (`gemini-3.6-flash`) con un `responseSchema` estricto.
7. El JSON resultante se muestra en pantalla, y el usuario puede exportarlo como **PDF** (con `jsPDF`, ejecutado en el navegador) o como **imagen JPEG** de la infografía (con `dom-to-image-more`).

### 2.3 Arquitectura "fantasma" (código muerto, no conectado)

El repositorio contiene una **segunda arquitectura completa y paralela** que no se usa en absoluto:

- `components/upload-hero.tsx` — un componente `UploadHero` alternativo, más limpio y modular.
- `components/report-view.tsx` — un componente de visualización de resultados.
- `lib/sample-analysis.ts` y `lib/map-analysis.ts` — tipos y un *mapper* (`mapGeminiToAnalisis`) para transformar la salida cruda de Gemini a un modelo `Analisis`, con nombres de campos que **ni siquiera coinciden** con el esquema actualmente producido por `api/analyze/route.ts` (`titulo_estudio` / `aplicacion_practica` / `oracion_final` vs. el esquema real `titulo` / `aplicacion` / `oracion`).

Se confirmó mediante `grep` que ningún archivo de `app/` importa estos componentes. Esto indica que en algún punto se generó (probablemente con un scaffolding tipo v0/shadcn) una versión modular del producto que luego fue **abandonada** en favor del componente monolítico actual, pero nunca se eliminó del repositorio.

### 2.4 Diagrama de flujo (alto nivel)

```
[Navegador] --(1)--> [Cloudinary: unsigned upload]
     |                       (bypassa el backend por completo)
     v
[Navegador] --(2)--> [/api/transcribe] --> AssemblyAI --(fallback)--> Deepgram
     |
     v
[Navegador] --(3)--> [/api/analyze] --> OpenRouter (modelos :free) --(fallback)--> Gemini SDK
     |
     v
[Navegador] --(4)--> jsPDF / dom-to-image-more (generación 100% client-side)
```

Nótese que **`/api/upload/route.ts` (que sí usa el API secret de Cloudinary en servidor) no forma parte de este flujo real** — es código muerto también, reemplazado por la subida directa desde el cliente.

---

## 3. Bugs, Vulnerabilidades de Seguridad, Cuellos de Botella y Malas Prácticas

### 🔴 Críticos (seguridad / costo)

1. **Credenciales reales expuestas en el traspaso.** El archivo `.env.local` incluido contiene claves API *en texto plano y aparentemente válidas* para OpenRouter, Gemini, AssemblyAI, Groq y Deepgram, y un placeholder para Anthropic. Aunque `.env*` está correctamente en `.gitignore` (no se subió a Git), **estas claves ya se consideran comprometidas por haber circulado fuera del control de acceso original** y deben rotarse de inmediato en cada proveedor antes de continuar cualquier trabajo sobre este código.
2. **Ningún endpoint de API tiene autenticación, autorización ni rate limiting.** `/api/analyze`, `/api/transcribe` y `/api/upload` son públicos y aceptan cualquier `POST`. Cualquiera que descubra las rutas puede: (a) agotar las cuotas gratuitas de OpenRouter/Gemini/AssemblyAI/Deepgram a nombre del proyecto, (b) generar facturación no controlada si se agregan modelos de pago, (c) usar el endpoint como proxy gratuito de LLM para fines ajenos a la app.
3. **Subida a Cloudinary sin firmar (*unsigned upload preset*) desde el cliente.** Cualquier usuario puede usar `teodoc_preset` y el `cloud_name` (visibles en el bundle JS) para subir archivos arbitrarios a la cuenta de Cloudinary del ministerio, sin pasar por ninguna validación del servidor — riesgo de abuso de almacenamiento/ancho de banda y de alojamiento de contenido no deseado.
4. **Validación de archivo solo en el cliente.** Los límites de tamaño (500 MB) y extensión en `page.tsx` son trivialmente evitables llamando directamente a los endpoints con `curl`/Postman. No existe validación de tipo MIME real ni de tamaño en `/api/transcribe` ni en Cloudinary del lado servidor.
5. **Enlace público a la colección completa de audios en Cloudinary**, embebido directamente en la barra de navegación (`https://collection.cloudinary.com/antbfat3/...`). Si esa colección es de acceso público, **expone todas las prédicas subidas por todos los usuarios** — un problema de privacidad de datos, ya que el contenido de audio ministerial podría incluir información sensible de congregantes.
6. **Contenido de usuario enviado a múltiples terceros sin aviso ni control.** El texto transcrito de las prédicas se envía a OpenRouter (que a su vez enruta a distintos proveedores de modelos gratuitos, cuyas políticas de retención de datos varían) y a Google Gemini, sin ningún banner de consentimiento ni política de privacidad visible en el código auditado.

### 🟠 Altos (fiabilidad / mantenibilidad)

7. **Nombre de modelo posiblemente inválido:** `gemini-3.6-flash` (línea 135 de `analyze/route.ts`). No corresponde a ninguna nomenclatura pública conocida de modelos Gemini; si es un error de tipeo o un modelo descontinuado, el *fallback* de todo el pipeline queda inutilizado silenciosamente.
8. **Duplicación de lógica de retry/backoff.** La lógica de reintentos con backoff exponencial y lectura de `Retry-After` está copiada casi idéntica en `analyze/route.ts` (dos veces, una por proveedor) y replicada conceptualmente en `transcribe/route.ts`. Viola DRY y cada copia puede divergir con el tiempo.
9. **Sin validación de esquema en la ruta OpenRouter.** El *fallback* con Gemini usa `responseSchema` estricto (bien hecho), pero la ruta primaria (OpenRouter) solo confía en que el modelo obedezca el `systemPrompt` y hace `JSON.parse` a ciegas (`extraerJSON`). Cualquier modelo gratuito que devuelva texto adicional, comillas mal escapadas, o un JSON parcialmente inválido, rompe todo el pipeline con un error genérico de 500.
10. **Dependencia fantasma:** `jspdf` se importa directamente en `app/page.tsx` pero **no figura en `package.json`**; llega de forma transitiva a través de `html2pdf.js` (que tampoco se usa). Esto funciona hoy por casualidad de cómo `npm`/`node_modules` resuelve paquetes anidados, pero puede romperse con cualquier actualización de dependencias.
11. **Timeout de función potencialmente insuficiente.** `maxDuration = 60` en `analyze` y `transcribe` para transcripciones que, según el propio README, pueden superar 35.000 caracteres de texto (audios largos). AssemblyAI documenta soporte de *webhooks* para procesamiento asíncrono, que no se está aprovechando; el patrón actual es completamente síncrono y bloqueante desde el navegador, con riesgo real de timeout en sermones largos.
12. **Manejo de errores con `any` en todo el código de servidor** (`catch (error: any)`, `body: any`, `err: any`), perdiendo el chequeo de tipos de TypeScript justo donde más importa (límites del sistema con servicios externos).
13. **Historial de commits de tipo "parche en caliente"** (`fix: solucionar bug de contorno cuadrado en android/windows`, `debug: agregar alerta táctil en botón analizar prédica`, etc.) indica ausencia de entorno de *staging* o pruebas cross-browser antes de producción.

### 🟡 Medios (deuda técnica / código muerto)

14. **Componente monolítico de 701 líneas** (`app/page.tsx`) mezclando: estado de UI, lógica de subida de archivos, orquestación de 3 llamadas de red secuenciales, generación de PDF, generación de imagen, y un modal de feedback — sin separación de responsabilidades ni componentes reutilizables.
15. **Arquitectura duplicada y no utilizada** (ver sección 2.3): `upload-hero.tsx`, `report-view.tsx`, `map-analysis.ts`, `sample-analysis.ts` — código muerto que confunde a cualquier desarrollador (humano o IA) que intente entender el proyecto, y que además tiene un **esquema de datos inconsistente** con el que realmente se usa.
16. **9 dependencias instaladas y declaradas en `package.json` sin ningún uso detectado en el código fuente:** `@anthropic-ai/sdk`, `@deepgram/sdk`, `ffmpeg-static`, `fluent-ffmpeg`, `groq-sdk`, `html2pdf.js`, `openai`, `react-markdown`, `uuid`. Esto infla el tiempo de instalación/build, la superficie de ataque de la cadena de suministro, y sugiere pivotes de arquitectura no limpiados (p. ej., se evaluó Groq/OpenAI/Anthropic directos y se descartaron).
17. **Deepgram se usa vía `fetch` crudo a la API REST**, ignorando el SDK oficial `@deepgram/sdk` ya instalado — inconsistente con el enfoque usado para AssemblyAI (que sí usa su SDK), y renuncia a manejo de errores/reintentos que el SDK probablemente ya ofrece.
18. **`console.log`/`console.warn`/`console.error` como único mecanismo de logging**, sin IDs de correlación de request, sin niveles configurables, sin integración con un servicio de observabilidad — muy difícil de depurar en producción.
19. **Sin ninguna prueba automatizada** (no hay carpeta de tests, no hay librería de testing en `devDependencies`, no hay CI configurado en el árbol de archivos).
20. **`next.config.ts` con una IP de LAN hardcodeada** (`allowedDevOrigins: ['192.168.100.21']`) — artefacto de entorno de desarrollo de un contribuidor específico que no debería estar en el repo compartido.
21. **Formulario de feedback sin protección anti-spam** (`formsubmit.co`, sin CAPTCHA ni verificación) — endpoint público abierto para enviar correos al buzón del ministerio, vector de spam/relay.
22. **Inconsistencia de saltos de línea** (`layout.tsx` en CRLF, resto probablemente en LF) — indicio de colaboración sin `.editorconfig`/`.gitattributes`, genera ruido en diffs de Git.
23. **Discrepancia entre lo prometido y lo real en tamaños de archivo:** el frontend permite hasta 500 MB, pero el README indica que AssemblyAI procesa "hasta ~40 MB" — un archivo grande pasará la validación del cliente y fallará más adelante en el pipeline con un mensaje de error genérico, mala experiencia de usuario.

---

## 4. Oportunidades de Mejora

### Seguridad
- Rotar **todas** las claves API expuestas y moverlas a un gestor de secretos (Vercel Environment Variables / equivalente), nunca en archivos versionables.
- Añadir autenticación mínima (API key propia, JWT de sesión, o al menos un `Origin`/CSRF check) a los tres endpoints de API.
- Implementar *rate limiting* por IP/sesión (p. ej. con `@upstash/ratelimit` si se despliega en Vercel, o middleware propio).
- Migrar la subida de Cloudinary a **firma server-side** (`cloudinary.utils.api_sign_request`) en vez de *unsigned preset*, reactivando y arreglando `/api/upload/route.ts` como único punto de entrada válido.
- Revisar y, si aplica, restringir el acceso a la colección pública de Cloudinary.
- Validar tipo MIME real (no solo extensión) y tamaño en el servidor antes de reenviar a proveedores de pago/cuota.

### Escalabilidad y rendimiento
- Convertir el pipeline transcripción→análisis en un flujo **asíncrono basado en eventos/colas** (webhooks de AssemblyAI, o una cola como Vercel Queue/QStash/Inngest) en vez de mantener al navegador esperando sobre 2-3 llamadas HTTP secuenciales potencialmente largas.
- Cachear la lista de modelos gratuitos de OpenRouter (actualmente se refetch en cada request de análisis) con un TTL corto, en vez de una llamada de red adicional por cada análisis.
- Extraer la lógica de retry/backoff a un helper único y reutilizable (`lib/withRetry.ts`) parametrizable por proveedor.

### Modularidad y mantenibilidad
- Descomponer `app/page.tsx` en componentes: `FileDropzone`, `AnalysisProgress`, `ReportView`, `InfographicPreview`, `FeedbackModal`, y hooks (`usePredicaPipeline`, `usePdfExport`, `useInfographicExport`).
- Decidir y ejecutar: o se retoma y conecta la arquitectura modular existente (`upload-hero.tsx`, `report-view.tsx`, `map-analysis.ts`) actualizándola al esquema real, o se elimina por completo. No debe convivir código muerto con el código vivo.
- Definir un **contrato de tipos único y compartido** entre backend (`analyze/route.ts`) y frontend (hoy los tipos de `PredicaAnalisis` viven duplicados/hardcodeados en `page.tsx`), idealmente validado en runtime con `zod` (ya está disponible transitivamente vía `zod-validation-error`/`zod-to-json-schema` en `node_modules`, pero no como dependencia directa usada).
- Ejecutar `depcheck` (o equivalente) y eliminar todas las dependencias no usadas; declarar explícitamente `jspdf`.

### Calidad y observabilidad
- Introducir pruebas: unitarias para `extraerJSON`/mappers, e2e mínimas (Playwright) para el flujo feliz de subida→resultado.
- Reemplazar `console.*` por un logger estructurado (p. ej. `pino`) con un `requestId` por pipeline, para poder correlacionar los 3 pasos (upload/transcribe/analyze) de una misma solicitud de usuario.
- Añadir manejo tipado de errores (evitar `any`) y una capa de "Result"/error tipado en las rutas API.
- Configurar CI (lint + typecheck + build) antes de cualquier merge.

---

## 5. Plan de Acción para la Refactorización

**Fase 0 — Contención inmediata (antes de tocar código)**
1. Rotar todas las claves API en cada proveedor (OpenRouter, Gemini, AssemblyAI, Groq, Deepgram, OpenAI, Cloudinary) y reemplazarlas en un gestor de secretos, nunca en un `.env` versionable ni compartido por chat/zip de nuevo.
2. Verificar y, si es necesario, restringir/despublicar la colección de Cloudinary enlazada en la navbar.

**Fase 1 — Seguridad de endpoints**
3. Añadir firma server-side a la subida de Cloudinary y eliminar el *unsigned preset* del cliente; hacer que el frontend vuelva a pasar por `/api/upload` (reparándolo, ya que hoy es código muerto).
4. Añadir validación server-side de tipo y tamaño de archivo en `/api/upload` y `/api/transcribe`.
5. Añadir rate limiting básico y un mecanismo mínimo de autenticación/token en las tres rutas API.

**Fase 2 — Saneamiento de dependencias y código muerto**
6. Ejecutar un análisis de dependencias no usadas y eliminarlas del `package.json` (`@anthropic-ai/sdk`, `@deepgram/sdk`, `ffmpeg-static`, `fluent-ffmpeg`, `groq-sdk`, `html2pdf.js`, `openai`, `react-markdown`, `uuid`); declarar `jspdf` explícitamente.
7. Decidir el destino de `components/upload-hero.tsx`, `components/report-view.tsx`, `lib/map-analysis.ts`, `lib/sample-analysis.ts`: eliminarlos o integrarlos — nunca dejarlos huérfanos.
8. Unificar el uso de SDKs oficiales (usar `@deepgram/sdk` en vez de `fetch` crudo, o documentar explícitamente por qué no).

**Fase 3 — Modularización del frontend**
9. Extraer de `app/page.tsx` los componentes de presentación (`FileDropzone`, `AnalysisProgress`, `ReportView`, `InfographicPreview`, `FeedbackModal`).
10. Extraer la lógica de orquestación del pipeline a un hook (`usePredicaPipeline`) y las exportaciones (PDF/imagen) a hooks/utilidades separadas (`usePdfExport`, `useInfographicExport`).
11. Definir tipos compartidos (idealmente con `zod`) entre `app/api/analyze/route.ts` y el frontend, validando en runtime la respuesta del LLM en **ambos** proveedores (hoy solo Gemini tiene `responseSchema`; OpenRouter no valida nada).

**Fase 4 — Robustez del pipeline de IA**
12. Extraer un helper único `withRetry(fn, { retries, baseDelayMs })` y reemplazar las tres implementaciones duplicadas de backoff exponencial.
13. Verificar y corregir el identificador real del modelo Gemini de respaldo (`gemini-3.6-flash` parece incorrecto/inexistente).
14. Migrar transcripción de sermones largos a un patrón asíncrono (webhook/cola) para eliminar el riesgo de timeout de función y desacoplar al usuario de una espera bloqueante.

**Fase 5 — Calidad, observabilidad y despliegue**
15. Introducir logging estructurado con `requestId` correlacionado entre los tres pasos del pipeline.
16. Añadir pruebas unitarias (parsers/mappers) y al menos un test e2e del flujo feliz.
17. Configurar un pipeline de CI (lint, typecheck, build, tests) como *gate* antes de cualquier despliegue, y establecer un entorno de *staging* para evitar el patrón actual de "fix en producción" observado en el historial de commits.
18. Alinear el límite de tamaño de archivo expuesto al usuario (500 MB) con la capacidad real documentada del proveedor de transcripción (~40 MB), o segmentar/comprimir el audio antes de enviarlo.

---

### Nota final para la IA que continúe este trabajo
Antes de escribir código nuevo, confirmar con el equipo humano: (a) si la arquitectura modular en `components/` y `lib/map-analysis.ts` se retoma o se borra, y (b) cuál es el modelo de fallback correcto de Gemini, ya que `gemini-3.6-flash` no pudo verificarse como un identificador válido en esta auditoría.

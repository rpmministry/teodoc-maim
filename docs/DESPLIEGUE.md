# Guía de configuración, GitHub y Vercel

Esta guía describe el despliegue real de TeoDoc MAIM. Sustituye cualquier valor de ejemplo por los de tu cuenta. No publiques claves ni subas `.env.local`.

## 1. Requisitos locales

- Node.js 22 LTS (mínimo 20.9).
- npm 10 o superior.
- Cuenta de GitHub con acceso al repositorio.
- Cuenta de Vercel.
- Cuentas de los proveedores de IA y transcripción que vayas a usar.
- Cuenta de Cloudinary si vas a procesar audio.

```bash
npm ci
npm run dev
```

Abre `http://localhost:3000`.

Antes de publicar:

```bash
npm run lint
npm run typecheck
npm run verificar
npm run build
```

## 2. Variables de entorno

Crea `.env.local` a partir de `.env.example`. Nunca lo agregues a Git.

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `GEMINI_API_KEY` | Una de las tres de IA | Proveedor principal de análisis |
| `OPENROUTER_API_KEY` | Alternativa | Respaldo con modelos gratuitos |
| `DEEPSEEK_API_KEY` | Alternativa | Último respaldo |
| `DEEPSEEK_MODEL` | No | Por defecto `deepseek-chat` |
| `ASSEMBLYAI_API_KEY` | Para audio | Transcriptor principal |
| `DEEPGRAM_API_KEY` | Respaldo de audio | Transcriptor alternativo |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Para audio | Cloud name usado por cliente y servidor |
| `CLOUDINARY_API_KEY` | Opcional | Ruta `/api/upload` |
| `CLOUDINARY_API_SECRET` | Opcional | Ruta `/api/upload`; nunca exponer |
| `NEXT_PUBLIC_SITE_URL` | Producción | URL pública sin barra final; resuelve Open Graph |
| `SUPADATA_API_KEY` | No | Proveedor heredado de transcripción por URL |
| `TRANSCRIPT_SERVICE_URL` | No | Servicio propio de transcripción |
| `TRANSCRIPT_SERVICE_TOKEN` | No | Token del servicio propio |
| `TRANSCRIPT_PROVIDER_ORDER` | No | Orden de proveedores por URL |

Reglas:

- Al menos una clave de IA debe estar configurada.
- Para audio, configura AssemblyAI, Deepgram o ambos.
- `NEXT_PUBLIC_*` se expone al navegador: solo debe contener datos públicos, como el cloud name.
- No pongas `CLOUDINARY_API_SECRET`, `GEMINI_API_KEY` ni similares en variables `NEXT_PUBLIC_*`.

### Cómo obtener las claves

- **Gemini:** Google AI Studio, sección API keys. Copia la clave a `GEMINI_API_KEY`.
- **OpenRouter:** panel de OpenRouter, sección Keys. Copia a `OPENROUTER_API_KEY`.
- **DeepSeek:** plataforma de DeepSeek, API keys. Copia a `DEEPSEEK_API_KEY`.
- **AssemblyAI:** dashboard, API key.
- **Deepgram:** console, API keys.

Los modelos configurados en `lib/ai-gemini.ts` son `gemini-3.7-flash` y `gemini-3.6-flash`. Si tu cuenta no los ofrece, cámbialos por modelos disponibles y vuelve a ejecutar las pruebas.

## 3. Cloudinary para audio

1. Crea una cuenta y copia el **Cloud name**.
2. En **Settings > Upload > Upload presets**, crea un preset:
   - Nombre exacto: `teodoc_preset`.
   - Modo: **Unsigned**.
   - Carpeta: `teodoc/audio`.
   - Resource type: video/audio.
   - Formatos permitidos: los que acepta la app (MP3, M4A, WAV, MP4, AAC, OGG, OPUS, FLAC, etc.).
   - Tamaño máximo: el que permita tu plan. La app admite hasta 500 MB, pero el plan de Cloudinary puede limitar menos.
3. Configura `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` con tu cloud name.
4. Para la ruta server-side `/api/upload`, agrega también `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.

La app usa carga directa sin firma para el flujo principal. El preset unsigned es público por diseño; limita formatos, carpeta y tamaño en Cloudinary. Si necesitas uploads firmados, es un cambio de arquitectura adicional.

## 4. Publicar en GitHub

El repositorio de trabajo está en la rama `main` y su remoto es:

```text
https://github.com/rpmministry/teodoc-maim.git
```

Flujo recomendado:

```bash
git status
git add -A
git commit -m "feat(teodoc-maim): publicar análisis, modalidades y PDF"
git push origin main
```

Antes de hacer `push`, confirma que no se incluyan:

- `.env.local` ni ningún archivo `.env` real.
- `node_modules/`, `.next/` ni `tmp/`.
- Claves, tokens o capturas con datos personales.

Comprobación rápida:

```bash
git status --short
git diff --check
```

Si el remoto es privado, Git Credential Manager pedirá autenticación la primera vez. No compartas el token en la terminal ni en capturas.

## 5. Publicar en Vercel

### 5.1 Importar el proyecto

1. Entra en https://vercel.com/new.
2. Conecta la cuenta de GitHub si aún no lo está.
3. Importa `rpmministry/teodoc-maim`.
4. Configura:
   - **Framework Preset:** Next.js.
   - **Root Directory:** `./`.
   - **Build Command:** `npm run build`.
   - **Install Command:** `npm ci` o `npm install`.
   - **Output Directory:** dejar vacío (lo detecta Next.js).
   - **Node.js Version:** 22.x.
5. No despliegues aún: primero agrega las variables.

### 5.2 Variables en Vercel

En **Settings > Environment Variables**, agrega las mismas variables de `.env.local` para **Production** y, si quieres, **Preview**.

Para el primer despliegue puedes dejar:

```text
NEXT_PUBLIC_SITE_URL=https://TU-PROYECTO.vercel.app
```

Cuando Vercel te asigne el dominio final, actualiza esa variable con la URL real sin barra final y vuelve a desplegar.

### 5.3 Desplegar

1. Pulsa **Deploy**.
2. Espera el build. Debe terminar con las rutas `/`, `/api/analyze`, `/api/transcribe`, `/api/upload`, `/api/validate`, `/api/youtube`, `/icon.png` y `/apple-icon.png`.
3. Abre la URL de producción.
4. Genera un análisis de prueba con una transcripción real o de prueba.
5. Descarga el PDF de la modalidad y el análisis general.
6. Verifica la vista previa, el botón Compartir y la descarga en móvil.

### 5.4 Si usas Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add GEMINI_API_KEY production
vercel env add OPENROUTER_API_KEY production
vercel env add ASSEMBLYAI_API_KEY production
vercel env add DEEPGRAM_API_KEY production
vercel env add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME production
vercel env add CLOUDINARY_API_KEY production
vercel env add CLOUDINARY_API_SECRET production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel --prod
```

Repite `vercel env add` para los proveedores que uses. `vercel env pull .env.local` descarga las variables para desarrollo local.

## 6. Dominio propio

1. En Vercel: **Settings > Domains > Add**.
2. Configura el DNS que Vercel indique.
3. Espera la emisión del certificado.
4. Actualiza `NEXT_PUBLIC_SITE_URL` al dominio definitivo y redespliega.

## 7. Verificación posterior al despliegue

- `GET /` responde 200 y muestra TeoDoc MAIM y la identidad MAIM.
- `GET /icon.png` responde 200 con `image/png`.
- `POST /api/analyze` con texto vacío responde 400.
- `POST /api/analyze` con texto válido y claves configuradas responde 200.
- El PDF descargado contiene el nombre del predicador, la portada oficial y la numeración.
- La vista previa PDF funciona y no hay errores CSP.
- La carga de audio usa tu cloud name, no el fallback.

## 8. Diagnóstico

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| 503 al analizar | Ninguna clave de IA o proveedor caído | Configura al menos una clave; revisa logs |
| 504 o timeout | El plan de Vercel limita la duración | Usa un plan con mayor `maxDuration` o reduce la cadena de proveedores |
| 413 | Texto mayor a 250 000 caracteres | Divide la transcripción |
| Error al subir audio | Preset unsigned ausente o cloud name incorrecto | Crea `teodoc_preset` y revisa `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |
| PDF no descarga en iOS | Comportamiento esperado | Usa **Ver PDF** y **Compartir** |
| Vista previa vacía | CSP o visor del navegador | Usa el enlace «Si el visor no carga, abrir el PDF» |
| Open Graph apunta a localhost | `NEXT_PUBLIC_SITE_URL` sin configurar | Configura el dominio y redespliega |
| Push rechazado | Sin permisos o rama desactualizada | Autentica Git Credential Manager y ejecuta `git pull --rebase` |

## 9. Seguridad y costos

- Las claves viven en Vercel Environment Variables, nunca en el repositorio.
- Rota cualquier clave que haya sido expuesta.
- El rate limit actual es en memoria: en serverless se aplica por instancia, no globalmente. Para producción con tráfico real, usa un almacén compartido (por ejemplo Upstash Redis) o un WAF.
- El proveedor de IA puede generar costos si usas claves de pago. Revisa cuotas y límites antes de abrir la app al público.
- Cloudinary puede cobrar según almacenamiento, ancho de banda y transformaciones.
- No se almacena la transcripción en el servidor; el último resultado queda en el navegador 48 horas.

## 10. Rollback

En Vercel, abre **Deployments**, elige el despliegue anterior estable y usa **Promote to Production**. En GitHub, revierte el commit con `git revert <hash>` y vuelve a desplegar.

## 11. Estado de esta entrega

El código fue publicado en GitHub (`origin/main`, commit `713a4b8`). El despliegue en Vercel requiere iniciar sesión en una cuenta con permisos; no se ejecutó desde este entorno porque no hay credenciales de Vercel. La verificación local y el build de producción sí se completaron.

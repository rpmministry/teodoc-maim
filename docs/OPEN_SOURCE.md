# Ruta de código abierto

Esta guía explica cómo configurar una pila de código abierto para TeoDoc MAIM. Distingue entre lo **ya implementado** y lo que **requiere una fase de desarrollo**.

## Resumen de decisiones

| Función | Estado actual | Alternativa abierta | Estado |
| --- | --- | --- | --- |
| Verificación bíblica | Implementada | GetBible V2 + Sagradas Escrituras 1569 | Funcionando |
| Transcripción | AssemblyAI/Deepgram | Whisper / faster-whisper / whisper.cpp | Requiere adaptador |
| Análisis con IA | Gemini/OpenRouter/DeepSeek | Ollama + modelo abierto / vLLM | Requiere adaptador |
| Persistencia | localStorage | PostgreSQL + Drizzle | Requiere migración |
| Autenticación | No implementada | Auth.js | Requiere implementación |
| Archivos de audio | Cloudinary | MinIO | Requiere adaptador |
| Despliegue | Vercel (no ejecutado) | Docker + Caddy + Coolify/Dokploy | Requiere despliegue |
| Analítica | No implementada | Umami | Opcional |
| Disponibilidad | No implementada | Uptime Kuma | Opcional |
| Rate limit global | Memoria | Valkey/Redis | Recomendado en producción |

## 1. Biblia abierta — ya implementado

La aplicación verifica las referencias con:

- **GetBible V2:** https://github.com/getbible/v2
- **Sagradas Escrituras (1569)**, dominio público, código `sse`.
- Consulta: `https://query.getbible.net/v2/sse/Santiago 2:17`

Configura:

```text
BIBLE_API_BASE=https://query.getbible.net/v2
BIBLE_TRANSLATION=sse
BIBLE_TRANSLATION_LICENSE=Dominio público
BIBLE_VERIFY=true
```

Prueba:

```powershell
node scripts/verificar-biblia.mts
```

Si quieres autoalojar la API:

```powershell
git clone https://github.com/getbible/v2.git
Set-Location v2
```

Sigue las instrucciones del repositorio para levantar la API y cambia:

```text
BIBLE_API_BASE=http://localhost:8000/v2
```

GetBible es GPL-3.0. Si lo modificas y distribuyes, debes respetar esa licencia. La traducción `sse` se distribuye como dominio público; no uses la etiqueta «dominio público» para Reina-Valera 1960 ni otras revisiones protegidas.

### Reina Valera Contemporánea (RVC)

RVC **no es código abierto**. Para usarla:

1. Obtén una clave de API.Bible: https://scripture.api.bible/
2. Confirma que tu cuenta tiene licencia para RVC.
3. Configura `BIBLE_PROVIDER=api-bible` y `BIBLE_API_KEY`.
4. Ejecuta `npm run biblia:buscar` y copia el ID de RVC.
5. Completa `BIBLE_TRANSLATION_ID`, `BIBLE_TRANSLATION_NAME` y `BIBLE_TRANSLATION_LICENSE`.

No extraigas RVC de YouVersion, Bible Gateway ni copias no autorizadas. La IA no reconstruye el texto: el servidor lo solicita al proveedor licenciado. Si no tienes licencia, usa GetBible con `sse` (dominio público).
## 2. Transcripción abierta con Whisper

Opciones:

- **OpenAI Whisper:** https://github.com/openai/whisper (MIT).
- **faster-whisper:** https://github.com/SYSTRAN/faster-whisper (MIT), más rápido en CPU/GPU.
- **whisper.cpp:** https://github.com/ggerganov/whisper.cpp (MIT), útil sin Python.

### Prueba local con Whisper

Requisitos: Python 3.10+, `ffmpeg` y suficiente RAM.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U openai-whisper
```

Transcribe un audio:

```powershell
whisper "C:\ruta\audio.mp3" --model medium --language es --task transcribe --output_format json --output_dir .\tmp\whisper
```

Modelos recomendados:

| Modelo | Uso | Recursos |
| --- | --- | --- |
| `small` | Pruebas rápidas | CPU |
| `medium` | Calidad equilibrada | CPU/GPU |
| `large-v3` | Mayor calidad en español | GPU recomendada |

### Integración con TeoDoc

El endpoint actual es `app/api/transcribe/route.ts`. Para usar Whisper:

1. Crea un servicio local (FastAPI, Node o CLI) que reciba el archivo y devuelva `{ text }`.
2. Añade `WHISPER_API_URL` al entorno.
3. Sustituye la cadena AssemblyAI/Deepgram por una llamada a `WHISPER_API_URL`.
4. Mantén el límite de 500 MB, el rate limit y el filtro de URL.
5. Procesa los audios largos por fragmentos y conserva marcas de tiempo si el modelo las devuelve.

No está implementado todavía. No declares que TeoDoc usa Whisper hasta completar el adaptador y probarlo.

## 3. Análisis con IA abierta

### Opción local con Ollama

- Ollama: https://github.com/ollama/ollama (MIT).
- Modelo sugerido: `qwen2.5:14b-instruct`, `llama3.1:8b-instruct` o `mistral-nemo`. Verifica disponibilidad y licencia del modelo.

```powershell
winget install Ollama.Ollama
ollama pull qwen2.5:14b-instruct
ollama run qwen2.5:14b-instruct
```

Ollama expone una API compatible con OpenAI en `http://localhost:11434/v1`.

Configura:

```text
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=qwen2.5:14b-instruct
```

### Opción de producción con vLLM

- vLLM: https://github.com/vllm-project/vllm (Apache-2.0).
- Requiere GPU y un servidor compatible con OpenAI.

El adaptador debe:

1. Enviar el prompt de sistema y la transcripción.
2. Pedir JSON válido.
3. Validar el esquema con `normalizarAnalisisGeneral`.
4. Mantener el fallback actual si el modelo local falla.

No está implementado todavía. La calidad teológica y el cumplimiento del esquema deben probarse con la misma batería de fixtures antes de reemplazar los proveedores actuales.

## 4. Persistencia y versiones con PostgreSQL

- PostgreSQL: https://www.postgresql.org/ (licencia PostgreSQL).
- Drizzle ORM: https://github.com/drizzle-team/drizzle-orm (Apache-2.0).
- Alternativa: Prisma (Apache-2.0).

### Levantar PostgreSQL con Docker

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_DB: teodoc
      POSTGRES_USER: teodoc
      POSTGRES_PASSWORD: cambia_esta_clave
    ports:
      - "5432:5432"
    volumes:
      - teodoc_db:/var/lib/postgresql/data
volumes:
  teodoc_db:
```

```powershell
docker compose up -d
```

Variable:

```text
DATABASE_URL=postgresql://teodoc:cambia_esta_clave@localhost:5432/teodoc
```

Tablas mínimas:

- `predicaciones`: metadatos, texto, estado, versión bíblica, timestamps.
- `analisis_central`: JSONB del análisis general, versión, incertidumbres.
- `documentos`: modalidad, JSONB específico, validación, versión del prompt, timestamps.
- `referencias`: cita, traducción, texto verificado, licencia, fuente, estado.
- `versiones_documento`: historial de cambios y regeneraciones.
- `usuarios` y `sesiones` si se añade autenticación.

La biblioteca actual en `localStorage` sirve como referencia funcional, pero no sustituye una base de datos multiusuario.

## 5. Autenticación con Auth.js

- Auth.js: https://github.com/nextauthjs/next-auth (ISC).

Pasos:

```powershell
npm install next-auth
```

Configura al menos un proveedor OAuth (GitHub, Google) o credenciales propias con hash Argon2. Añade:

```text
AUTH_SECRET=genera_un_secreto_largo
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

Reglas:

- Roles `admin`, `editor`, `lector`.
- Documentos y audios asociados a usuario/organización.
- Sesiones seguras y expiración.
- No expongas el `AUTH_SECRET` al cliente.

No está implementado.

## 6. Archivos con MinIO

- MinIO: https://github.com/minio/minio (AGPL-3.0).
- SDK S3: `@aws-sdk/client-s3` (Apache-2.0).

```yaml
services:
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: teodoc
      MINIO_ROOT_PASSWORD: cambia_esta_clave
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - teodoc_minio:/data
volumes:
  teodoc_minio:
```

Variables:

```text
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=teodoc-audio
S3_ACCESS_KEY=teodoc
S3_SECRET_KEY=cambia_esta_clave
```

Sustituye la carga directa a Cloudinary por URLs prefirmadas del backend. El bucket no debe ser público.

## 7. Despliegue abierto con Docker

Alternativas de PaaS autoalojado:

- Coolify: https://github.com/coollabsio/coolify
- Dokploy: https://github.com/Dokploy/dokploy
- Caddy: https://github.com/caddyserver/caddy
- Docker: https://docs.docker.com/

Flujo:

1. Genera el build de Next.js con `output: 'standalone'`.
2. Crea una imagen Docker.
3. Levanta PostgreSQL, MinIO, Whisper/Ollama y la app en una red privada.
4. Usa Caddy como proxy TLS.
5. Configura variables de entorno en el servidor.
6. Ejecuta migraciones y pruebas de humo.
7. Configura backups de PostgreSQL y MinIO.

Vercel sigue siendo una opción válida y más simple, pero no es código abierto. La guía de Vercel está en `docs/DESPLIEGUE.md`.

## 8. Observabilidad y operación

- Uptime Kuma: https://github.com/louislam/uptime-kuma (MIT).
- Umami: https://github.com/umami-software/umami (MIT).
- GlitchTip: https://gitlab.com/glitchtip/glitchtip (Sentry-compatible, código abierto).
- Valkey: https://github.com/valkey-io/valkey (BSD-3-Clause), para rate limit compartido.

Configura alertas de:

- caída de la app;
- errores 5xx;
- latencia de `/api/analyze`;
- fallos de verificación bíblica;
- espacio de disco y backups.

## 9. Orden recomendado de implementación

1. **Biblia abierta:** ya implementada; validar con una prédica real.
2. **Whisper local:** adaptar `/api/transcribe` y probar 3 audios.
3. **PostgreSQL + Drizzle:** migrar la biblioteca local y añadir versiones.
4. **Auth.js:** proteger documentos y audios.
5. **MinIO:** reemplazar Cloudinary.
6. **Ollama/vLLM:** opcional; comparar calidad y costos.
7. **Docker/Coolify + Caddy:** desplegar.
8. **Observabilidad:** Uptime Kuma, Umami, GlitchTip, backups.

## 10. Verificación después de cada fase

```powershell
npm run lint
npm run typecheck
npm run verificar
npm run build
```

Además:

- ejecutar una predicación real;
- comprobar referencias verificadas y pendientes;
- descargar PDF y Word;
- probar audio en Android, iPhone, tablet y Mac;
- revisar que no se publiquen claves ni audios privados.

Ninguna fase debe declararse terminada sin una prueba ejecutada y verificable.

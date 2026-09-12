# TeoDoc · Servicio de transcripción con yt-dlp (PRINCIPAL)

Servicio **open source** basado en [`yt-dlp`](https://github.com/yt-dlp/yt-dlp)
que obtiene los subtítulos de YouTube **sin descargar audio ni video**
(`--skip-download`). Está pensado como **proveedor principal** de TeoDoc, con
Supadata y la librería npm como auxiliares.

## Contrato

```
GET /?videoId=<ID>&lang=es
Auth opcional: Authorization: Bearer <TRANSCRIPT_SERVICE_TOKEN>
Respuesta: { "text": "...", "segments": [{ "text", "start", "duration" }], "lang": "es" }
Errores:  404 video no disponible | 422 sin subtítulos | 504 timeout
GET /health -> { "ok": true, "ytdlp": "2026.08.19" }
```

## Variables de entorno del servicio

| Variable | Descripción | Por defecto |
|---|---|---|
| `YTDLP_BIN` | Ruta del binario yt-dlp | `yt-dlp` |
| `YTDLP_TIMEOUT` | Segundos máximos por extracción | `150` |
| `YTDLP_EXTRA_ARGS` | Argumentos extra de yt-dlp | vacío |
| `YTDLP_PROXY` | Proxy (`http://user:pass@host:port`) si YouTube bloquea la IP | vacío |
| `YTDLP_COOKIES_BASE64` | `cookies.txt` en base64 (ayuda con videos restringidos) | vacío |
| `REQUIRE_AUTH` | `1`/`true` para exigir token (opt-in) | desactivado |
| `TRANSCRIPT_SERVICE_TOKEN` | Token Bearer (solo si `REQUIRE_AUTH`) | vacío |

## Ejecutar en local

```bash
cd services/youtube-ytdlp
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8010
```

Prueba:

```bash
curl "http://localhost:8010/?videoId=dQw4w9WgXcQ&lang=es"
```

## Despliegue en la nube (sin hardware propio)

No necesitas tener un computador encendido. Opciones gratuitas y open source:

- **Render (recomendado, 1 clic)**: este repo incluye `render.yaml` en la raíz.
  En https://dashboard.render.com → **New → Blueprint** → conecta el repo →
  Render crea el servicio Docker. Copia la URL y úsala como `TRANSCRIPT_SERVICE_URL`.
- **Hugging Face Spaces (gratis, sin tarjeta)**: sigue
  [`HUGGINGFACE.md`](./HUGGINGFACE.md).
- **Docker / Railway / Fly.io / VPS**: `docker build -t teodoc-ytdlp . && docker run -p 8000:8000 teodoc-ytdlp`.

> **Importante (IPs de datacenter):** YouTube bloquea la descarga de subtítulos
> desde IPs de nube (Render, Fly, HF, etc.) y el servicio responde
> `503 blocked-by-youtube`. Es un bloqueo por IP, no un fallo del código.
> Tres formas de que yt-dlp funcione en la nube:
> 1. **Cookies** (gratis): exporta `cookies.txt` de tu navegador logueado en
>    YouTube y ponlo en base64 en `YTDLP_COOKIES_BASE64`. Suele saltar el bloqueo.
> 2. **Proxy** (`YTDLP_PROXY`): con IP residencial.
> 3. **IP residencial** (VPS/tu PC vía túnel).
>
> Mientras no se configure nada de eso, TeoDoc cae automáticamente a Supadata y
> luego a la librería npm, así que el análisis **nunca se detiene**.

## Alternativa sin despliegue

Si no quieres desplegar nada, **Supadata ya es un servicio en la nube** (solo
requiere `SUPADATA_API_KEY`) y funciona como proveedor principal. El servicio
yt-dlp es para cuando quieras eliminar la dependencia de créditos de terceros.

## Conectar con TeoDoc (proveedor principal)

En Vercel y `.env.local`:

```
TRANSCRIPT_SERVICE_URL = https://tu-servicio-ytdlp.example.com
TRANSCRIPT_SERVICE_TOKEN = una_clave_larga_opcional
```

Orden resultante en TeoDoc:

1. **yt-dlp (este servicio)** — principal.
2. **Supadata** (si hay `SUPADATA_API_KEY`) — auxiliar; puede generar con IA si no hay subtítulos.
3. **Librería npm** `youtube-transcript` — último respaldo.

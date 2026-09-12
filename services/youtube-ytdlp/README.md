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
| `TRANSCRIPT_SERVICE_TOKEN` | Token Bearer opcional | vacío |

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

## Desplegar

- **Docker**: `docker build -t teodoc-ytdlp . && docker run -p 8000:8000 teodoc-ytdlp`
- **Railway / Render / Fly.io**: crea un servicio desde esta carpeta (Dockerfile incluido).
- **VPS / equipo propio**: recomendado, porque YouTube no bloquea IPs residenciales.

> yt-dlp es mucho más resistente que una simple obtención de subtítulos, pero si
> el host usa IP de datacenter YouTube puede limitar (HTTP 429). Si ocurre,
> TeoDoc cae automáticamente a Supadata y luego a la librería npm.

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

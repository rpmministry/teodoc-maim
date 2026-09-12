# TeoDoc · Servicio de transcripción de YouTube (open source)

Respaldo **gratuito e indefinido** para TeoDoc cuando Supadata agota sus créditos.
Usa la librería open source [`youtube-transcript-api`](https://github.com/jdepoix/youtube-transcript-api).
**No descarga audio ni video**: solo obtiene subtítulos manuales o automáticos.

## Contrato

```
GET /?videoId=<ID>&lang=es
Auth opcional: Authority: Bearer <TRANSCRIPT_SERVICE_TOKEN>
Respuesta: { "text": "...", "segments": [{ "text", "start", "duration" }], "lang": "es" }
GET /health  -> { "ok": true }
```

## Ejecutar en local

```bash
cd services/youtube-transcript-api
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Prueba:

```bash
curl "http://localhost:8000/?videoId=dQw4w9WgXcQ&lang=es"
```

## Desplegar (elige un host con IP limpia)

- **Docker / VPS**: `docker build -t teodoc-transcripts . && docker run -p 8000:8000 teodoc-transcripts`
- **Railway / Render / Fly.io**: crea un servicio desde esta carpeta (Dockerfile incluido).
- **Casa / Raspberry Pi / servidor propio**: ideal, porque YouTube no bloquea IPs residenciales.

> Nota: algunos proveedores cloud (IPs de datacenter) pueden ser bloqueados por
> YouTube igual que en Vercel. Si ocurre, aloja el servicio en una IP residencial
> o usa otra instancia.

## Conectar con TeoDoc

En las variables de entorno de TeoDoc (Vercel y `.env.local`):

```
TRANSCRIPT_SERVICE_URL = https://tu-servicio.example.com
TRANSCRIPT_SERVICE_TOKEN = una_clave_larga_opcional
```

Con eso, la cadena de transcripción queda:

1. **Servicio propio** (si hay `TRANSCRIPT_SERVICE_URL`) — recomendado usar el de **yt-dlp** (`services/youtube-ytdlp`) como principal.
2. **Supadata** (si hay `SUPADATA_API_KEY`) — auxiliar; genera con IA si no hay subtítulos.
3. **Librería npm** `youtube-transcript` (último respaldo local).

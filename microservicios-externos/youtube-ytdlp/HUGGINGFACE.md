# Despliegue gratis en Hugging Face Spaces (sin hardware propio)

Hugging Face Spaces permite ejecutar este servicio Docker **gratis y en la
nube**, sin tarjeta ni servidor propio. Pasos:

1. Crea una cuenta en https://huggingface.co
2. Entra a https://huggingface.co/new-space
3. Configura:
   - **Space name**: `teodoc-transcripts`
   - **SDK**: `Docker`
   - **Docker template**: `Blank`
   - **Hardware**: `CPU basic (free)`
   - Visibilidad: `Public` o `Private`
4. En la pestaña **Files**, sube estos 2 archivos de esta carpeta:
   - `app.py`
   - `requirements.txt`
   - `Dockerfile`
5. Crea/edita el `README.md` del Space y pega **exactamente** este inicio
   (el frontmatter es obligatorio para que HF sepa que es Docker en el puerto 8000):

```markdown
---
title: TeoDoc yt-dlp Transcripts
emoji: 🎙️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 8000
pinned: false
---

# TeoDoc yt-dlp Transcripts
Servicio open source de transcripción (solo subtítulos, sin descargar video).
```

6. El Space se construye y queda con una URL como:
   `https://<usuario>-teodoc-transcripts.hf.space`
7. Verifica: `https://<usuario>-teodoc-transcripts.hf.space/health`
8. En Vercel (TeoDoc), agrega:
   ```
   TRANSCRIPT_SERVICE_URL = https://<usuario>-teodoc-transcripts.hf.space
   ```

## Notas

- El plan gratuito "duerme" tras un tiempo de inactividad; la primera petición
  puede tardar ~30-60 s, luego va normal.
- Si YouTube limita la IP del Space (HTTP 429), configura `YTDLP_PROXY` o
  `YTDLP_COOKIES_BASE64` en **Settings → Variables and secrets**.
- TeoDoc cae automáticamente a Supadata y a la librería npm si este servicio falla.

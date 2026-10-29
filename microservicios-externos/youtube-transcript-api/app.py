"""Servicio de transcripción de YouTube para TeoDoc (open source).

Usa `youtube-transcript-api` (https://github.com/jdepoix/youtube-transcript-api)
para obtener subtítulos manuales o automáticos. NO descarga audio ni video.

TeoDoc lo consume a través de TRANSCRIPT_SERVICE_URL. Al ser propio, no depende
de créditos de terceros: puede usarse indefinidamente.

Contrato:
  GET /?videoId=ID&lang=es   ->  {"text": "...", "segments": [...], "lang": "es"}
  Auth opcional: cabecera  Authorization: Bearer <TRANSCRIPT_SERVICE_TOKEN>
"""

import os

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except Exception:  # pragma: no cover
    YouTubeTranscriptApi = None

app = FastAPI(title="TeoDoc YouTube Transcript Service", version="1.0.0")

LANG_PREFERENCE = ["es", "es-419", "es-ES", "es-MX", "es-US", "en"]
TOKEN = os.environ.get("TRANSCRIPT_SERVICE_TOKEN")


def _snippets(result):
    """Normaliza la salida entre versiones de youtube-transcript-api."""
    data = getattr(result, "snippets", None)  # v1.x
    if data is not None:
        segments = [
            {"text": s.text, "start": float(s.start), "duration": float(s.duration)}
            for s in data
        ]
        return segments, getattr(result, "language_code", None)
    # v0.x: lista de dicts
    segments = [
        {
            "text": d.get("text", ""),
            "start": float(d.get("start", 0)),
            "duration": float(d.get("duration", 0)),
        }
        for d in result
    ]
    return segments, None


def _fetch(video_id, langs):
    if YouTubeTranscriptApi is None:
        raise RuntimeError("youtube-transcript-api no está instalado")
    # v1.x
    try:
        api = YouTubeTranscriptApi()
        fetch = getattr(api, "fetch", None)
        if fetch is not None:
            return fetch(video_id, languages=langs)
    except Exception:
        pass
    # v0.x
    return YouTubeTranscriptApi.get_transcript(video_id, languages=langs)


@app.get("/")
def transcript(request: Request, videoId: str = Query(...), lang: str = Query("es")):
    if TOKEN:
        if request.headers.get("authorization", "") != f"Bearer {TOKEN}":
            raise HTTPException(status_code=401, detail="unauthorized")

    langs = [lang] + [code for code in LANG_PREFERENCE if code != lang]
    try:
        result = _fetch(videoId, langs)
        segments, language = _snippets(result)
    except Exception as error:  # noqa: BLE001
        message = str(error)
        lowered = message.lower()
        if "disabled" in lowered or "no transcript" in lowered or "not available" in lowered:
            raise HTTPException(status_code=422, detail="transcript-unavailable")
        raise HTTPException(status_code=502, detail=message)

    text = " ".join(segment["text"] for segment in segments).strip()
    if not text:
        raise HTTPException(status_code=422, detail="transcript-unavailable")
    return JSONResponse({"text": text, "segments": segments, "lang": language or lang})


@app.get("/health")
def health():
    return {"ok": True, "library": YouTubeTranscriptApi is not None}

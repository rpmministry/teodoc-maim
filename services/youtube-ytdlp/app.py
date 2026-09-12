"""Servicio de transcripción de YouTube para TeoDoc basado en yt-dlp (principal).

Usa `yt-dlp` (https://github.com/yt-dlp/yt-dlp) SOLO para obtener los subtítulos
del video (--skip-download): NO descarga audio ni video.

Contrato:
  GET /?videoId=ID&lang=es  ->  {"text": "...", "segments": [...], "lang": "es"}
  Auth: solo si REQUIRE_AUTH=1 -> cabecera Authorization: Bearer <TRANSCRIPT_SERVICE_TOKEN>
  Errores: 404 video no disponible | 422 sin subtítulos | 503 bloqueado por YouTube | 504 timeout
"""

import base64
import glob
import json
import os
import re
import subprocess
import tempfile

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="TeoDoc yt-dlp Transcript Service", version="1.1.0")

# La autenticación es OPT-IN: solo se exige si REQUIRE_AUTH=1 y hay token.
REQUIRE_AUTH = os.environ.get("REQUIRE_AUTH", "").lower() in ("1", "true", "yes", "on")
TOKEN = os.environ.get("TRANSCRIPT_SERVICE_TOKEN")
YTDLP = os.environ.get("YTDLP_BIN", "yt-dlp")
TIMEOUT = int(os.environ.get("YTDLP_TIMEOUT", "150"))
EXTRA_ARGS = [a for a in os.environ.get("YTDLP_EXTRA_ARGS", "").split() if a]
# Opcionales para entornos cloud con IP bloqueada por YouTube.
PROXY = os.environ.get("YTDLP_PROXY", "")
COOKIES_B64 = os.environ.get("YTDLP_COOKIES_BASE64", "")

LANG_ORDER = ["es", "es-419", "es-ES", "es-MX", "es-US", "en"]
VTT_TS = re.compile(
    r"(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})"
)
FILE_LANG = re.compile(r"\.([a-zA-Z0-9-]+)\.(json3|vtt|srt)$")

# Si YouTube bloquea un cliente, se reintenta con otros (útil en IPs cloud).
CLIENT_ATTEMPTS = [None, "android,web_safari", "ios", "tv_embedded,web_embedded", "mweb"]
BLOCK_HINTS = (
    "sign in to confirm",
    "not a bot",
    "429",
    "too many requests",
    "unable to download video subtitles",
    "po token",
    "failed to extract any player response",
    "no video formats",
    "requested format is not available",
)
UNAVAILABLE_HINTS = ("private", "unavailable", "does not exist", "removed")


def _seconds(h, m, s, ms):
    return int(h) * 3600 + int(m) * 60 + int(s) + int(str(ms).ljust(3, "0")) / 1000


def _decode(text):
    for a, b in (("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'), ("&#39;", "'"), ("&nbsp;", " ")):
        text = text.replace(a, b)
    return text


def parse_json3(raw):
    data = json.loads(raw)
    out = []
    for event in data.get("events", []):
        text = "".join(seg.get("utf8", "") for seg in (event.get("segs") or []))
        text = text.replace("\n", " ").strip()
        if not text:
            continue
        out.append({
            "text": text,
            "start": (event.get("tStartMs") or 0) / 1000,
            "duration": (event.get("dDurationMs") or 0) / 1000,
        })
    return out


def parse_vtt(raw):
    out = []
    for block in re.split(r"\n{2,}", raw.replace("\r", "")):
        lines = [line.strip() for line in block.split("\n") if line.strip()]
        index = next((i for i, line in enumerate(lines) if VTT_TS.search(line)), None)
        if index is None:
            continue
        match = VTT_TS.search(lines[index])
        start = _seconds(*match.groups()[:4])
        end = _seconds(*match.groups()[4:])
        text = _decode(re.sub(r"<[^>]+>", "", " ".join(lines[index + 1:]))).strip()
        if text:
            out.append({"text": text, "start": start, "duration": max(0, end - start)})
    return out


def parse_subtitle(path):
    with open(path, encoding="utf-8", errors="ignore") as handle:
        raw = handle.read()
    if path.lower().endswith(".json3"):
        return parse_json3(raw)
    return parse_vtt(raw)


def lang_rank(code):
    if code in LANG_ORDER:
        return LANG_ORDER.index(code)
    base = (code or "").split("-")[0]
    return LANG_ORDER.index(base) if base in LANG_ORDER else len(LANG_ORDER)


def subtitle_languages(preferred):
    ordered = [preferred] + [code for code in LANG_ORDER if code != preferred]
    tokens = []
    for code in ordered:
        for token in (f"{code}.*", code):
            if token not in tokens:
                tokens.append(token)
    return ",".join(tokens)


def _attempt(workdir, video_id, lang, client):
    attempt_dir = os.path.join(workdir, f"try_{client or 'default'}")
    os.makedirs(attempt_dir, exist_ok=True)
    extra = list(EXTRA_ARGS)
    if PROXY:
        extra += ["--proxy", PROXY]
    if COOKIES_B64:
        cookies_path = os.path.join(attempt_dir, "cookies.txt")
        with open(cookies_path, "wb") as handle:
            handle.write(base64.b64decode(COOKIES_B64))
        extra += ["--cookies", cookies_path]
    if client:
        extra += ["--extractor-args", f"youtube:player_client={client}"]

    command = [
        YTDLP,
        "--skip-download",
        "--no-playlist",
        "--write-subs",
        "--write-auto-subs",
        "--sub-langs", subtitle_languages(lang),
        "--sub-format", "json3/vtt/srt/best",
        "--no-warnings",
        "-o", os.path.join(attempt_dir, "%(id)s.%(ext)s"),
        f"https://www.youtube.com/watch?v={video_id}",
        *extra,
    ]
    try:
        proc = subprocess.run(command, capture_output=True, text=True, timeout=TIMEOUT)
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="timeout")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="yt-dlp no está instalado")

    files = [f for f in glob.glob(os.path.join(attempt_dir, "*")) if os.path.isfile(f)]
    return files, (proc.stderr or "")


@app.get("/")
def transcript(request: Request, videoId: str = Query(...), lang: str = Query("es")):
    if REQUIRE_AUTH and TOKEN and request.headers.get("authorization", "") != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")

    files = []
    last_stderr = ""
    with tempfile.TemporaryDirectory() as workdir:
        for client in CLIENT_ATTEMPTS:
            files, last_stderr = _attempt(workdir, videoId, lang, client)
            if files:
                break
            lowered = last_stderr.lower()
            if any(word in lowered for word in UNAVAILABLE_HINTS):
                raise HTTPException(status_code=404, detail="video-unavailable")
            # Solo reintenta con otro cliente si parece un bloqueo.
            if not any(hint in lowered for hint in BLOCK_HINTS):
                break

        if not files:
            lowered = last_stderr.lower()
            if any(hint in lowered for hint in BLOCK_HINTS):
                raise HTTPException(status_code=503, detail="blocked-by-youtube")
            raise HTTPException(status_code=422, detail="no-subtitles")

        def rank(path):
            match = FILE_LANG.search(os.path.basename(path))
            code = match.group(1) if match else "zz"
            return (lang_rank(code), code)

        best = sorted(files, key=rank)[0]
        segments = parse_subtitle(best)
        match = FILE_LANG.search(os.path.basename(best))
        detected = match.group(1) if match else lang

    if not segments:
        raise HTTPException(status_code=422, detail="no-subtitles")

    text = " ".join(segment["text"] for segment in segments).strip()
    return JSONResponse({"text": text, "segments": segments, "lang": detected})


@app.get("/health")
def health():
    try:
        version = subprocess.run([YTDLP, "--version"], capture_output=True, text=True, timeout=20).stdout.strip()
    except Exception:  # noqa: BLE001
        version = ""
    return {"ok": bool(version), "ytdlp": version}

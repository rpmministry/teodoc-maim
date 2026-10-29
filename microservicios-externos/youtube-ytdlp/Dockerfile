FROM python:3.12-slim

# yt-dlp no necesita ffmpeg para subtítulos (json3/vtt/srt). Se instala por pip.
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]

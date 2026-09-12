// Punto de resolución del proveedor de transcripciones. La app depende de la
// interfaz TranscriptProvider, no de una implementación concreta.
//
// Orden:
//   1. yt-dlp (servicio open source propio, TRANSCRIPT_SERVICE_URL): PRINCIPAL.
//   2. Supadata (SUPADATA_API_KEY): auxiliar, puede generar con IA sin subtítulos.
//   3. Librería `youtube-transcript`: último respaldo (gratuito, sin clave).
import { FallbackTranscriptProvider, type TranscriptProvider } from './transcript-provider';
import { youtubeTranscriptProvider } from './youtube-transcript-provider';
import { supadataTranscriptProvider } from './supadata-transcript-provider';
import { remoteTranscriptProvider } from './remote-transcript-provider';

let cached: TranscriptProvider | null = null;

export function resolveTranscriptProvider(): TranscriptProvider {
  if (cached) return cached;

  const providers: TranscriptProvider[] = [];
  // 1. yt-dlp / servicio open source auto-hospedado (PRINCIPAL cuando está configurado).
  if (process.env.TRANSCRIPT_SERVICE_URL) providers.push(remoteTranscriptProvider);
  // 2. Supadata (auxiliar): sin bloqueos de IP y puede generar con IA si no hay subtítulos.
  if (process.env.SUPADATA_API_KEY) providers.push(supadataTranscriptProvider);
  // 3. Librería npm gratuita (último respaldo local).
  providers.push(youtubeTranscriptProvider);

  cached = providers.length === 1 ? providers[0] : new FallbackTranscriptProvider(providers);
  return cached;
}

export { extractYouTubeVideoId, isYouTubeUrl } from './extract-video-id';
export { TranscriptError, type TranscriptResult, type TranscriptErrorCode } from './transcript-provider';

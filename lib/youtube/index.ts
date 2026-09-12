// Punto de resolución del proveedor de transcripciones. La app depende de la
// interfaz TranscriptProvider, no de una implementación concreta.
//
// Orden:
//   1. Supadata (si SUPADATA_API_KEY está configurada). Corre desde su
//      infraestructura (sin bloqueos de IP cloud) y con `mode=auto` genera la
//      transcripción con IA si el video no tiene subtítulos.
//   2. Librería `youtube-transcript` (gratuita, sin clave) como respaldo.
import { FallbackTranscriptProvider, type TranscriptProvider } from './transcript-provider';
import { youtubeTranscriptProvider } from './youtube-transcript-provider';
import { supadataTranscriptProvider } from './supadata-transcript-provider';
import { remoteTranscriptProvider } from './remote-transcript-provider';

let cached: TranscriptProvider | null = null;

export function resolveTranscriptProvider(): TranscriptProvider {
  if (cached) return cached;

  const providers: TranscriptProvider[] = [];
  // 1. Supadata (si hay clave): sin bloqueos de IP y con generación por IA.
  if (process.env.SUPADATA_API_KEY) providers.push(supadataTranscriptProvider);
  // 2. Servicio open source auto-hospedado (indefinido, sin créditos de terceros).
  if (process.env.TRANSCRIPT_SERVICE_URL) providers.push(remoteTranscriptProvider);
  // 3. Librería npm gratuita (respaldo local).
  providers.push(youtubeTranscriptProvider);

  cached = providers.length === 1 ? providers[0] : new FallbackTranscriptProvider(providers);
  return cached;
}

export { extractYouTubeVideoId, isYouTubeUrl } from './extract-video-id';
export { TranscriptError, type TranscriptResult, type TranscriptErrorCode } from './transcript-provider';

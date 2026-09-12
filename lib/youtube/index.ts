// Punto de resolución del proveedor de transcripciones. La app depende de la
// interfaz TranscriptProvider, no de una implementación concreta.
//
// Orden de proveedores configurable con TRANSCRIPT_PROVIDER_ORDER, por ejemplo:
//   "remote,supadata,library"  -> yt-dlp primero (servicio propio con IP limpia/cookies)
//   "supadata,remote,library"  -> Supadata primero (por defecto: rápido y confiable)
// El proveedor "library" siempre se añade al final como último respaldo.
import { FallbackTranscriptProvider, type TranscriptProvider } from './transcript-provider';
import { youtubeTranscriptProvider } from './youtube-transcript-provider';
import { supadataTranscriptProvider } from './supadata-transcript-provider';
import { remoteTranscriptProvider } from './remote-transcript-provider';

const DEFAULT_ORDER = ['supadata', 'remote', 'library'];

let cached: TranscriptProvider | null = null;

export function resolveTranscriptProvider(): TranscriptProvider {
  if (cached) return cached;

  const factory: Record<string, () => TranscriptProvider | null> = {
    supadata: () => (process.env.SUPADATA_API_KEY ? supadataTranscriptProvider : null),
    remote: () => (process.env.TRANSCRIPT_SERVICE_URL ? remoteTranscriptProvider : null),
    library: () => youtubeTranscriptProvider,
  };

  const order = (process.env.TRANSCRIPT_PROVIDER_ORDER || DEFAULT_ORDER.join(','))
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  const providers: TranscriptProvider[] = [];
  for (const name of order) {
    const provider = factory[name]?.();
    if (provider && !providers.includes(provider)) providers.push(provider);
  }
  // La librería npm siempre queda como último respaldo.
  if (!providers.includes(youtubeTranscriptProvider)) providers.push(youtubeTranscriptProvider);

  cached = providers.length === 1 ? providers[0] : new FallbackTranscriptProvider(providers);
  return cached;
}

export { extractYouTubeVideoId, isYouTubeUrl } from './extract-video-id';
export { TranscriptError, type TranscriptResult, type TranscriptErrorCode } from './transcript-provider';

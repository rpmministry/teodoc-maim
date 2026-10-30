// Punto de resolución del proveedor de transcripciones. La app depende de la
// interfaz TranscriptProvider, no de una implementación concreta.
//
// Orden de proveedores configurable con TRANSCRIPT_PROVIDER_ORDER:
//   "innertube,library,supadata,remote"
// Por defecto: innertube nativo primero (ultrarrápido, extrae subtítulos y metadatos oficiales en ~1.5s sin bloqueos),
// seguido de la librería npm, Supadata y el servicio remoto.
import { FallbackTranscriptProvider, type TranscriptProvider } from './transcript-provider';
import { innertubeTranscriptProvider } from './innertube-transcript-provider';
import { youtubeTranscriptProvider } from './youtube-transcript-provider';
import { supadataTranscriptProvider } from './supadata-transcript-provider';
import { remoteTranscriptProvider } from './remote-transcript-provider';

const DEFAULT_ORDER = ['innertube', 'library', 'supadata', 'remote'];

let cached: TranscriptProvider | null = null;

export function resolveTranscriptProvider(): TranscriptProvider {
  if (cached) return cached;

  const factory: Record<string, () => TranscriptProvider | null> = {
    innertube: () => innertubeTranscriptProvider,
    library: () => youtubeTranscriptProvider,
    supadata: () => (process.env.SUPADATA_API_KEY ? supadataTranscriptProvider : null),
    remote: () => (process.env.TRANSCRIPT_SERVICE_URL ? remoteTranscriptProvider : null),
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

  // Garantizar que innertube y library siempre estén presentes como respaldos confiables
  if (!providers.includes(innertubeTranscriptProvider)) providers.unshift(innertubeTranscriptProvider);
  if (!providers.includes(youtubeTranscriptProvider)) providers.push(youtubeTranscriptProvider);

  cached = providers.length === 1 ? providers[0] : new FallbackTranscriptProvider(providers);
  return cached;
}

export { extractYouTubeVideoId, isYouTubeUrl } from './extract-video-id';
export { TranscriptError, type TranscriptResult, type TranscriptErrorCode } from './transcript-provider';

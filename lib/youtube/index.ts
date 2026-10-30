// Punto de resolución del proveedor de transcripciones. La app depende de la
// interfaz TranscriptProvider, no de una implementación concreta.
//
// Orden de proveedores configurable con TRANSCRIPT_PROVIDER_ORDER:
//   "innertube,library,audio,supadata,remote"
// Por defecto: innertube nativo primero (ultrarrápido, extrae subtítulos y metadatos oficiales en ~1.5s sin bloqueos),
// seguido de la librería npm, extracción directa de audio + IA (Deepgram Nova-2/AssemblyAI), Supadata y servicio remoto.
import { FallbackTranscriptProvider, type TranscriptProvider } from './transcript-provider.ts';
import { innertubeTranscriptProvider } from './innertube-transcript-provider.ts';
import { youtubeTranscriptProvider } from './youtube-transcript-provider.ts';
import { youtubeAudioTranscriptProvider } from './audio-transcript-provider.ts';
import { supadataTranscriptProvider } from './supadata-transcript-provider.ts';
import { remoteTranscriptProvider } from './remote-transcript-provider.ts';

const DEFAULT_ORDER = ['innertube', 'library', 'audio', 'supadata', 'remote'];

let cached: TranscriptProvider | null = null;

export function resolveTranscriptProvider(): TranscriptProvider {
  if (cached) return cached;

  const factory: Record<string, () => TranscriptProvider | null> = {
    innertube: () => innertubeTranscriptProvider,
    library: () => youtubeTranscriptProvider,
    audio: () => youtubeAudioTranscriptProvider,
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

  // Garantizar que innertube siempre esté primero para subtítulos instantáneos
  if (!providers.includes(innertubeTranscriptProvider)) providers.unshift(innertubeTranscriptProvider);
  // Garantizar que la extracción y transcripción de audio esté presente como respaldo definitivo
  if (!providers.includes(youtubeAudioTranscriptProvider)) providers.push(youtubeAudioTranscriptProvider);

  cached = providers.length === 1 ? providers[0] : new FallbackTranscriptProvider(providers);
  return cached;
}

export { extractYouTubeVideoId, isYouTubeUrl } from './extract-video-id.ts';
export { youtubeAudioTranscriptProvider } from './audio-transcript-provider.ts';
export { innertubeTranscriptProvider } from './innertube-transcript-provider.ts';
export { youtubeTranscriptProvider } from './youtube-transcript-provider.ts';
export { TranscriptError, type TranscriptResult, type TranscriptErrorCode } from './transcript-provider.ts';

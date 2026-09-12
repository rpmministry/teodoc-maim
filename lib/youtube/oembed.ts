// Metadatos públicos del video (título/autor) vía oEmbed. Best-effort: si falla,
// se continúa sin ellos (no se inventan datos).
export type YouTubeOembed = { title?: string; author?: string };

export async function fetchYouTubeOembed(videoId: string): Promise<YouTubeOembed> {
  try {
    const anyAbort = AbortSignal as unknown as { timeout?: (n: number) => AbortSignal };
    const signal = typeof anyAbort?.timeout === 'function' ? anyAbort.timeout(4000) : undefined;
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal, cache: 'no-store' },
    );
    if (!res.ok) return {};
    const data = await res.json();
    return { title: data?.title, author: data?.author_name };
  } catch {
    return {};
  }
}

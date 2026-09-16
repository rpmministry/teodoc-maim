/** @type {import('next').NextConfig} */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://res.cloudinary.com https://i.ytimg.com;
  media-src 'self' blob: data: https://res.cloudinary.com;
  connect-src 'self' https://generativelanguage.googleapis.com https://openrouter.ai https://api.deepseek.com https://api.assemblyai.com https://api.deepgram.com https://api.cloudinary.com https://res.cloudinary.com https://www.youtube.com https://*.googlevideo.com;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

const nextConfig = {
  // 1. Blindaje de código fuente: deshabilitar source maps de navegador en producción
  productionBrowserSourceMaps: false,

  // 2. Ocultar huella de Next.js para mitigar escaneo automatizado de vulnerabilidades
  poweredByHeader: false,

  // 3. Limpieza de logs internos del bundle de cliente en producción
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // 4. Cabeceras HTTP de seguridad perimetral para todos los entornos
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;


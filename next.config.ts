/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Desactiva la optimización experimental pesada para evitar bloqueos en Vercel
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;
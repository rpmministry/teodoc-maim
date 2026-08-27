/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignora advertencias de código durante el despliegue
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora errores de tipos durante el despliegue
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
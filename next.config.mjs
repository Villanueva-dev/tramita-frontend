/** @type {import('next').NextConfig} */
const backendOrigin = process.env.BACKEND_ORIGIN ?? 'http://localhost:8080'

const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Proxy same-origin: el navegador ve todo como :3000, así la cookie de sesión
  // SameSite=Strict fluye sin CORS. Ver docs/integracion-auth.md.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ]
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // El proxy same-origin de /api/* al backend vive en proxy.ts (necesita stripear
  // el header Origin, que un rewrite de config no puede modificar).
}

export default nextConfig

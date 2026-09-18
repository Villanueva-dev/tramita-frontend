/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Permite abrir el dev server desde otro dispositivo de la red local (por
  // ejemplo, un teléfono para probar la captura de firma).
  //
  // Desde Next 15.2 el dev server bloquea los recursos internos (/_next/*, el
  // WebSocket de HMR) cuando el Origin no es localhost. El efecto es engañoso:
  // el HTML se sirve por SSR y la página SE VE completa, pero nunca hidrata, así
  // que el canvas de firma queda inerte y no dibuja nada.
  //
  // Va el hostname con el que el cliente llega a este servidor -- la IP de esta
  // máquina, no la del teléfono. Ajustar si cambia. Solo afecta a desarrollo.
  allowedDevOrigins: ['192.168.40.41'],
}

export default nextConfig

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Configuración de Vitest según la guía oficial de Next.js
// (https://nextjs.org/docs/app/guides/testing/vitest).
//
// Hasta ahora la suite corría sin config propia: solo había pruebas de lógica
// pura en lib/, que no necesitan DOM ni compilar JSX. Testear componentes exige
// las piezas de abajo.
//
// - react(): compila JSX en los archivos de prueba.
// - environment: 'jsdom': da un DOM simulado para que React pueda montar.
// - resolve.tsconfigPaths: resuelve el alias `@/*` del tsconfig. Sin esto,
//   cualquier import de la forma `@/components/...` falla al correr los tests.
//
// Nota: la guía oficial indica instalar el plugin `vite-tsconfig-paths` para
// eso último, pero la versión de Vite que trae Vitest 4 lo resuelve de forma
// nativa y avisa por consola que el plugin sobra. Se usa la opción nativa para
// no sumar una dependencia extra al repositorio.
//
// Advertencia de la guía oficial: Vitest NO soporta Server Components async.
// Los componentes de este proyecto son de cliente, pero si en el futuro se
// agrega uno async, se prueba con E2E, no acá.
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
  },
})

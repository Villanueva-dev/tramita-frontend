# Trámita — frontend

Frontend del proyecto de grado **Trámita**: un cockpit interno para que la Coordinación Académica de la Universidad Remington, sede Cali, gestione solicitudes de **adición de créditos** y **novedad de notas**. También contiene la captura pública del formato DO-FR-100 de créditos adicionales.

El backend hermano implementa el motor de workflow configurable; este cliente no debe fijar trámites, estados ni transiciones como constantes de negocio. Para el contexto institucional y los límites del sistema, consulte [Contexto institucional](docs/contexto-institucional.md).

## Inicio rápido local

**Requisitos verificados:** el repositorio usa `pnpm@11.26.0`, pero no fija Node.js en `package.json`, `.nvmrc` ni `.node-version`. Next.js 16.3.5 declara `>=20.9.0`; sin embargo, el `jsdom@30.0.1` bloqueado por el proyecto exige `^22.22.2 || ^24.15.0 || >=26.0.0`. Para esta instalación, use Node 22.22.2 o posterior dentro de la rama 22; el entorno verificado usa `v22.23.1`.

```bash
pnpm install
pnpm dev
```

El servidor de desarrollo de Next queda en `http://localhost:3000`. Para probar las rutas que llaman al backend, este debe estar disponible en `http://localhost:8080` por defecto.

| Comando | Propósito |
|---|---|
| `pnpm dev` | Ejecuta Next.js en desarrollo. |
| `pnpm test` | Ejecuta la suite de Vitest. |
| `pnpm exec tsc --noEmit` | Comprueba TypeScript sin emitir archivos. |
| `pnpm build` | Genera el build de producción. |
| `pnpm start` | Sirve un build ya generado. |
| `pnpm lint` | Ejecuta `eslint .`. |

## Configuración e integración

El frontend no incluye un archivo `.env.example`. La variable conocida es `BACKEND_ORIGIN`, leída por [`proxy.ts`](proxy.ts): si no se define, apunta a `http://localhost:8080`.

```bash
BACKEND_ORIGIN=http://localhost:8080 pnpm dev
```

Las llamadas del navegador van a `/api/*`; el proxy de Next las reescribe hacia el backend y conserva el encabezado `Origin`. El backend debe permitir el origen del frontend, por ejemplo `APP_CORS_ALLOWED_ORIGINS=http://localhost:3000` en desarrollo. Consulte la [guía de integración de autenticación](docs/integracion-auth.md) antes de cambiar esta topología.

La sesión usa una cookie HttpOnly y CSRF double-submit. [`lib/api.ts`](lib/api.ts) envía credenciales y, en mutaciones, el token `X-XSRF-TOKEN`; [`lib/auth-store.tsx`](lib/auth-store.tsx) rehidrata la sesión con `GET /api/auth/me`. No sustituya ese flujo por una bandera local de autenticación.

## Mapa de navegación y código

| Área | Ubicación | Responsabilidad |
|---|---|---|
| Rutas | [`app/`](app) | App Router de Next.js. |
| Formulario público | [`app/solicitud/creditos-adicionales/page.tsx`](app/solicitud/creditos-adicionales/page.tsx) | Captura DO-FR-100 sin autenticación. |
| Cockpit interno | [`components/app-shell.tsx`](components/app-shell.tsx) | Navegación protegida hacia bandeja, nueva solicitud y asistente. |
| UI compartida | [`components/`](components) | Componentes de presentación y primitivas. |
| Dominio y acceso a datos | [`lib/`](lib) | Cliente API, sesión, tipos y hooks. |
| Proxy API | [`proxy.ts`](proxy.ts) | Reescritura same-origin de `/api/*` al backend. |
| Pruebas | `**/*.test.ts` y `**/*.test.tsx` | Vitest + Testing Library en jsdom. |

La ruta pública no requiere `AppShell`. El cockpit sí: `AppShell` redirige al inicio cuando la sesión no está autenticada.

## Estado y contribución

- Siga la estructura idiomática `app/`, `components/` y `lib/`; la validación del cliente es UX, la autoridad es el contrato y el backend.
- La fuente canónica de endpoints y reglas del workflow es el OpenAPI y su implementación en el backend hermano; [la guía de auth](docs/integracion-auth.md) es narrativa.
- El último cambio OpenSpec, [`formulario-publico-por-pasos`](openspec/changes/archive/2026-09-26-formulario-publico-por-pasos/tasks.md), quedó archivado el 2026-09-26 con sus siete PRs en `main`; no hay cambio activo. El estado vigente de cada trabajo está en su registro de tareas: el trabajo de una rama no equivale a que esté incorporado a `main` ni a una entrega o release.
- Antes de desplegar una captura pública en una topología cross-origin, complete el [checklist de despliegue](docs/deployment-checklist.md). No asuma un despliegue de producción ni envíos automáticos de correo.

## Documentación de referencia

- [Contexto institucional y de dominio](docs/contexto-institucional.md)
- [Constitución y convenciones](docs/constitucion.md)
- [Integración de autenticación](docs/integracion-auth.md)
- [Contexto técnico OpenSpec](openspec/project.md)
- [Configuración OpenSpec y capacidades de prueba](openspec/config.yaml)
- [Especificación del formulario DO-FR-100](openspec/specs/do-fr-100-form/spec.md)

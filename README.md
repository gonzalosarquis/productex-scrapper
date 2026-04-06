# Productex Scrapper

Aplicación **Next.js 15** para descubrir marcas de ropa en Instagram, evaluar su potencial como clientes wholesale para Productex y gestionar el pipeline (búsquedas Apify, marcas, exportación y analytics).

## Setup en 5 pasos

1. **Clonar** el repositorio y entrar al directorio del proyecto.
2. **Instalar dependencias:** `npm install`
3. **Variables de entorno:** copiar `.env.example` a `.env.local` y rellenar los valores (ver tabla abajo).
4. **Base de datos:** en el panel de Supabase, ejecutar el SQL de `supabase/migrations/001_initial_schema.sql` (SQL Editor o CLI).
5. **Desarrollo:** `npm run dev` y abrir [http://localhost:3000](http://localhost:3000).

## Variables de entorno requeridas

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública) de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo servidor; webhooks y tareas internas) |
| `APIFY_API_KEY` | Token de Apify para ejecutar el actor de scraping (opcional en local si no inicias búsquedas) |

No commitees `.env` ni `.env.local`; están en `.gitignore`.

## Deploy en Vercel

1. Crea un proyecto en [Vercel](https://vercel.com) importando este repo.
2. En **Settings → Environment Variables**, añade las mismas variables que en `.env.local` (incluidas `NEXT_PUBLIC_*` y `SUPABASE_SERVICE_ROLE_KEY` si usas webhooks).
3. Usa **Node 20+** (Vercel lo detecta por defecto).
4. **Build command:** `npm run build` · **Output:** estándar de Next.js.
5. Tras el deploy, configura en Apify la URL del webhook: `https://<tu-dominio>/api/webhooks/apify` si usas finalización por evento.

El middleware protege `/dashboard` y las rutas `/api/*` (excepto webhooks); las sesiones usan Supabase Auth con cookies y `Authorization: Bearer` en las llamadas API desde el cliente.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servir build
- `npm run lint` — ESLint

## Nota sobre middleware

Next.js solo carga `middleware.ts` en la **raíz del proyecto** (o `src/middleware.ts`). No existe `app/middleware.ts` en el App Router.

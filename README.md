# Q26 - La Quiniela

Aplicacion web para pronosticos del Mundial 2026 con ligas privadas, ranking de jugadores y panel de administracion.

Stack principal:

- Next.js (App Router)
- Supabase (Auth + Postgres)
- Tailwind CSS
- Vercel (deploy)

## Estado actual del proyecto

- Registro/login por email + password con confirmacion por enlace (`ConfirmationURL`).
- Recuperacion de password por enlace (sin pegar OTP manual).
- Ligas privadas con invitacion por codigo y QR.
- Flujo `/join/{code}` con auto-union tras autenticacion.
- Ranking de jugadores y ranking de ligas.
- Panel `/admin` protegido por variable de entorno (`ADMIN_EMAIL`).

## Cierre automático de predicciones (T-30)

Las predicciones se cierran **30 minutos antes** del kickoff (`start_time`). La regla está en [`src/lib/prediction.ts`](src/lib/prediction.ts) y se aplica en UI y servidor.

- **T-30:** `is_locked = true` en BD (sin marcador). Los usuarios dejan de editar.
- **Kickoff:** marcador `0-0` y estado en vivo (si el cron corre a tiempo).
- **`/admin`:** siempre puedes iniciar, actualizar y finalizar partidos a mano (no usa el bloqueo de usuarios).

Endpoint: `GET /api/cron/lock-matches` (protegido con `CRON_SECRET`).

**Prueba local o producción:**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.losqq.com/api/cron/lock-matches"
```

Respuesta esperada: `{ "ok": true, "locked": N, "started": M, "errors": [] }`.

## Sincronización automática de resultados (opcional)

Marcadores vía [API-Football](https://www.api-football.com/) (`api-sports.io`).

- Lógica: [`src/lib/fifa-sync.ts`](src/lib/fifa-sync.ts) → mismas reglas que `/admin` ([`src/lib/match-sync.ts`](src/lib/match-sync.ts)).
- Endpoint: `GET /api/cron/sync-matches` (protegido con `CRON_SECRET`).
- Horario activo del sync: ~11:00–02:00 hora de Caracas, jun–jul 2026 (ahorra cuota API free).
- La app propaga cambios con Supabase Realtime ([`RealtimeRankingListener`](src/components/RealtimeRankingListener.tsx)).

**No usa cron de Supabase.** Los jobs llaman a tu app en Vercel; Supabase solo es la base de datos.

**Vercel Hobby** no permite cron frecuente (solo 1×/día). Usa un servicio externo gratuito o `/admin` manual.

### cron-job.org (gratis, recomendado)

Crea **dos** tareas en [cron-job.org](https://cron-job.org):

| Tarea | URL | Frecuencia | Header |
|-------|-----|------------|--------|
| Cerrar partidos | `https://www.losqq.com/api/cron/lock-matches` | Cada **5–10 min** (todo el Mundial) | `Authorization: Bearer TU_CRON_SECRET` |
| Sync marcadores | `https://www.losqq.com/api/cron/sync-matches` | Cada **3 min** (solo jun–jul, horario de partidos) | Igual |

En cron-job.org: **Advanced** → **Headers** → nombre `Authorization`, valor `Bearer TU_CRON_SECRET` (sustituye el secreto real, el mismo que `CRON_SECRET` en Vercel).

Alternativas: **Vercel Pro** con `vercel.json`, o **`/admin` manual** como respaldo.

**Fallback manual:** penales sin mapear o API caída → `/admin`.

**Supabase (una vez):** [`matches_external_fixture.sql`](matches_external_fixture.sql).

**Prueba sync API:**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.losqq.com/api/cron/sync-matches?force=1"
```

## Variables de entorno

Crea `.env.local` usando `.env.local.example` como referencia:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAIL=tu@email.com,otro@email.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
API_FOOTBALL_KEY=tu_clave_api_sports
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
CRON_SECRET=secreto_largo_aleatorio
```

Notas:

- `ADMIN_EMAIL` controla quien puede acceder a `/admin`.
- `SUPABASE_SERVICE_ROLE_KEY` es solo servidor (nunca exponer en cliente).
- En produccion, `NEXT_PUBLIC_SITE_URL` debe ser el dominio real (por ejemplo `https://losqq.com`).

## Arranque local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Base de datos (Supabase)

1. Crear proyecto en Supabase.
2. Ejecutar `schema.sql` en SQL Editor.
3. (Opcional) Ejecutar `seed.sql` para datos de prueba.
4. Aplicar politicas RLS necesarias (`pools_rls.sql` y otros scripts de soporte segun entorno).

## Auth y correos

Recomendado para produccion:

- Configurar SMTP propio (por ejemplo [Resend](https://resend.com)).
- En Supabase Auth:
  - **Site URL**: dominio publico de la app.
  - **Redirect URL**: incluir `https://tu-dominio/auth/callback`.
- Plantillas:
  - **Confirm signup** con `{{ .ConfirmationURL }}`
  - **Reset password** con `{{ .ConfirmationURL }}`

## Invitaciones por QR / enlace

Cada liga tiene `invite_code`:

- Link directo: `{NEXT_PUBLIC_SITE_URL}/join/{invite_code}`
- Alias corto: `/?join=CODE` (redirige a `/join/CODE`)

Flujo:

1. Usuario escanea QR.
2. Si no esta logueado, se guarda invitacion pendiente.
3. Tras registro + confirmacion email, entra automaticamente a la liga.
4. Si ya esta logueado, se une al momento.

## Deploy

Push a `main` despliega en Vercel.

Antes de publicar:

- Verificar variables de entorno de Production.
- Probar registro, confirmacion, reset password, flujo de QR y acceso admin.

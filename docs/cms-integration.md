# CMS Integration Local Development

This page documents the working local development workflow for the storefront, backend, Keycloak, and Directus CMS integration.

Current status:

- Backend local development works today through the scripted Docker + API flow below.
- Storefront local development works today.
- Local Keycloak is available for auth-protected flows.
- Directus local development is available through the compose stack in `eshop/directus`.
- Directus file uploads are configured for local S3-compatible storage through MinIO.

## Repositories

- Storefront: `cozyhome`
- Backend: `eshop`
- Working branch: `add-cms`

## Prerequisites

- Docker Desktop or Docker Engine with Compose support
- Java 21 or newer
- Node.js and npm

## Local Startup

### 1. Start backend infrastructure

From the backend repo root:

```bash
cd /path/to/eshop
./scripts/dev-infra-up.sh
```

This starts:

- PostgreSQL on `localhost:5433`
- Redis on `localhost:6379`
- Keycloak on `http://localhost:8081`
- Directus on `http://localhost:8055`
- MinIO S3 API on `http://localhost:9000`
- MinIO console on `http://localhost:9001`

If `keycloak/.env` or `directus/.env` do not exist yet, the script creates them from the committed example files automatically.

### 2. Start the backend API

From the backend repo root:

```bash
cd /path/to/eshop
./scripts/dev-api-up.sh
```

This script:

- repairs the known legacy local database schema drift if you already have an older Postgres volume on this machine
- builds the API module and its dependencies
- starts the packaged Spring Boot app on the `dev` profile

The dev profile uses:

- PostgreSQL: `jdbc:postgresql://localhost:5433/eshop`
- Redis: `localhost:6379`
- CORS allowed origin: `http://localhost:3000`
- Default JWT issuer URI: `http://localhost:8081/realms/cozyhome`

For Directus SSO specifically, the local issuer URL is `http://keycloak.lvh.me:8081/realms/cozyhome/.well-known/openid-configuration`. That hostname is intentional: it resolves from both the browser and the Docker network.

### 3. Start the storefront

From the storefront repo root:

```bash
cd /path/to/cozyhome
cp .env.example .env.local
npm install
npm start
```

For CMS work, check these values in `.env.local`:

```dotenv
REACT_APP_API_BASE=http://localhost:8080
REACT_APP_DIRECTUS_BASE_URL=http://localhost:8055
REACT_APP_DIRECTUS_PUBLIC_TOKEN=
REACT_APP_KEYCLOAK_URL=http://localhost:8081
REACT_APP_KEYCLOAK_REALM=cozyhome
REACT_APP_KEYCLOAK_CLIENT_ID=cozyhome-web
```

Leave `REACT_APP_DIRECTUS_PUBLIC_TOKEN` empty unless Directus public permissions are insufficient. Never use a server-side static token in the browser.

## Expected Local URLs

| Service | URL | Notes |
| --- | --- | --- |
| Storefront | `http://localhost:3000` | React dev server |
| Backend API | `http://localhost:8080` | Spring Boot API |
| Backend Redis health | `http://localhost:8080/health/redis` | Quick backend dependency check |
| Keycloak realm | `http://localhost:8081/realms/cozyhome` | Local OIDC issuer used by the backend |
| Keycloak realm for Directus SSO | `http://keycloak.lvh.me:8081/realms/cozyhome` | Shared browser/container hostname used by Directus login |
| Keycloak admin console | `http://localhost:8081/admin/master/console/` | Bootstrap admin login |
| Directus app/API | `http://localhost:8055` | Expected local Directus base URL |
| MinIO S3 API | `http://localhost:9000` | Local S3-compatible object storage endpoint used by Directus |
| MinIO console | `http://localhost:9001` | Inspect the local bucket and uploaded objects |
| Postgres | `localhost:5433` | Docker-mapped dev DB port |
| Redis | `localhost:6379` | Docker-mapped cache port |

## Local Credentials

### Keycloak bootstrap admin

- Username: `kcadmin`
- Password: `kcadmin`

### Keycloak seeded realm users

- `admin@example.com` / `Admin123!` with realm role `admin`
- `manager@example.com` / `Manager123!` with realm role `manager`
- `customer@example.com` / `Customer123!` with realm role `customer`

These users are imported into the `cozyhome` realm and include the claims needed by the frontend/backend local auth checks.

For Directus SSO, `admin` maps to the Directus role `CMS Administrator`, `manager` maps to `CMS Editor`, and the bootstrap also seeds a `CMS Publisher` role for reviewer/publisher workflows.

### Directus first admin

- Email: `directus-admin@example.com`
- Password: `Admin123!`

This is the local break-glass Directus login. Keep it separate from the Keycloak `admin@example.com` user so SSO admins can be provisioned as Directus users without an email collision.

### Local object storage

- Access key: `minioadmin`
- Secret key: `minioadmin123`
- Bucket: `directus`

## Environment References

- Frontend CMS placeholders: [`.env.example`](../.env.example)
- Backend CMS env contract: `eshop/docs/directus-environment.md`
- Backend DB isolation ADR: `eshop/docs/directus-db-isolation-decision.md`
- Backend content model: `eshop/docs/directus-content-model.md`
- Backend content governance: `eshop/docs/directus-content-governance.md`
- Backend schema versioning workflow: `eshop/docs/directus-schema-versioning.md`
- Backend content migration workflow: `eshop/docs/directus-content-migration.md`
- Backend/frontend integration decision: `eshop/docs/directus-integration-pattern-decision.md`
- CMS scope and content ownership: [directus-cms-scope.md](./directus-cms-scope.md)
- Directus reference: [Create a Project](https://directus.io/docs/getting-started/create-a-project)
- Directus auth reference: [Auth & SSO](https://directus.io/docs/configuration/auth-sso)

## Troubleshooting

### Backend does not start

Check infrastructure first:

```bash
cd /path/to/eshop
docker compose ps
docker compose logs postgres redis
```

Common causes:

- PostgreSQL is not running on `localhost:5433`
- Redis is not running on `localhost:6379`
- Another local process is already using port `8080`, `5433`, or `6379`

### Legacy local database columns are missing

If `/products` returns a SQL error about missing columns like `is_active`, `price_amount`, `price_currency`, or the API logs mention `admin_user.role`, this machine still has an older local Postgres volume from a previous backend schema.

Run:

```bash
cd /path/to/eshop
./scripts/dev-db-repair.sh
```

That script patches the legacy local database schema forward without wiping the existing dev data.

### Backend fails on JWT issuer / Keycloak

The dev profile defaults `KEYCLOAK_ISSUER_URI` to `http://localhost:8081/realms/cozyhome`.

If that issuer is unavailable, the backend may fail to boot or auth-protected requests may fail. Fix by either:

- starting the local Keycloak setup with `./scripts/dev-infra-up.sh`, or
- overriding `KEYCLOAK_ISSUER_URI` to a reachable realm before starting the backend

Example:

```bash
cd /path/to/eshop
KEYCLOAK_ISSUER_URI=http://localhost:8081/realms/cozyhome \
./scripts/dev-api-up.sh
```

### Storefront cannot reach the backend

Check:

- `REACT_APP_API_BASE` points to `http://localhost:8080`
- the backend is actually running
- the frontend was restarted after changing `.env.local`

The backend dev profile currently allows CORS from `http://localhost:3000`.

### Directus is not reachable on port 8055

Run:

```bash
cd /path/to/eshop/directus
docker compose ps
docker compose logs directus
```

Common causes:

- Docker Desktop / Docker Engine is not running
- Port `8055` is already in use
- The Directus container is still booting on first start
- The compose stack was started from the wrong directory
- `directus/.env` was not created from `.env.example`
- Required Directus env variables in `directus/.env` are blank or malformed

If auth-related variables changed, rerun `./scripts/directus-sso-bootstrap.sh` after the Directus and Keycloak containers are healthy.

If the CMS schema drifts locally, rerun `./scripts/directus-schema-apply.sh`.

If you intentionally changed the schema in Directus Studio, export the reviewed snapshot with `./scripts/directus-schema-snapshot.sh` and commit `eshop/directus/schema/schema.snapshot.json` in the same PR.

If you need to reseed the initial editorial content, rerun `./scripts/directus-content-import.sh`. Use `--dry-run` first when you are validating a seed change.

### Directus uploads fail or assets do not load

Run:

```bash
cd /path/to/eshop/directus
docker compose ps
docker compose logs storage storage-init directus
```

Check:

- MinIO is running on `localhost:9000`
- the `storage-init` service completed successfully and created bucket `directus`
- `DIRECTUS_STORAGE_S3_ENDPOINT` is `http://storage:9000` inside `directus/.env`
- `DIRECTUS_STORAGE_S3_FORCE_PATH_STYLE=true` is set for the local S3-compatible endpoint

For a full upload check, run `eshop/scripts/directus-storage-smoke-test.sh`.

### CMS requests return 401 or 403

Check:

- `REACT_APP_DIRECTUS_BASE_URL` points at the correct instance
- the Directus public role has the expected read permissions, or
- `REACT_APP_DIRECTUS_PUBLIC_TOKEN` is a valid read-only token

Do not use backend-only Directus credentials in frontend env files.

### Directus Keycloak login fails

Check:

- `directus/.env` still points `DIRECTUS_AUTH_KEYCLOAK_ISSUER_URL` at `http://keycloak.lvh.me:8081/realms/cozyhome/.well-known/openid-configuration`
- the Keycloak `directus` client exists and allows redirect URI `http://localhost:8055/auth/login/keycloak/callback`
- the Directus and Keycloak containers were restarted after env changes
- `./scripts/directus-sso-bootstrap.sh` completed without error

If the login screen shows only the email/password form and no `Keycloak` button, inspect `docker compose --env-file directus/.env -f directus/docker-compose.yml logs directus`.

### Browser CORS errors during CMS work

Current backend dev CORS only includes `http://localhost:3000`.

That is enough when the storefront running on port `3000` calls the backend directly.

If browser code served from a Directus origin also needs to call the backend, add that origin later through backend CORS configuration instead of working around it in code.

## Quick Verification

From the backend repo root:

```bash
cd /path/to/eshop
./scripts/dev-status.sh
```

It checks the Docker services plus the main local URLs for the backend, Keycloak, Directus, and storefront.

### Changes do not appear after editing env files

Restart the affected process:

- restart `npm start` after frontend env changes
- restart Spring Boot after backend env changes
- recreate the Directus container after compose env changes

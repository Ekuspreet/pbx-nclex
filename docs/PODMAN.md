# Podman Deployment

This setup runs five containers:

- `postgres`: PostgreSQL database
- `server`: Express API on port `5000`
- `client`: built Vite client served by nginx on internal port `80`
- `admin`: built Vite admin served by nginx on internal port `80`
- `nginx`: public reverse proxy on host port `80`

Both frontend containers proxy `/api/v1` and `/public` to the `server` container, so the browser uses same-origin requests. The public nginx container routes hostnames to the correct internal service.

## Local or Server Run

Copy the example env file and fill in real secrets:

```bash
cp .env.podman.example .env
```

Generate secrets with:

```bash
openssl rand -hex 32
```

Build and start:

```bash
podman compose -f podman-compose.yaml up -d --build
```

Check logs:

```bash
podman compose -f podman-compose.yaml logs -f server
```

Run the question import after the API has migrated the database:

```bash
podman compose -f podman-compose.yaml exec server npm run questions:import
```

Open:

- Client: `http://drac.ooguy.com`
- Admin: `http://admin.drac.ooguy.com`
- API health: `http://api.drac.ooguy.com/api/v1/health`

The direct host ports `8080`, `8081`, `5000`, and `5432` are bound to `127.0.0.1` for local diagnostics. Public traffic should enter through nginx on port `80`.

## Production Notes

For HTTPS at the nginx reverse proxy, set:

```env
CLIENT_URL=https://your-client-domain.example
ADMIN_URL=https://your-admin-domain.example
SERVER_URL=https://your-api-domain.example
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

The nginx reverse proxy runs in Podman from `deploy/nginx/Containerfile` and uses `deploy/nginx/pbx-nclex.conf`. It proxies public port `80` to internal Compose services: `client:80`, `admin:80`, and `server:5000`.

Keep Postgres private by leaving its port bound to `127.0.0.1`, or remove the `POSTGRES_PORT` mapping if you do not need direct database access from the host.

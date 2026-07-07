# Podman Deployment

This setup runs four containers:

- `postgres`: PostgreSQL database
- `server`: Express API on port `5000`
- `client`: built Vite client served by nginx on host port `8080`
- `admin`: built Vite admin served by nginx on host port `8081`

Both frontend containers proxy `/api/v1` and `/public` to the `server` container, so the browser uses same-origin requests.

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
podman-compose -f podman-compose.yaml up -d --build
```

Check logs:

```bash
podman-compose -f podman-compose.yaml logs -f server
```

Run the question import after the API has migrated the database:

```bash
podman-compose -f podman-compose.yaml exec server npm run questions:import
```

Open:

- Client: `http://localhost:8080`
- Admin: `http://localhost:8081`
- API health: `http://localhost:5000/api/v1/health`

## Production Notes

For HTTPS behind a host reverse proxy, set:

```env
CLIENT_URL=https://your-client-domain.example
ADMIN_URL=https://your-admin-domain.example
SERVER_URL=https://your-api-domain.example
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

Use `deploy/nginx/pbx-nclex.conf.example` as the host reverse-proxy starting point. It proxies public port `80` to the app ports exposed by Podman: client `8080`, admin `8081`, and API `5000`.

Keep Postgres private by removing the `POSTGRES_PORT` mapping if you do not need direct database access from the host.

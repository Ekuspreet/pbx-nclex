# Podman Deployment

This setup runs three containers:

- `postgres`: PostgreSQL database
- `server`: Express API on port `5000`
- `client`: built Vite client and admin UI served by nginx on internal port `80`

Podman publishes the client container on port `8080`. The client container uses the repo-root `nginx.conf` to serve the app and proxy API/public requests to the server container:

- `/` -> `127.0.0.1:8080`
- `/admin/` -> `127.0.0.1:8080`
- `/api/v1/` -> `server:5000`
- `/public/` -> `server:5000`

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

- Client: `http://your-domain.example/`
- Admin: `http://your-domain.example/admin/`
- API health: `http://your-domain.example/api/v1/health`

The client port `8080` is publicly published. The API and database ports `5000` and `5432` stay bound to `127.0.0.1`.

## Production Notes

For HTTPS at the nginx reverse proxy, set:

```env
APP_URL=https://your-domain.example
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

The nginx config used by the client container is `nginx.conf` at the repo root. If you run host nginx for HTTPS, it only needs to proxy to the client container at `127.0.0.1:8080`.

Keep Postgres private by leaving its port bound to `127.0.0.1`, or remove the `POSTGRES_PORT` mapping if you do not need direct database access from the host.

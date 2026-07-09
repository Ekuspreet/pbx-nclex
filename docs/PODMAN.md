# Podman Deployment

This setup runs four containers:

- `postgres`: PostgreSQL database
- `server`: Express API on port `5000`
- `client`: built Vite client served by nginx on internal port `80`
- `admin`: built Vite admin served by nginx on internal port `80`

Podman binds the app ports to `127.0.0.1` only. Your host nginx owns public port `80` and routes one domain by path:

- `/` -> `127.0.0.1:8080`
- `/admin/` -> `127.0.0.1:8081`
- `/api/v1/` -> `127.0.0.1:5000`
- `/public/` -> `127.0.0.1:5000`

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

Install the host nginx config:

```bash
sudo cp deploy/nginx/pbx-nclex.conf /etc/nginx/sites-available/pbx-nclex.conf
sudo ln -sf /etc/nginx/sites-available/pbx-nclex.conf /etc/nginx/sites-enabled/pbx-nclex.conf
sudo nginx -t
sudo systemctl reload nginx
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

The direct host ports `8080`, `8081`, `5000`, and `5432` are bound to `127.0.0.1`. Public traffic should enter through host nginx on port `80`.

## Production Notes

For HTTPS at the nginx reverse proxy, set:

```env
APP_URL=https://your-domain.example
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

The nginx reverse proxy runs on the host and uses `deploy/nginx/pbx-nclex.conf`. It proxies public port `80` to the loopback ports exposed by Podman: `127.0.0.1:8080`, `127.0.0.1:8081`, and `127.0.0.1:5000`.

Keep Postgres private by leaving its port bound to `127.0.0.1`, or remove the `POSTGRES_PORT` mapping if you do not need direct database access from the host.

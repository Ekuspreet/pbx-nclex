# Host Nginx Reverse Proxy

Use your host nginx as the public reverse proxy. Podman only runs the app containers and binds their ports to `127.0.0.1`.

Public routes:

- `http://your-domain.example/` -> `127.0.0.1:8080`
- `http://your-domain.example/admin/` -> `127.0.0.1:8081`
- `http://your-domain.example/api/v1/` -> `127.0.0.1:5000`
- `http://your-domain.example/public/` -> `127.0.0.1:5000`

The proxy config is `deploy/nginx/pbx-nclex.conf`.

## Run

Start the stack:

```bash
podman compose -f podman-compose.yaml up -d --build
```

Install and reload host nginx:

```bash
sudo cp deploy/nginx/pbx-nclex.conf /etc/nginx/sites-available/pbx-nclex.conf
sudo ln -sf /etc/nginx/sites-available/pbx-nclex.conf /etc/nginx/sites-enabled/pbx-nclex.conf
sudo nginx -t
sudo systemctl reload nginx
```

## Config

Point your domain at the host running nginx, set `APP_URL` in `.env`, and set `server_name` in `deploy/nginx/pbx-nclex.conf` to the same domain.

## App Environment

Set the public origin served by nginx:

```env
APP_URL=http://your-domain.example
```

For HTTPS, use `https://` URLs and set:

```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

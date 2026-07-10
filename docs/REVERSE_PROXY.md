# Nginx

The project uses one nginx config: `nginx.conf` at the repo root. The client container copies this file and uses it to serve the built Vite app, including admin routes, and proxy API/public requests to the Express service.

Public routes:

- `/` -> built client app
- `/admin/` -> built client app
- `/api/v1/` -> Express API at `server:5000`
- `/public/` -> Express public assets at `server:5000`

When running with Podman, public traffic can go directly to the client container on port `8080`, or a host reverse proxy can forward to that same port.

## Run

Start the stack:

```bash
podman compose -f podman-compose.yaml up -d --build
```

If you still use host nginx in front of Podman, forward traffic to the client container:

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
}
```

## App Environment

Set the public origin served by nginx in `server/.env`:

```env
CLIENT_URL=http://your-domain.example
```

For HTTPS, use `https://` URLs and set:

```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

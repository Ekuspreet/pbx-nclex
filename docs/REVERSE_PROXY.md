# Podman Nginx Reverse Proxy

Use the Podman nginx service as the public reverse proxy. The app services stay on the internal Compose network, and nginx owns public port `80`.

Public routes:

- `http://drac.ooguy.com` -> `client:80`
- `http://admin.drac.ooguy.com` -> `admin:80`
- `http://api.drac.ooguy.com` -> `server:5000`

The nginx image is built from `deploy/nginx/Containerfile`, and the proxy config is `deploy/nginx/pbx-nclex.conf`.

## Run

Start the stack:

```bash
podman compose -f podman-compose.yaml up -d --build
```

Check the nginx logs:

```bash
podman logs -f pbx-nclex-nginx
```

## Config

If the domains change, update the `server_name` values in `deploy/nginx/pbx-nclex.conf` and the matching app URLs in `.env`.

## App Environment

Set URLs to the public names served by nginx:

```env
CLIENT_URL=http://drac.ooguy.com
ADMIN_URL=http://admin.drac.ooguy.com
SERVER_URL=http://api.drac.ooguy.com
```

For HTTPS, use `https://` URLs and set:

```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

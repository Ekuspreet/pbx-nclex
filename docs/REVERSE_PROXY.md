# Reverse Proxy

Use a host-level reverse proxy for production. Podman keeps the app services on local ports, and nginx owns public port `80`.

Default local ports:

- Client: `127.0.0.1:8080`
- Admin: `127.0.0.1:8081`
- API: `127.0.0.1:5000`

The example config is in `deploy/nginx/pbx-nclex.conf.example`.

## Install

Copy the example to your nginx config directory:

```bash
sudo cp deploy/nginx/pbx-nclex.conf.example /etc/nginx/conf.d/pbx-nclex.conf
```

Edit the `server_name` values:

```nginx
server_name app.example.com;
server_name admin.example.com;
server_name api.example.com;
```

Then test and reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## App Environment

Set URLs to the public names served by nginx:

```env
CLIENT_URL=http://app.example.com
ADMIN_URL=http://admin.example.com
SERVER_URL=http://api.example.com
```

For HTTPS, use `https://` URLs and set:

```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

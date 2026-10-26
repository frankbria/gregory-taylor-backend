# Deployment: Users, Service and Sandbox (production)

The backend is the admin app. It serves **https://admin.gregorytaylorphotography.com** from the production server, `frank-prod-server` (reached over Tailscale).

It runs the way frankbria.com and its Strapi already do on that server:
- its own non-root system user;
- a sandboxed systemd unit;
- bound to `127.0.0.1`, with nginx in front.

Don't use pm2 as root. The old copy was stopped on 2026-10-25 because Next 15.5.9 running as root under pm2 was an unauthenticated route to root on the server.

## At a glance

| | Value |
|---|---|
| OS user | `gt-backend` (system user, shell `/usr/sbin/nologin`, home `/var/lib/gt-backend` for the npm cache) |
| Code | `/var/www/gregory-taylor-backend`, owned by `gt-backend` |
| Service | `gregory-taylor-backend.service` (systemd) |
| Listens on | `127.0.0.1:4010` only (`next start -H 127.0.0.1 -p 4010`) |
| Node | `/usr/local/bin/node`, which is 24.11.1, the server-wide Node that hypnosis-studio, frankbria.com and Strapi also use |
| Writable at runtime | `.next/cache` only. Data lives in MongoDB and images in Cloudinary, so nothing else is written to disk |
| Env file | `/var/www/gregory-taylor-backend/.env` (the file `deploy.yml` writes), owner `gt-backend`, mode `600` |
| Next.js | **≥ 15.5.28**. Older 15.x has unauthenticated RCEs in the image optimizer |

## Before the first deploy

1. **Clear the stale copy.** `/var/www/gregory-taylor-backend` is a stale build owned by uid 1001, which matches no user. Move it aside instead of building on top of it. Don't reuse its `.env` as is: it sat at mode 644 holding `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MONGODB_URI`, `BETTER_AUTH_SECRET` and the Cloudinary secret. If those values are still live, rotate them.
2. **Remove root's pm2 entries.** Both are stopped, but `gregory-taylor-backend` would fight the unit for port 4010 if anyone resurrected it: `pm2 delete gregory-taylor-backend gregory-taylor-frontend && pm2 save`.
3. **DNS:** `admin` currently points at staging (195.35.14.177). Point it at prod (45.33.41.124) before running certbot.
4. **MongoDB:** if the URI is Atlas, allow prod's IP in the Atlas network access list.

## Create the user and the unit

```bash
useradd --system --user-group --home-dir /var/lib/gt-backend --create-home \
        --shell /usr/sbin/nologin gt-backend
chown -R gt-backend:gt-backend /var/www/gregory-taylor-backend
chmod 600 /var/www/gregory-taylor-backend/.env
```

`/etc/systemd/system/gregory-taylor-backend.service`:

```ini
[Unit]
Description=Gregory Taylor admin (admin.gregorytaylorphotography.com)
After=network.target

[Service]
Type=simple
User=gt-backend
Group=gt-backend
WorkingDirectory=/var/www/gregory-taylor-backend
Environment=NODE_ENV=production
Environment=NEXT_TELEMETRY_DISABLED=1
Environment=HOME=/var/lib/gt-backend
ExecStart=/usr/local/bin/node /var/www/gregory-taylor-backend/node_modules/next/dist/bin/next start -H 127.0.0.1 -p 4010
Restart=always
RestartSec=5
MemoryMax=512M

NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
LockPersonality=true
ReadWritePaths=/var/www/gregory-taylor-backend/.next/cache

[Install]
WantedBy=multi-user.target
```

`MemoryMax=512M` matches the old pm2 `max_memory_restart: '500M'`.

**Enable the unit only after the first `next build`.** systemd refuses to start a unit whose `ReadWritePaths` doesn't exist, and `.next/cache` is created by the build.

## Environment that couples the two sites

The frontend lives on staging and calls this app across servers, so these values have to agree:

| Variable | Value | Why |
|---|---|---|
| `CORS_ALLOWED_ORIGINS` | `https://beta.gregorytaylorphotography.com` (add the apex/www origin when the public site moves) | Read in two places. `lib/utils.js` only answers browser requests from listed origins, and `lib/auth.js` uses the same list as better-auth's `trustedOrigins`. A missing origin breaks **login** as well as API calls |
| `BETTER_AUTH_URL` | `https://admin.gregorytaylorphotography.com` | Recommended, though not in `.env.example`. `lib/auth.js` sets no `baseURL`, so better-auth uses this variable, or otherwise works the URL out from each request, which can go wrong behind nginx |
| `NEXT_PUBLIC_*` | Set **at build time** | Next.js inlines them into the bundle, so changing them later needs a rebuild, not just a restart |
| Stripe webhook | Endpoint `https://admin.gregorytaylorphotography.com/api/webhooks/stripe`, its signing secret in `STRIPE_WEBHOOK_SECRET` | `app/api/webhooks/stripe/route.js` verifies the signature |

**Content stored in MongoDB.** Any HTML or URLs saved while the site lived elsewhere (`localhost:4010`, the staging IP, an old domain) are served as stored. Before go-live, search the content collections for hard-coded hosts and rewrite them to the final origin, or to relative paths.

## nginx

`/etc/nginx/sites-available/gregory-taylor-backend` still exists from the old setup. It's disabled, and its certificate has expired.
1. Change `proxy_pass http://localhost:4010` to **`http://127.0.0.1:4010`** in both places. `localhost` also resolves to `::1`, which nothing listens on.
2. Re-enable it: `ln -s ../sites-available/gregory-taylor-backend /etc/nginx/sites-enabled/`.
3. `nginx -t && systemctl reload nginx`.
4. Once DNS points here, run `certbot --nginx -d admin.gregorytaylorphotography.com`.

## Deploying

GitHub-hosted runners can't reach prod, because SSH is Tailscale-only. So `deploy.yml`'s rsync step can't work. Use the local-deploy pattern from frankbria-com's `scripts/deploy.sh`:
1. Ship `main` as a `git bundle` over `ssh root@frank-prod-server`.
2. Run git, `npm ci` and `next build` **as the app user**: `runuser -u gt-backend -- env HOME=/var/lib/gt-backend PATH=/opt/node-v24.11.1/bin:/usr/bin:/bin …`. Git refuses a checkout owned by another user, so it has to run as `gt-backend` too.
3. Keep `.next.previous`, then `systemctl restart gregory-taylor-backend`.
4. Health-check `http://127.0.0.1:4010/`, and restore `.next.previous` if it fails.

Don't `rsync --delete` into this folder unless `.env` is excluded, or the deploy deletes it.

## Checks after deploy

```bash
systemctl is-active gregory-taylor-backend
ps -o user= -p "$(systemctl show -p MainPID --value gregory-taylor-backend)"   # gt-backend
ss -tlnp 'sport = :4010'                                                        # 127.0.0.1 only
journalctl -u gregory-taylor-backend -p warning --no-pager | tail               # no EROFS/EACCES
curl -sI https://admin.gregorytaylorphotography.com/ | head -1
```

# Deployment

This document describes the production hosting shape and the CI/CD path from a
code change to a running Gunfight container.

## Production Shape

Gunfight runs as one Node.js container on a Hetzner VPS. (In Germany, EU)

```text
Browser
  -> https://gunfight.mkjems.dk
  -> DNS A record
  -> Hetzner VPS ports 80/443
  -> Caddy
  -> http://127.0.0.1:8080
  -> Gunfight Docker container
```

The app container is not exposed directly to the internet. It binds only to
`127.0.0.1:8080` on the VPS, and Caddy owns the public HTTP and HTTPS ports.

Current production domain:

- `gunfight.mkjems.dk`

The known DNS setup is an `A` record pointing `gunfight.mkjems.dk` at the
Hetzner VPS. IPv6 is not part of the current production setup.

## Actors

- Human developer: writes code and documentation, runs local checks when useful,
  and pushes accepted changes to `master`.
- GitHub repository: source of truth for code, documentation, Dockerfile, and
  workflow definition.
- GitHub Actions: runs deploy checks, builds the production image, publishes it,
  and starts deployment.
- GitHub Container Registry: stores the production Docker image
  `ghcr.io/mkjems/gunfight:latest`.
- Hetzner VPS: production host that runs Docker, Docker Compose, Caddy, and the
  Gunfight container.
- Docker Compose on the VPS: pulls and runs the latest production image.
- Caddy on the VPS: terminates HTTP/HTTPS traffic and reverse proxies to the
  private app port.
- DNS provider: points `gunfight.mkjems.dk` at the VPS.
- Players' browsers: load the PWA/web app over HTTPS and connect to the same
  Express and Socket.IO server.

## CI/CD Flow

Deployment is triggered by a push to the `master` branch.

1. The human developer pushes to `master`.
2. GitHub Actions starts `.github/workflows/container.yml`.
3. The `check` job runs on `ubuntu-latest`.
4. The workflow checks out the repo and installs Node.js 22.
5. `npm ci` installs dependencies from `package-lock.json`.
6. `npm run check:deploy` runs the deployment gate:
    - Prettier format check.
    - ESLint.
    - TypeScript checks for server/shared/client configs.
    - Vitest UI/component tests.
    - Server tests after a production build.
7. If checks pass, the `build` job builds the Docker image from `Dockerfile`.
8. GitHub Actions logs in to GHCR using the workflow `GITHUB_TOKEN`.
9. The image is pushed as `ghcr.io/mkjems/gunfight:latest`.
10. If the image push succeeds, the `deploy` job connects to the VPS over SSH.
11. On the VPS, the workflow runs:

```sh
cd /opt/gunfight
docker compose pull
docker compose up -d
docker image prune -f
```

The deploy job does not copy source files to the VPS. The VPS only needs the
Compose file, Docker/GHCR access, and the ability to pull and run the latest
image.

Browser smoke tests are not part of the deployment gate. They are run manually
with `npm run test:browser` when browser-path verification is needed.

## Production Image

The production image is built with a two-stage Dockerfile:

1. Build stage:
    - Uses `node:22-alpine`.
    - Runs `npm ci`.
    - Copies source files.
    - Runs `npm run build`.
2. Runtime stage:
    - Uses `node:22-alpine`.
    - Installs production dependencies with `npm ci --omit=dev`.
    - Copies only `dist/` from the build stage.
    - Runs as the `node` user.
    - Exposes port `8080`.
    - Starts with `npm start`.

The container healthcheck calls:

```text
http://127.0.0.1:${PORT}/api
```

## VPS Layout

The production working directory on the VPS is:

```text
/opt/gunfight
```

The production Compose file should live at:

```text
/opt/gunfight/compose.yaml
```

Expected production Compose shape:

```yaml
services:
    gunfight:
        image: ghcr.io/mkjems/gunfight:latest
        environment:
            PORT: 8080
            NODE_ENV: production
        ports:
            - '127.0.0.1:8080:8080'
        restart: unless-stopped
```

The repository `compose.yaml` is for local Docker/OrbStack use. It builds the
image locally and exposes `8080:8080`. The VPS Compose file should use the GHCR
image and keep the app bound to localhost.

## VPS Prerequisites

The VPS needs:

- Ubuntu or compatible Linux host.
- Docker Engine.
- Docker Compose plugin.
- Caddy.
- `/opt/gunfight/compose.yaml`.
- GHCR read access for `ghcr.io/mkjems/gunfight:latest` if the package is not
  public.
- SSH access for GitHub Actions.

If GHCR authentication is required on the VPS, log in once with a read-only
token:

```sh
echo YOUR_READ_ONLY_GHCR_TOKEN | docker login ghcr.io -u mkjems --password-stdin
```

## GitHub Secrets

The deploy workflow expects these repository secrets:

- `VPS_HOST`: VPS hostname or IP address.
- `VPS_USER`: SSH user used by the deploy workflow.
- `VPS_SSH_KEY`: private SSH key for the deploy workflow.

The matching public key must be present in the deploy user's
`~/.ssh/authorized_keys` on the VPS.

The workflow also uses GitHub's built-in `GITHUB_TOKEN` to publish the container
image to GHCR. The workflow permissions grant `packages: write`.

## Caddy

Caddy owns ports `80` and `443` and proxies production traffic to the private
Gunfight port:

```caddyfile
gunfight.mkjems.dk {
    reverse_proxy 127.0.0.1:8080
}
```

After editing `/etc/caddy/Caddyfile`, validate and reload:

```sh
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Manual Deployment

Manual deployment uses the same commands as the GitHub Actions deploy job:

```sh
ssh VPS_USER@VPS_HOST
cd /opt/gunfight
docker compose pull
docker compose up -d
docker image prune -f
```

Check the running service:

```sh
docker compose ps
docker compose logs --tail=100
```

## Verification

From a local machine:

```sh
curl -I http://gunfight.mkjems.dk
curl -I https://gunfight.mkjems.dk
```

Expected result:

- HTTP redirects to HTTPS.
- HTTPS returns a valid response.
- The lobby loads in a browser.
- Two browser sessions can connect, ready up, and start a match.

On the VPS:

```sh
cd /opt/gunfight
docker compose ps
docker compose logs --tail=100
sudo systemctl status caddy
sudo journalctl -u caddy --no-pager -n 100
```

## Failure Boundaries

- If checks fail, no image is built and production is unchanged.
- If image build or push fails, the VPS is not touched.
- If SSH deployment fails, the previous running container normally continues
  because Compose has not replaced it successfully.
- If the new container starts but is unhealthy or exits, inspect
  `docker compose ps` and `docker compose logs`.
- If HTTPS fails while the container is healthy, inspect Caddy, DNS, and VPS
  firewall rules.

## Operational Notes

- Keep the app port `8080` private on production.
- Keep public firewall access limited to HTTP, HTTPS, and the chosen SSH rule.
- Do not store GHCR tokens or SSH private keys in the repository.
- High scores are stored in server memory and are lost whenever the container
  restarts.
- The deployed app is a single instance. There is no load balancer, external
  database, or multi-server session coordination in the current hosting setup.

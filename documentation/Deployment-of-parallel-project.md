# Deployment Of Parallel Project

This document describes how to host another project on the same Hetzner VPS as
Gunfight.

The current VPS already has the important shared infrastructure:

- Docker and Docker Compose.
- Caddy on public ports `80` and `443`.
- Gunfight running from `/opt/gunfight`.
- Gunfight bound privately to `127.0.0.1:8080`.
- GitHub Actions deploying a GHCR image over SSH.

The parallel project should follow the same pattern, but it must use its own
domain, directory, GHCR image, Compose file, and private localhost port.

## Target Shape

Example target shape for a second project:

```text
Browser
  -> https://other-project.mkjems.dk
  -> DNS A record
  -> same Hetzner VPS ports 80/443
  -> Caddy
  -> http://127.0.0.1:8081
  -> other project Docker container
```

Gunfight can keep using:

```text
gunfight.mkjems.dk -> Caddy -> 127.0.0.1:8080 -> Gunfight container
```

The parallel project can use:

```text
other-project.mkjems.dk -> Caddy -> 127.0.0.1:8081 -> other container
```

The exact `8081` value is only an example. The rule is that every project needs
a unique private host port on the VPS.

## Values To Choose

Choose these values before setting up the new project:

| Value                 | Example                               | Notes                                               |
| --------------------- | ------------------------------------- | --------------------------------------------------- |
| Project slug          | `other-project`                       | Used for `/opt/other-project` and Compose naming.   |
| Production domain     | `other-project.mkjems.dk`             | Must point to the same VPS.                         |
| GHCR image            | `ghcr.io/mkjems/other-project:latest` | One image per project.                              |
| VPS app directory     | `/opt/other-project`                  | Keep it separate from `/opt/gunfight`.              |
| Host port             | `127.0.0.1:8081`                      | Must not conflict with Gunfight's `127.0.0.1:8080`. |
| Container port        | `8080`                                | Can be the same inside each container.              |
| GitHub default branch | `master` or `main`                    | Match the new repository.                           |

## DNS

Create an `A` record for the new domain and point it to the same Hetzner VPS IP
address as `gunfight.mkjems.dk`.

Example:

```text
other-project.mkjems.dk A <VPS_IP_ADDRESS>
```

No extra public port is needed for the new project. Caddy will route requests by
hostname on ports `80` and `443`.

## VPS Directory And Compose File

Create a separate directory on the VPS:

```sh
ssh root@VPS_HOST
mkdir -p /opt/other-project
cd /opt/other-project
```

Create `/opt/other-project/compose.yaml`:

```yaml
services:
    other-project:
        image: ghcr.io/mkjems/other-project:latest
        environment:
            PORT: 8080
            NODE_ENV: production
        ports:
            - '127.0.0.1:8081:8080'
        restart: unless-stopped
```

The left side of the port mapping is the VPS host port. It must be unique. The
right side is the port inside the container. Many projects can use `8080` inside
their own containers because containers have separate network namespaces.

Do not add a public port mapping such as `8081:8080`. Keep the app reachable
only from localhost and let Caddy expose HTTPS.

## GHCR Access From The VPS

If the new GHCR package is private, the VPS needs read access to it.

One simple setup is to log in once on the VPS with a GitHub token that has
package read access:

```sh
echo YOUR_READ_ONLY_GHCR_TOKEN | docker login ghcr.io -u mkjems --password-stdin
```

If the current VPS login already has access to the new package, no extra login
is needed.

## Caddy

Add a second site block to `/etc/caddy/Caddyfile`.

Expected shape with Gunfight and a parallel project:

```caddyfile
gunfight.mkjems.dk {
    reverse_proxy 127.0.0.1:8080
}

other-project.mkjems.dk {
    reverse_proxy 127.0.0.1:8081
}
```

Then validate and reload Caddy:

```sh
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy will request and renew the HTTPS certificate for the new hostname
automatically when DNS points to the VPS and ports `80` and `443` are reachable.

## GitHub Actions In The New Project

The new project should have its own workflow that builds its image, pushes to
GHCR, and deploys by SSH to its own `/opt` directory.

Example workflow shape:

```yaml
name: Build and Deploy Container

on:
    push:
        branches:
            - master

permissions:
    contents: read
    packages: write

jobs:
    check:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v4

            - uses: actions/setup-node@v4
              with:
                  node-version: 22
                  cache: npm
                  cache-dependency-path: package-lock.json

            - name: Install dependencies
              run: npm ci

            - name: Run deploy checks
              run: npm run check:deploy

    build:
        runs-on: ubuntu-latest
        needs: check

        steps:
            - uses: actions/checkout@v4

            - uses: docker/login-action@v3
              with:
                  registry: ghcr.io
                  username: ${{ github.actor }}
                  password: ${{ secrets.GITHUB_TOKEN }}

            - uses: docker/build-push-action@v6
              with:
                  context: .
                  push: true
                  tags: ghcr.io/mkjems/other-project:latest

    deploy:
        runs-on: ubuntu-latest
        needs: build

        steps:
            - name: Deploy to VPS
              uses: appleboy/ssh-action@v1.2.0
              with:
                  host: ${{ secrets.VPS_HOST }}
                  username: ${{ secrets.VPS_USER }}
                  key: ${{ secrets.VPS_SSH_KEY }}
                  script: |
                      cd /opt/other-project
                      docker compose pull
                      docker compose up -d
                      docker image prune -f
```

Adjust these values for the new repository:

- Branch name, if the repository uses `main` instead of `master`.
- Node version and check command, if it is not a Node 22 project.
- GHCR image tag.
- Deploy directory.

## GitHub Secrets

Add these secrets to the new GitHub repository:

- `VPS_HOST`: same VPS host or IP as Gunfight.
- `VPS_USER`: SSH user used for deployment.
- `VPS_SSH_KEY`: private key that can SSH into the VPS.

The same deploy key can be reused if its public key is already authorized on the
VPS, but a separate deploy key per repository is cleaner. If using a new key,
add the new public key to the deploy user's `~/.ssh/authorized_keys` on the VPS.

The new workflow uses its own repository's built-in `GITHUB_TOKEN` to push that
repository's image to GHCR.

## Manual First Deployment

After DNS, Compose, GHCR access, and Caddy are ready, the first deployment can
be done by pushing to the new project's deploy branch.

Manual deployment uses the same commands as the workflow:

```sh
ssh root@VPS_HOST
cd /opt/other-project
docker compose pull
docker compose up -d
docker compose ps
```

## Verification

From a local machine:

```sh
curl -I http://other-project.mkjems.dk
curl -I https://other-project.mkjems.dk
```

Expected result:

- HTTP redirects to HTTPS.
- HTTPS returns a valid response from the new project.
- Gunfight still works at `https://gunfight.mkjems.dk`.

On the VPS:

```sh
cd /opt/other-project
docker compose ps
docker compose logs --tail=100
sudo caddy validate --config /etc/caddy/Caddyfile
sudo journalctl -u caddy --no-pager -n 100
```

Check which ports are already in use before choosing another port:

```sh
ss -ltnp
```

## Common Mistakes

- Reusing `127.0.0.1:8080` for the new project. Only one service can bind a
  host port.
- Editing `/opt/gunfight/compose.yaml` instead of creating a new project
  directory.
- Pointing Caddy to the container's internal port without publishing it on a
  localhost host port.
- Forgetting to add DNS for the new hostname.
- Forgetting to reload Caddy after changing `/etc/caddy/Caddyfile`.
- Pushing a GHCR image name that does not match the image in the VPS Compose
  file.
- Using a private GHCR package without giving the VPS read access.

## Operational Notes

- Multiple projects can share the same Caddy process.
- Multiple projects can share the same Docker daemon.
- Each project should have its own `/opt/<project>` directory and Compose file.
- Each project should have its own GHCR image tag.
- Each project should use a unique private localhost host port.
- `docker image prune -f` removes unused images globally. It is normally safe
  after successful deploys, but it affects the whole VPS, not only one project.
- If the VPS becomes memory, CPU, or disk constrained, move one project to a
  separate VPS before adding more complexity.

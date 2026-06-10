# Caddy HTTPS Setup On Hetzner

Goal:

- Run Gunfight at `https://gunfight.mkjems.dk`.
- Keep the Gunfight container private on the VPS.
- Let Caddy own public ports `80` and `443`.

Known DNS:

- `gunfight.mkjems.dk` has an `A` record pointing to `178.105.241.87`.
- IPv6 is intentionally out of scope for now.

## Target Shape

```text
Internet
  -> gunfight.mkjems.dk
  -> Hetzner VPS ports 80/443
  -> Caddy
  -> http://127.0.0.1:8080
  -> Gunfight container
```

## Production Compose File

Use this on the VPS at `/opt/gunfight/compose.yaml`:

```yaml
services:
  gunfight:
    image: ghcr.io/mkjems/gunfight:latest
    environment:
      PORT: 8080
      NODE_ENV: production
    ports:
      - "127.0.0.1:8080:8080"
    restart: unless-stopped
```

The `127.0.0.1` binding is important: it keeps the Node app reachable from Caddy on the VPS, but not directly exposed to the internet.

## Install Caddy

Run on the VPS:

```sh
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg
sudo chmod o+r /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

## Configure Caddy

Edit `/etc/caddy/Caddyfile`:

```caddyfile
gunfight.mkjems.dk {
	reverse_proxy 127.0.0.1:8080
}
```

Then validate and reload:

```sh
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Start Or Restart Gunfight

```sh
cd /opt/gunfight
docker compose pull
docker compose up -d
docker compose ps
```

## Firewall

At minimum, public traffic must be allowed on:

- `80/tcp`
- `443/tcp`

SSH should stay limited to whatever rule is already used for server administration.

The Gunfight container port `8080` does not need to be public.

## Verify

From your laptop:

```sh
curl -I http://gunfight.mkjems.dk
curl -I https://gunfight.mkjems.dk
```

Expected:

- `http://gunfight.mkjems.dk` redirects to HTTPS.
- `https://gunfight.mkjems.dk` returns a valid HTTPS response.

On a phone:

- Open `https://gunfight.mkjems.dk`.
- Confirm the browser no longer says `Not Secure`.
- Confirm the lobby loads.
- Confirm two phones can join the same game or separate games as expected.

If HTTPS fails, check:

```sh
sudo systemctl status caddy
sudo journalctl -u caddy --no-pager -n 100
docker compose logs --tail=100
```

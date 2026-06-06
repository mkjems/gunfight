
# Gunfight

A web remake of the classic arcade game, that used to be the hottest thing in my local grill.

## Running with Docker or OrbStack

This app is packaged as one Node.js container. The server in `gameserver/server.js`
serves the static files from `www` and runs the Socket.IO game server.

Build and run locally:

```sh
docker compose up --build
```

Then open:

```text
http://localhost:8080
```

Run in the background:

```sh
docker compose up -d --build
```

Stop it:

```sh
docker compose down
```

Build a named image manually:

```sh
docker build -t gunfight:local .
```

Run that image manually:

```sh
docker run --rm -p 8080:8080 -e PORT=8080 gunfight:local
```

For a real host, build and push the image to a registry, then run the same image
on the server:

```sh
docker build -t ghcr.io/YOUR_USER/gunfight:latest .
docker push ghcr.io/YOUR_USER/gunfight:latest
```

On the host:

```sh
docker run -d \
  --name gunfight \
  --restart unless-stopped \
  -p 80:8080 \
  -e PORT=8080 \
  ghcr.io/YOUR_USER/gunfight:latest
```

If the host already has a reverse proxy such as Caddy, nginx, or Traefik, keep
the container on port `8080` internally and let the proxy handle HTTPS and the
public domain.

## How It Works

The server serves the web client, assigns player IDs, tracks ready state, chooses
the current scenario from `gameserver/scenarios.json`, and relays Socket.IO
input events between browsers.

Each browser applies local input immediately, applies remote input when it
arrives, runs the local game loop, moves everything by elapsed time, checks hits,
draws the scenario, and draws the frame.



apt update

apt install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

. /etc/os-release
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  ${UBUNTU_CODENAME:-$VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

  apt update

  apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

docker --version
docker compose version

mkdir -p /opt/gunfight
cd /opt/gunfight


## create /opt/gunfight/compose.yaml
## services:
##   gunfight:
##     image: ghcr.io/mkjems/gunfight:latest
##     environment:
##       PORT: 8080
##       NODE_ENV: production
##     ports:
##       - "127.0.0.1:8080:8080"
##     restart: unless-stopped
##
## Caddy handles public HTTP/HTTPS and proxies to the container:
##
## /etc/caddy/Caddyfile
## gunfight.mkjems.dk {
##     reverse_proxy 127.0.0.1:8080
## }


echo YOUR_READ_ONLY_GHCR_TOKEN | docker login ghcr.io -u mkjems --password-stdin

docker compose pull

docker compose up -d

docker compose ps

docker compose logs -f

# push to master
-> GitHub Actions builds image
-> pushes image to GHCR
-> GitHub Actions SSHes into VPS
-> VPS pulls latest image
-> VPS restarts app with docker compose up -d


# SSH into VPS
cd /opt/gunfight
docker compose pull
docker compose up -d
docker image prune -f
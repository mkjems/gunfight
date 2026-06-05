

echo $GITHUB_TOKEN | docker login ghcr.io -u mkjems --password-stdin

docker push ghcr.io/mkjems/gunfight:latest
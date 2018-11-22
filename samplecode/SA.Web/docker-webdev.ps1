# --- constants --- #
$PORT = "4200"
$PORTMAPPING = "$($PORT):4200"
$IMAGE = "softaware/webdev:debian-8.9.4"
$CONTAINERNAME = "sa-webdev"

docker container run -it --rm -p $PORTMAPPING -v ${pwd}:/usr/src/app $IMAGE
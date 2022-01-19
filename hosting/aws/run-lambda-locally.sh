#!/bin/bash

DIR="$( cd "$(dirname "$0")" ; pwd -P )"
cd $DIR
if [[ ! -d ~/.aws-lambda-rie ]]; then
  mkdir -p ~/.aws-lambda-rie && \
  curl -Lo ~/.aws-lambda-rie/aws-lambda-rie \
    https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie && \
  chmod +x ~/.aws-lambda-rie/aws-lambda-rie               

fi

#DOCKER_ID=$(docker run -p 8888:8888 -d -v ~/.aws-lambda-rie:/aws-lambda -p 9000:8080 \
  #--env-file ./.env \
  #--entrypoint /aws-lambda/aws-lambda-rie budibase-server-lambda:1.13.2 /usr/bin/npx aws-lambda-ric  /function/packages/server/dist/lambda.handler
 #)
DOCKER_ID=$(docker run -p 8888:8888 -d -v ~/.aws-lambda-rie:/aws-lambda -p 9000:8080 \
  --env-file ./.env  budibase-server-lambda:1.13.2  dist/lambda.handler
 )
#  --entrypoint /aws-lambda/aws-lambda-rie pontusvisiongdpr/pontus-extract-spacy-lambda:1.13.2  /var/lang/bin/python3 -m awslambdaric  app.handler )

echo docker logs -f ${DOCKER_ID}
echo docker rm -f ${DOCKER_ID}


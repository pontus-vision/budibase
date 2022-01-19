#!/bin/bash

export TAG=${TAG:-1.13.2}
set -e 
DIR="$( cd "$(dirname "$0")" ; pwd -P )"

export DOLLAR='$'
#cat $DIR/Dockerfile.template | envsubst > $DIR/Dockerfile
cd $DIR/../..

docker build --progress=plain -f $DIR/Dockerfile.lambda.base --rm=true  . -t budibase-lambda-base
docker build --progress=plain -f $DIR/Dockerfile.lambda.build --rm=true  . -t budibase-lambda-build

if [[ ! -z $FORMITI_DEV_ACCOUNT ]]; then
  echo 'logging into AWS'
  if [[ $(aws --version 2>&1 ) == "aws-cli/1"* ]] ; then
    $(aws ecr get-login --no-include-email --region eu-west-2)
  else
    aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin ${FORMITI_DEV_ACCOUNT}.dkr.ecr.eu-west-2.amazonaws.com
  fi
  echo 'starting build'

  docker build --progress=plain -f $DIR/Dockerfile.lambda --rm=true  . -t budibase-server-lambda:${TAG}
  docker tag budibase-server-lambda:${TAG} ${FORMITI_DEV_ACCOUNT}.dkr.ecr.eu-west-2.amazonaws.com/budibase-server-lambda:${TAG}
  docker push ${FORMITI_DEV_ACCOUNT}.dkr.ecr.eu-west-2.amazonaws.com/budibase-server-lambda:${TAG}
  IMAGE_SHA=$(aws ecr describe-images --repository-name budibase-server-lambda --image-ids imageTag=${TAG} | jq -r '.imageDetails[0].imageDigest')
  echo IMAGE SHA = $IMAGE_SHA
  aws lambda update-function-code --function-name budibase-server-lambda  --image-uri ${FORMITI_DEV_ACCOUNT}.dkr.ecr.eu-west-2.amazonaws.com/budibase-server-lambda@${IMAGE_SHA}
  aws lambda update-function-code --function-name budibase-worker-lambda  --image-uri ${FORMITI_DEV_ACCOUNT}.dkr.ecr.eu-west-2.amazonaws.com/budibase-server-lambda@${IMAGE_SHA}

fi



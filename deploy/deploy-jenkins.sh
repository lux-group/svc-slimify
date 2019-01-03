#!/bin/bash -e

. ~/.nvm/nvm.sh
nvm install
nvm use

yarn install --production

CURRENT_DIR="`dirname \"$0\"`"
CURRENT_DIR="`( cd \"$CURRENT_DIR\" && pwd )`"
ROOT_DIR=$CURRENT_DIR/..

ENVIRONMENT=$1

echo "Environment: ${ENVIRONMENT}"

if [ ! ${ENVIRONMENT} ]; then echo "Must supply an environment as the first argument"; exit; fi

CONFIG_FILE="${ROOT_DIR}/deploy/${ENVIRONMENT}-up.json"

echo "Config File: ${CONFIG_FILE}"

if [ ! -f ${CONFIG_FILE} ]; then echo "DEPLOYMENT_FAILURE: No config file found for Environment=${ENVIRONMENT}"; exit; fi

cp ${CONFIG_FILE} ${ROOT_DIR}/up.json

echo "Deploying svc-slimify to ${ENVIRONMENT}"

# Production in the context of up, is not the same as our LE environments
# it maps to the api gateway stage
# we have an api gateway for each environment so we just deploy to the production stage for each gateway
up deploy production

echo "Deployed"

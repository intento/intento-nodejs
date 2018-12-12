#!/usr/bin/env bash

export $(cat .env)

echo "List providers"
node index.js --key=$INTENTO_API_KEY \
    --intent=ai.image.tagging.providers


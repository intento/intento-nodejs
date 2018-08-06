#!/usr/bin/env bash

export $(cat .env)

echo "List sentiment providers"
node index.js --key=$INTENTO_API_KEY \
    --intent=sentiment.providers

#!/usr/bin/env bash

export $(cat .env)

echo "List providers"
node index.js --key=$INTENTO_API_KEY \
    --intent=ai.image.ocr.providers

echo "A description of one of providers"
node index.js --key=$INTENTO_API_KEY \
    --intent=ai.image.ocr.provider \
    --responseMapper=shortProviderInfoResponse \
    --id=ai.image.ocr.microsoft.vision_api.1-0

echo "List auth data for providers"
node index.js --key=$INTENTO_API_KEY \
    --intent=ai.image.ocr.providers \
    --responseMapper=authDetails \
    --own_auth \
    --fields=auth

#!/usr/bin/env bash

export $(cat .env)

echo "Translate with own google key"
node index.js --key=$INTENTO_API_KEY \
    --to=es \
    --provider=ai.text.translate.google.translate_api.2-0 \
    --auth="{\"key\": \"$YOUR_GOOGLE_APIKEY\" }" \
    "During simulation, genotypes induce patterns of subsystem activities"

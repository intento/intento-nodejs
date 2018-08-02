#!/usr/bin/env bash

export $(cat .env)

echo "List translation providers able to translate to Russian and supporting both bulk mode and language detection"
node index.js --key=$INTENTO_API_KEY \
    --intent=translate.providers \
    --to=ru \
    --bulk \
    --lang_detect

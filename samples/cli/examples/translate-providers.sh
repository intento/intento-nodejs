#!/usr/bin/env bash

export $(cat .env)

echo "List translation providers able to translate to Russian and supporting both bulk mode and language detection"
node index.js --key=$INTENTO_API_KEY \
    --intent=translate.providers \
    --to=ru \
    --bulk \
    --lang_detect

echo "A description of one of providers"
node index.js --key=$INTENTO_API_KEY \
    --intent=translate.providers \
    --responseMapper=shortProviderInfoResponse \
    --id=ai.text.translate.amazon.translate

echo "A description of one of providers, separate intent"
node index.js --key=$INTENTO_API_KEY \
    --intent=ai.text.translate.provider \
    --responseMapper=shortProviderInfoResponse \
    --id=ai.text.translate.ibm-language-translator

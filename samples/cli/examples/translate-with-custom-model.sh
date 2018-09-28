#!/usr/bin/env bash

export $(cat .env)

echo "Translate with a commonly used custom model."
node index.js --key=$INTENTO_API_KEY \
    --from=en \
    --to=pt \
    --category=tech \
    --provider=ai.text.translate.microsoft.translator_text_api.2-0 \
    "Genetics and epigenetics are important for this"

echo "Translate with your own custom model."
node index.js --key=$INTENTO_API_KEY \
    --from=en \
    --to=pt \
    --category=$MS_CUSTOM_MODEL_NAME \
    --provider=ai.text.translate.microsoft.translator_text_api.2-0 \
    --auth="{\"key\": \"$YOUR_MICROSOFT_APIKEY\" }" \
    "Genetics and epigenetics are important for this"

echo "Translate a big file with your own custom model."
node index.js --key=$INTENTO_API_KEY \
    --async \
    --bulk \
    --from=ru \
    --to=es \
    --category=$MS_CUSTOM_MODEL_NAME \
    --provider=ai.text.translate.microsoft.translator_text_api.2-0 \
    --auth="{\"key\": \"$YOUR_MICROSOFT_APIKEY\" }" \
    --input=examples/war-and-peace.txt \
    --output=examples/war-and-peace-es.txt

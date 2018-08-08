#!/usr/bin/env bash

export $(cat .env)

echo "Translate with own google key"
node index.js --key=$INTENTO_API_KEY \
    --to=es \
    --provider=ai.text.translate.google.translate_api.2-0 \
    --auth="{\"key\": \"$YOUR_GOOGLE_APIKEY\" }" \
    "During simulation, genotypes induce patterns of subsystem activities"

echo "list delegated credentials"
node index.js --key=$INTENTO_API_KEY \
    --curl \
    --intent=credentials.list

echo "do delegate credentials from a file"
node index.js --key=$INTENTO_API_KEY \
    --curl \
    --credential_id=my_creds \
    --credential_type=google_service_account \
    --secret_credentials_file=examples/secrets.json \
    --intent=credentials.add

echo "remove a delegated credentials"
node index.js --key=$INTENTO_API_KEY \
    --curl \
    --credential_id=my_creds \
    --intent=credentials.remove

#!/usr/bin/env bash

export $(cat .env)

echo "list delegated credentials"
node index.js --key=$INTENTO_API_KEY \
    --intent=credentials.list

echo "do delegate credentials from a file"
node index.js --key=$INTENTO_API_KEY \
    --credential_id=my_creds \
    --credential_type=google_service_account \
    --secret_credentials_file=examples/secrets.json \
    --intent=credentials.add

echo "remove a delegated credentials"
node index.js --key=$INTENTO_API_KEY \
    --credential_id=my_creds \
    --intent=credentials.remove

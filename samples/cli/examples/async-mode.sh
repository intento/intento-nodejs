#!/usr/bin/env bash

export $(cat .env)

echo "Async mode"
node index.js --key=$INTENTO_API_KEY \
    --async \
    --from=en \
    --to=de \
    --provider=ai.text.translate.modernmt.enterprise \
    --input=examples/for-async.txt

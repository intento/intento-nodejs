#!/usr/bin/env bash

export $(cat .env)

echo "Async mode example"
node index.js --key=$INTENTO_API_KEY \
    --async \
    --from=en \
    --to=fr \
    --output=examples/for-async-fr.txt \
    --provider=ai.text.translate.modernmt.enterprise \
    --input=examples/for-async.txt

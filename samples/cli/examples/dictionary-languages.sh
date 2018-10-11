#!/usr/bin/env bash

export $(cat .env)

echo "List available languages"
node index.js --key=$INTENTO_API_KEY \
    --intent=ai.text.dictionary.languages

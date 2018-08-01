#!/bin/bash

export $(cat .env)

delta=$(expr 30 \* 60 \* 60 \* 24) # 30 days 24h
to=$(date -u +%s)
from=$(expr $to - $delta)

echo "Usage stat intents default interval till now, one-day buckets"
node index.js --key=$INTENTO_API_KEY \
    --bucket=1d \
    --items=10 \
	--usage

echo "Usage stat for providers default interval till now, one-day buckets"
node index.js --key=$INTENTO_API_KEY \
	--usage \
    --viewpoint=provider

echo "Usage stat for involved providers and intents"
node index.js --key=$INTENTO_API_KEY \
    --curl \
	--usage \
    --fields=provider \
    --fields=intent \
    --viewpoint=distinct

echo "Usage stat from $from to $to filtered by intent and providers"
node index.js --key=$INTENTO_API_KEY \
    --to=$to \
    --from=$from \
    --bucket=1d \
    --intent=ai.text.translate \
    --provider=ai.text.translate.systran.translation_api.1-0-0 \
    --provider=ai.text.translate.yandex.translate_api.1-5 \
	--usage

#!/bin/bash

export $(cat .env)

echo "Bulk mode with multiline text segment"
node index.js --key=$INTENTO_API_KEY \
    --bulk \
    --to=es \
    """
During simulation
genotypes induce patterns of subsystem activities
"""

echo "Bulk mode with text from a file & async mode"
node index.js --key=$INTENTO_API_KEY \
    --async \
    --bulk \
    --from=ru \
    --to=es \
    --provider=ai.text.translate.promt.cloud_api.1-0 \
    --input=examples/war-and-peace.txt

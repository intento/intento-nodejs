#!/bin/bash

export $(cat .env)

echo "Content processing rule descriptions"
node index.js --key=$INTENTO_API_KEY \
	--intent=settings/processing-rules

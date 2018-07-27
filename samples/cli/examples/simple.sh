#!/bin/bash

export $(cat .env)

echo "A simple example for translating a string to Spanish"
node index.js --key=$INTENTO_API_KEY \
	--to=es \
    "During simulation, genotypes induce patterns of subsystem activities"

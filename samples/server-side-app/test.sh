#!/bin/bash

export $(cat .env)
node ai.text.translate.js
node explore-providers.js
node ai.text.dictionary.js
node ai.text.sentiment.js
node readme-examples.js
node translate.md-examples.js
# Intento nodejs

An adapter to query Intento Collective Intelligence API.

To get more information check out [the site](https://inten.to/).

[API User Manual](https://github.com/intento/intento-api)

In case you don't have a key to use Intento API, please register here [console.inten.to](https://console.inten.to)

<!-- TOC depthFrom:2 -->

- [Installation](#installation)
- [Basic usage](#basic-usage)
    - [Translation](#translation)
    - [Sentiment analysys](#sentiment-analysys)
    - [Text meanings](#text-meanings)
- [Advanced Examples](#advanced-examples)
    - [Dynamic parameters](#dynamic-parameters)
    - [Using `data` argument from a curl request directly](#using-data-argument-from-a-curl-request-directly)
    - [More](#more)
- [How to pass your API keys to your environment](#how-to-pass-your-api-keys-to-your-environment)
    - [zero option (dev only)](#zero-option-dev-only)
    - [1st option](#1st-option)
    - [2nd option](#2nd-option)
    - [3rd option](#3rd-option)

<!-- /TOC -->

## Installation

```bash
npm install intento-nodejs
```

or

```bash
yarn add intento-nodejs
```

## Basic usage

Initialise the client

```js
const IntentoConnector = require('./src/index')
const client = new IntentoConnector({ apikey: YOUR_INTENTO_KEY })
```

### Translation

Simple translate text `text` to language `to`:

    - source language will be detected automatically
    - provider for the translation will be smart-selected based on the [Smart routing feature](https://github.com/intento/intento-api#smart-routing)

```js
client.ai.text.translate
    .fulfill({ text: "How's it going?", to: 'es' })
    .then(data => {
        console.log('Translation results:\n', data, '\n\n')
    })
```

### Sentiment analysys

Analyze text for sentiments. More on that in the [documentation](https://github.com/intento/intento-api/blob/master/ai.text.sentiment.md#basic-usage)

```js
client.ai.text.sentiment
    .fulfill({
        text: 'We love this place',
        lang: 'en',
        provider: 'ai.text.sentiment.ibm.natural_language_understanding',
    })
    .then(data => {
        console.log('Sentiment analysys results:\n', data, '\n\n')
    })
```

### Text meanings

[Dictionary intent](https://github.com/intento/intento-api/blob/master/ai.text.dictionary.md)

```js
client.ai.text.dictionary
    .fulfill({
        text: 'meaning',
        from: 'en',
        to: 'ru',
    })
    .then(data => {
        console.log('Results:\n', JSON.stringify(data, null, 4), '\n')
    })
```

## Advanced Examples

### Dynamic parameters

Describe `data` dynamicly through `content`

For example we'd like to translate the same text for different languages.
One can make similar requests for each language like this:

```js
const IntentoConnector = require('intento-nodejs')
const client = new IntentoConnector({ apikey: process.env.INTENTO_API_KEY })

const options = {
    path: '/ai/text/translate',
    method: 'POST',
    // content: ...
}

['es', 'ru', 'da'].forEach(lang => {
    client
        .makeRequest({
            ...options, // path, method
            content: {
                context: {
                    text: 'A sample text',
                    to: lang,
                },
            },
        })
        .then(console.info)
        .catch(console.error)
})
```

So you can pass a plain javascript object as a `content` parameter.

### Using `data` argument from a curl request directly

One can pass request parameters as raw json specified as a `data` parameter.
Make sure your json is valid. For example one can validate json online here https://jsonformatter.curiousconcept.com/

For a `curl` instruction from [the docs](https://github.com/intento/intento-api)

```bash
curl -XPOST -H 'apikey: YOUR_API_KEY' 'https://api.inten.to/ai/text/translate' -d '{
    "context": {
        "text": "Validation is the king",
        "to": "es"
    },
    "service": {
        "provider": "ai.text.translate.microsoft.translator_text_api.2-0"
    }
}'
```

run following:

```js
const IntentoConnector = require('intento-nodejs')
const client = new IntentoConnector({ apikey: process.env.INTENTO_API_KEY })

client
    .makeRequest({
        path: '/ai/text/translate',
        method: 'POST',
        data: `{
            "context": {
                "text": "Validation is the king",
                "to": "es"
            },
            "service": {
                "provider": "ai.text.translate.microsoft.translator_text_api.2-0"
            }
        }`,
    })
    .then(console.info)
    .catch(console.error)
```

### More

To get more examples:

```bash
git clone git@github.com:intento/intento-nodejs.git
cd intento-nodejs
INTENTO_API_KEY=YOUR_SECRET_KEY node example.js
```

Though for the latter you need to have `INTENTO_API_KEY` in your environment.

## How to pass your API keys to your environment

### zero option (dev only)

Hardcode your keys in the script your are experimenting with :)

### 1st option

For Unix-like machines run:

```bash
INTENTO_API_KEY=YOUR_SECRET_KEY GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY node example.js
```

For Windows machines run:

```bash
SET INTENTO_API_KEY=YOUR_SECRET_KEY GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY node example.js
```

### 2nd option

Assuming your are in `intento-nodejs` folder run:

```bash
cp .env.example .env
```

Then edit `.env`, **put your api keys there**.

Make that environmental variables available in the current context

```bash
export $(cat .env) # once per terminal
```

Run `example.js` script

```bash
node example.js
```

### 3rd option

Use your favorite "env" package like `dotenv` or `node-env-file`.

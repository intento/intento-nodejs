# Intento nodejs

An adapter to query Intento Collective Intelligence API.

To get more information check out [the site](https://inten.to/).

[API User Manual](https://github.com/intento/intento-api)

In case you don't have a key to use Intento API, please register here [console.inten.to](https://console.inten.to)

<!-- TOC depthFrom:2 -->

- [Installation](#installation)
- [Basic usage](#basic-usage)
    - [Translation](#translation)
    - [Sentiment analysis](#sentiment-analysis)
    - [Text meanings](#text-meanings)
- [Explore providers (basics)](#explore-providers-basics)
    - [Response structure](#response-structure)
    - [List all available providers](#list-all-available-providers)
        - [Translation providers](#translation-providers)
        - [Sentiment analysis providers](#sentiment-analysis-providers)
        - [Text meanings providers](#text-meanings-providers)
- [Translation capabilities](#translation-capabilities)
- [Sentiment analysis capabilities](#sentiment-analysis-capabilities)
- [Text meanings capabilities (dictionary)](#text-meanings-capabilities-dictionary)
- [Smart routing](#smart-routing)
    - [Basic smart routing](#basic-smart-routing)
    - [Specifying the bidding strategy](#specifying-the-bidding-strategy)
- [Failover mode](#failover-mode)
- [Using a service provider with your own keys](#using-a-service-provider-with-your-own-keys)
- [Advanced Examples](#advanced-examples)
    - [Dynamic parameters](#dynamic-parameters)
    - [Using `data` argument from a curl request directly](#using-data-argument-from-a-curl-request-directly)
    - [More examples](#more-examples)
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

This is an intent to translate text from one language to another.

More on that in the [documentation](https://github.com/intento/intento-api/blob/master/ai.text.translate.md)

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

### Sentiment analysis

This is an intent to analyze the sentiment of the provided text.

More on that in the [documentation](https://github.com/intento/intento-api/blob/master/ai.text.sentiment.md)

```js
client.ai.text.sentiment
    .fulfill({
        text: 'We love this place',
        lang: 'en',
        provider: 'ai.text.sentiment.ibm.natural_language_understanding',
    })
    .then(data => {
        console.log('Sentiment analysis results:\n', data, '\n\n')
    })
```

### Text meanings

This is an intent to get meanings of text in selected language.

[Dictionary intent](https://github.com/intento/intento-api/blob/master/ai.text.dictionary.md)

```js
client.ai.text.dictionary
    .fulfill({
        text: 'meaning',
        from: 'en',
        to: 'ru',
    })
    .then(data => {
        console.log('Dictionary results:\n', JSON.stringify(data, null, 4), '\n')
    })
```

## Explore providers (basics)

### Response structure

In all cases a response object is a list of objects. Each object in that list describes one provider. The structure of the description is following:

```js
{
    id: 'provider.id',
    name: 'Provider Name',
    score: 0,
    price: 0,
    symmetric: [...],
    pairs: [...],
}
```

`symmetric` - is a list of language codes for which translation in both directions is available.

`pairs` - is a list of plain objects with structure `{ from: 'lang-code-1', to: 'lang-code-2' }`. It means that for current provider translation from `lang-code-1` to `lang-code-2` is available.

### List all available providers

#### Translation providers

```js
client.ai.text.translate
    .providers()
    .then(data => data.forEach(p => console.info(p.name)))
    .catch(console.error)
```

#### Sentiment analysis providers

```js
client.ai.text.sentiment
    .providers()
    .then(data => data.forEach(p => console.info(p.name)))
    .catch(console.error)
```

#### Text meanings providers

```js
client.ai.text.dictionary
    .providers()
    .then(data => data.forEach(p => console.info(p.name)))
    .catch(console.error)
```

## Translation capabilities

More information in [ai.text.translate.md](./ai.text.translate.md)

## Sentiment analysis capabilities

More information in [ai.text.sentiment.md](./ai.text.sentiment.md)

## Text meanings capabilities (dictionary)

More information in [ai.text.dictionary.md](./ai.text.dictionary.md)

## Smart routing

Intento provides the smart routing feature, so that the translation request is automatically routed to the best provider. The best provider is determined based on the following information:

- apriori benchmark on the standard dataset
- provider usage statistics, collected by Intento, including user feedback signals (the post-editing complexity for Machine Translation).

### Basic smart routing

To use the smart routing, just omit the `provider` parameter:

```js
client.ai.text.translate
    .fulfill({
        text: 'A sample text',
        to: 'es'
    })
    .then(console.log)
```

Response:

```json
{
    "results": [
        "Un texto de ejemplo"
    ],
    "meta": {},
    "service": {
        "provider": {
            "id": "ai.text.translate.microsoft.translator_text_api.2-0",
            "name": "Microsoft Translator API"
        }
    }
}
```

### Specifying the bidding strategy

By default, when the provider is missing, requests are routed to a provider with the best expected price/performance ratio. This behavior may be controlled by specifying the desired bidding strategy in the `bidding` parameter. Supported values are:

- `best` (default)
- `best_quality` - the best expected quality regardless of the price
- `best_price` - the cheapest provider
- `random` - a randomly chosen provider

```js
client.ai.text.translate
    .fulfill({
        text: 'A sample text',
        to: 'es',
        bidding: 'best_quality',
    })
    .then(console.log)
```

## Failover mode

Both for smart routing mode and basic mode, a failover is supported. By default, the failover is off, thus when the selected provider fails, an error is returned. To enable the failover mode, set the `failover` to `true`. By default, failover is governed by the default bidding strategy (`best`). To control this behavior, another bidding strategy may be specified via `bidding` parameter. Alternatively, you may specify a list of providers to consider for the failover (`failover_list`). This option overrides the bidding strategy for the failover procedure.

In the following example we set the provider, but specify the list of alternatives to control the failover:

```js
client.ai.text.translate
    .fulfill({
        text: 'A sample text',
        to: 'es',
        provider: 'ai.text.translate.microsoft.translator_text_api.2-0',
        failover: true,
        failover_list: [
            'ai.text.translate.google.translate_api.2-0',
            'ai.text.translate.yandex.translate_api.1-5'
        ]
    })
    .then(console.log)
```

## Using a service provider with your own keys

Intento supports two modes of using 3rd party services:

- full proxy: 3rd party service used via Intento and paid to the Intento (available for some of the services).
- tech proxy: 3rd party service used via our user's own credentials and billed towards the user's account at the third-party service (available for all services).

In the tech proxy mode, the custom credentials are passed in the `auth` service field. `auth` field is a dictionary, it's keys are provider IDs. For each ID specify your own key(s) you want to use and values set to a list of keys for the specified provider. There could be more than one key for the provider in the case you want to work with a pool of keys (more on this advanced feature later).

```js
client.ai.text.translate
    .fullfill({
        text: "A sample text",
        to: 'es',
        provider: 'some-provider-id',
        auth: {
            'some-provider-id': [
                { ... custom auth structure with 'YOUR_KEY_TO_SOME_PROVIDER_1' ... },
                { ... custom auth structure with 'YOUR_KEY_TO_SOME_PROVIDER_2' ... },
            ],
            'another-provider-id': [
                { ... another custom auth structure with 'YOUR_KEY_TO_ANOTHER_PROVIDER_1' ... },
                { ... another custom auth structure with 'YOUR_KEY_TO_ANOTHER_PROVIDER_2' ... },
            ]

    })
    .then(console.log)
```

Auth object structure is different for different providers and may be obtained together with other provider details by requesting info for this provider:

```js
client.ai.text.translate
    .provider('ai.text.translate.google.translate_api.2-0')
    .then(console.log)
    .catch(console.error)
```

For example for google translate custom auth structure is `{ key: YOUR_GOOGLE_KEY }`.

```js
client.ai.text.translate
    .fullfill({
        text: "A sample text",
        to: 'es',
        provider: 'ai.text.translate.google.translate_api.2-0',
        auth: {
            'ai.text.translate.google.translate_api.2-0': [
                {
                    key: process.env.YOUR_GOOGLE_KEY
                }
            ]
        }
    })
    .then(console.log)
```

Response:

```json
{
    "results": [
        "Un texto de muestra"
    ],
    "meta": {
        "detected_source_language": [
            "en"
        ]
    },
    "service": {
        "provider": {
            "id": "ai.text.translate.google.translate_api.2-0",
            "name": "Google Cloud Translation API"
        }
    }
}
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
Make sure your json is valid. For example one can [validate json online](https://jsonformatter.curiousconcept.com/)

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

### More examples

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

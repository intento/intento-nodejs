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
- [Translation features](#translation-features)
    - [Language detection mode](#language-detection-mode)
    - [Bulk mode](#bulk-mode)
    - [Translation domains (`category`)](#translation-domains-category)
- [Explore translation providers](#explore-translation-providers)
    - [Filter providers by available features](#filter-providers-by-available-features)
        - [Providers with language detect feature](#providers-with-language-detect-feature)
        - [Provider supporting bulk translation](#provider-supporting-bulk-translation)
        - [Providers able to translate to Afrikaans](#providers-able-to-translate-to-afrikaans)
        - [Combine filters](#combine-filters)
    - [Getting information about a provider](#getting-information-about-a-provider)
    - [Supported languages](#supported-languages)
        - [List of supported languages](#list-of-supported-languages)
        - [Full information on a supported language](#full-information-on-a-supported-language)
    - [Setting your own language codes](#setting-your-own-language-codes)
    - [All language settings](#all-language-settings)
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

Analyze text for sentiments. More on that in the [documentation](https://github.com/intento/intento-api/blob/master/ai.text.sentiment.md#basic-usage)

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

## Translation features

### Language detection mode

This mode is used when `from` parameter is omitted.
In that case providers which allow automatic source language detection will be used. The results of the detection will be returned.

```js
client.ai.text.translate
    .fulfill({ text: "How's it going?", to: 'es' })
    .then(console.log)
```

The response contains the translated text, service information and meta information (i.e. detected language):

```json
{
    "results": [
        "¿Cómo te va?"
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

Depending on the provider, the result may contain either a single value (detected language for all the translated sentences) or an array of values (detected language for each of the translated sentences).

### Bulk mode

We provide a bulk fulfillment mode to translate an array of segments at once. The mode is activated by sending an array of strings to the `text` parameter. The bulk mode is supported for most of the providers.

```js
client.ai.text.translate
    .fulfill({
        text: ['A sample text', 'Hello world'],
        from: 'en',
        to: 'es',
    })
    .then(console.log)
```

The response contains the translated texts and a service information on which provider was used:

```json
{
    "results": [
        "Ein Beispieltext",
        "Hallo Welt"
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

### Translation domains (`category`)

Currently only Microsoft Translation Text API supports this feature.
In the case of that provider the domains feature supports choice between _Statistical Machine Translation_ (`category: 'generalnn`) and _Neural Machine Translation_ (`category: 'general`). For Microsoft Translation, the default mode is _NMT_ - `category: 'generalnn'`.

Compare the output.

category **general**:

```js
client.ai.text.translate
    .fulfill({
        text: 'A sample text',
        to: 'es',
        category: 'general', // <-- specify a domain
        provider: 'ai.text.translate.microsoft.translator_text_api.2-0',
    })
    .then(console.log)
```

Response:

```sh
{
    "results": [
        "Un texto de muestra"
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

category **generalnn**:

```js
client.ai.text.translate
    .fulfill({
        text: 'A sample text',
        to: 'es',
        category: 'generalnn', // <-- specify a domain
        provider: 'ai.text.translate.microsoft.translator_text_api.2-0',
    })
    .then(console.log)
```

Response:

```sh
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

## Explore translation providers

Response structure is the same for all requests dealing with providers

List all providers as mentioned [above](#translation-providers)

```js
client.ai.text.translate
    .providers()
    .then(data => data.forEach(p => console.info(p.name)))
```

### Filter providers by available features

#### Providers with language detect feature

```js
client.ai.text.translate
    .providers({ lang_detect: true })
    .then(data => data.forEach(p => console.info(p.name)))
```

#### Provider supporting bulk translation

```js
client.ai.text.translate
    .providers({ bulk: true })
    .then(data => data.forEach(p => console.info(p.name)))
```

#### Providers able to translate to Afrikaans

See more on ([language codes](http://www.loc.gov/standards/iso639-2/php/code_list.php) -- see ISO 639-1 Code)

```js
client.ai.text.translate
    .providers({ to: 'af' })
    .then(data => data.forEach(p => console.info(p.name)))
```

#### Combine filters

Retrieve providers able to translate to Italian an array of segments at once detecting source language:

```js
client.ai.text.translate
    .providers({ to: 'it', bulk: true, lang_detect: true })
    .then(data => data.forEach(p => console.info(p.name)))
```

### Getting information about a provider

To get information about a provider pass provider id to `client.ai.text.translate.provider`.

```js
client.ai.text.translate
    .provider('ai.text.translate.google.translate_api.2-0')
    .then(console.log)
```

The response contains a list of the metadata fields and values available for the provider:

```json
{
    "id": "ai.text.translate.google.translate_api.2-0",
    "name": "Google Cloud Translation API",
    "logo": "https://inten.to/img/api/ggl_translate.png",
    "billing": true,
    "bulk": true,
    "languages": {
        "symmetric": [
            "gu",
            "gd",
            "ga",
            "gl",
            "lb"
        ],
        "pairs": [
            [
                [
                    "en",
                    "de"
                ],
                [
                    "fr",
                    "en"
                ]
            ]
        ]
    }
}
```

### Supported languages

#### List of supported languages

Will return an array of supported languages, for each language:

- iso name
- localized name (if `locale` parameter is provided); if there is no localized name, `null` is returned
- intento code
- client code (if the client calling the method has its own codes)

```js
client.ai.text.translate
    .languages({ locale: 'ru' })
    .then(console.log)
```

```json
[
    {
        "iso_name": "Hebrew (modern)",
        "name": "иврит",
        "intento_code": "he",
        "client_code": "hebr"
    }
]
```

#### Full information on a supported language

For a given language code (intento internal or client’s) will show full metadata:

- iso name
- localized name (if `locale` parameter is provided); if there is no localized name, `null` is returned
- intento code
- iso codes (ones which are applicable)
- providers’ codes (which map to this internal code)
- client code (if the client calling the method has its own codes)

```js
client.ai.text.translate
    .languages({ language: 'he', locale: 'ru' })
    .then(console.log)
```

Response:

```json
{
    "iso_name": "Hebrew (modern)",
    "name": "иврит",
    "intento_code": "he",
    "iso_639_1_code": "he",
    "iso_639_2t_code": "heb",
    "iso_639_2b_code": "heb",
    "iso_639_3_code": "heb",
    "provider_codes": {
        "ai.text.translate.google.translate_api.2-0": "iw"
    },
    "client_code": "hebr"
}
```

### Setting your own language codes

To define your aliases to language codes call `client.ai.settings.languages`. After 60 seconds, you can start using them.

```js
client.ai.settings
    .languages({ aliasforen: 'en' })
    .then(console.log)
```

Response:

```json
{
    "aliasforen": "en"
}
```

### All language settings

Settings can be retrieved by calling `client.ai.settings.languages` without parameters

```js
client.ai.settings
    .languages()
    .then(console.log)
```

Response:

```json
{
    "aliasforen": "en"
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

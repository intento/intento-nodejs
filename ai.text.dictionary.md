# Text meanings features

This is an intent to get meanings of text in selected language.

More on that in the [documentation](https://github.com/intento/intento-api/blob/master/ai.text.dictionary.md)

<!-- TOC depthFrom:2 -->

- [Basic usage](#basic-usage)
- [Explore dictionary providers](#explore-dictionary-providers)
    - [Response structure for provider-related requests](#response-structure-for-provider-related-requests)
- [Filtering providers by capabilities](#filtering-providers-by-capabilities)
    - [Providers able to extract meanings from Afrikaans to Italian](#providers-able-to-extract-meanings-from-afrikaans-to-italian)
- [Getting information about a provider](#getting-information-about-a-provider)
- [Supported languages](#supported-languages)
    - [List of supported languages](#list-of-supported-languages)
    - [Full information on a supported language](#full-information-on-a-supported-language)
- [Setting your own language codes](#setting-your-own-language-codes)
- [All language settings](#all-language-settings)

<!-- /TOC -->

## Basic usage

To extract meanings from a text, specify the source text, source and target languages and the desired provider in JSON body of the request as in the following example:

```js
client.ai.text.dictionary
    .fulfill({
        text: 'kick',
        from: 'en',
        to: 'it',
        provider: 'ai.text.dictionary.yandex.dictionary_api.1-0',
    })
    .then(data => {
        console.log('Text meanings results:\n', data, '\n\n')
    })
```

The response contains the dictionary results grouped by part of speech and a service information:

```json
{
    "results": [
        {
            "noun": [
                "calcio"
            ],
            "verb": [
                "calciare"
            ]
        }
    ],
    "meta": {},
    "service": {
        "provider": {
            "id": "ai.text.dictionary.yandex.dictionary_api.1-0",
            "name": "Yandex Dictionary API"
        }
    }
}
```

If the provider doesn't have capabilities (e.g. language pairs) to process request, 413 error will be returned:

```json
{
    "error": {
        "code": 413,
        "message": "Provider ai.text.dictionary.yandex.dictionary_api.1-0 constraint(s) violated: from (Source language)"
    }
}
```

## Explore dictionary providers

List all providers:

```js
client.ai.text.dictionary
    .providers()
    .then(data => data.forEach(p => console.info(p.name)))
```

### Response structure for provider-related requests

In all cases a response object is a list of objects. Each object in that list describes one provider. The structure of the description is following:

```json
{
    "id": "provider-id",
    "name": "Provider Name",
    "logo": "https://url/to/logo.png",
    "auth": {
        "key": "YOUR_KEY"
    },
    "billing": true,
    "languages": {
        "symmetric": ["list", "of", "lang", "codes"],
        "pairs": [{"from": "en", "to": "es" }, { "from": "lang", "to": "another_lang" }]
    },
    "lang_detect": false,
    "bulk": false
}
```

`symmetric` - is a list of language codes for which text meanings extraction in both directions is available.

`pairs` - is a list of plain objects with structure `{ from: 'lang-code-1', to: 'lang-code-2' }`. It means that for current provider text meanings extaction from `lang-code-1` to `lang-code-2` is available.

## Filtering providers by capabilities

The list of providers may be further constrained by adding desired parameter values.

### Providers able to extract meanings from Afrikaans to Italian

See more on ([language codes](http://www.loc.gov/standards/iso639-2/php/code_list.php) -- see ISO 639-1 Code)

```js
client.ai.text.dictionary
    .providers({ from: 'af', to: 'it' })
    .then(data => data.forEach(p => console.info(p.name)))
```

## Getting information about a provider

To get information about a provider pass provider id to `client.ai.text.dictionary.provider`.

```js
client.ai.text.dictionary
    .provider('ai.text.dictionary.yandex.dictionary_api.1-0')
    .then(console.log)
```

The response contains a list of the metadata fields and values available for the provider:

```json
{
    "id": "ai.text.dictionary.yandex.dictionary_api.1-0",
    "name": "Yandex",
    "logo": "https://inten.to/static/img/api/ynd_dictionary.png",
    "billing": true,
    "languages": {
        "symmetric": [],
        "pairs": [
            {
                "from": "be",
                "to": "be"
            },
            {
                "from": "be",
                "to": "ru"
            },
            {
                "from": "bg",
                "to": "ru"
            },
            {
                "from": "cs",
                "to": "en"
            },
            {
                "from": "cs",
                "to": "ru"
            },
            {
                "from": "da",
                "to": "en"
            }
      ...
        ]
    }
}
```

## Supported languages

### List of supported languages

Will return an array of supported languages, for each language:

- iso name
- localized name (if `locale` parameter is provided); if there is no localized name, `null` is returned
- intento code
- client code (if the client calling the method has its own codes)

```js
client.ai.text.dictionary
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

### Full information on a supported language

For a given language code (intento internal or client’s) will show full metadata:

- iso name
- localized name (if `locale` parameter is provided); if there is no localized name, `null` is returned
- intento code
- iso codes (ones which are applicable)
- providers’ codes (which map to this internal code)
- client code (if the client calling the method has its own codes)

```js
client.ai.text.dictionary
    .languages({ language: 'he', locale: 'ru' })
    .then(console.log)
```

Response:

```json
{
    "iso_name": "Hebrew",
    "name": "иврит",
    "intento_code": "he",
    "iso_639_1_code": "he",
    "iso_639_2t_code": "heb",
    "iso_639_2b_code": "heb",
    "iso_639_3_code": "heb",
    "provider_codes": {},
    "client_code": "hebr"
}
```

## Setting your own language codes

To define your aliases to language codes call `client.settings.languages`. After 60 seconds, you can start using them.

```js
client.settings
    .languages({ aliasforen: 'en' })
    .then(console.log)
```

Response:

```json
{
    "aliasforen": "en"
}
```

## All language settings

Settings can be retrieved by calling `client.settings.languages` without parameters

```js
client.settings
    .languages()
    .then(console.log)
```

Response:

```json
{
    "aliasforen": "en"
}
```

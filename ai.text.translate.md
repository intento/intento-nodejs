# Translation features

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

<!-- TOC depthFrom:2 -->

- [Language detection mode](#language-detection-mode)
- [Bulk mode](#bulk-mode)
- [Translation domains (`category`)](#translation-domains-category)
- [Explore translation providers](#explore-translation-providers)
    - [Response structure for provider-related requests](#response-structure-for-provider-related-requests)
- [Filtering providers by capabilities](#filtering-providers-by-capabilities)
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

<!-- /TOC -->

## Language detection mode

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

## Bulk mode

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

## Translation domains (`category`)

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

List all providers:

```js
client.ai.text.translate
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
        "symmetric": [...],
        "pairs": [...]
    },
    "lang_detect": false,
    "bulk": false
}
```

`symmetric` - is a list of language codes for which translation in both directions is available.

`pairs` - is a list of plain objects with structure `{ from: 'lang-code-1', to: 'lang-code-2' }`. It means that for current provider translation from `lang-code-1` to `lang-code-2` is available.

## Filtering providers by capabilities

The list of providers may be further constrained by adding desired parameter values.

### Providers with language detect feature

```js
client.ai.text.translate
    .providers({ lang_detect: true })
    .then(data => data.forEach(p => console.info(p.name)))
```

### Provider supporting bulk translation

```js
client.ai.text.translate
    .providers({ bulk: true })
    .then(data => data.forEach(p => console.info(p.name)))
```

### Providers able to translate to Afrikaans

See more on ([language codes](http://www.loc.gov/standards/iso639-2/php/code_list.php) -- see ISO 639-1 Code)

```js
client.ai.text.translate
    .providers({ to: 'af' })
    .then(data => data.forEach(p => console.info(p.name)))
```

### Combine filters

Retrieve providers able to translate to Italian an array of segments at once detecting source language:

```js
client.ai.text.translate
    .providers({ to: 'it', bulk: true, lang_detect: true })
    .then(data => data.forEach(p => console.info(p.name)))
```

## Getting information about a provider

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

## Supported languages

### List of supported languages

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

### Full information on a supported language

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

## Setting your own language codes

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

## All language settings

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

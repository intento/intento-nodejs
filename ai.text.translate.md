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
- [Supported input formats](#supported-input-formats)
- [Content processing](#content-processing)
- [Explore translation providers](#explore-translation-providers)
    - [Response structure for provider-related requests](#response-structure-for-provider-related-requests)
- [Filtering providers by capabilities](#filtering-providers-by-capabilities)
    - [Providers with language detect feature](#providers-with-language-detect-feature)
    - [Providers supporting html input](#providers-supporting-html-input)
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

## Supported input formats

By default the translation engines process input texts as a plain text and do not take tags into account. Many providers support text formats other than plain text. Currently supported formats are: `text` (is the default, plain text), `html`, `xml`.

To translate a text using a specified format just add a `format` field into `context` parameters:

```js
client.ai.text.translate
    .fulfill({
        text: '<p>A <div>sample</div> text</p>',
        to: 'ru',
        format: 'html', // <-- specify input format
        provider: 'ai.text.translate.google.translate_api.2-0',
    })
    .then(console.log)
```

The response contains the translated text with preserved formatting:

```json
{
    "results": ["<p> <div> \u043e\u0431\u0440\u0430\u0437\u0435\u0446 </div> \u0442\u0435\u043a\u0441\u0442 </p>"],
    "meta": {
        "detected_source_language": ["en"]
    },
    "service": {
        "provider": {
            "id": "ai.text.translate.google.translate_api.2-0",
            "name": "Google Cloud Translation API"
        }
    }
}
```

## Content processing

Sometimes it's more convenient to preprocess or postprocess text after translation, e.g. eliminate spaces before punctuation. You can easily delegate it to Intento API with `processing` tag. This tag includes a set of rules.

```js
client.ai.text.translate
    .fulfill({
        text: 'A sample text',
        to: 'es'
        processing: {
            pre: [
                'punctuation_set'
            ],
            post: [
                'punctuation_set'
            ]
        },
    })
    .then(console.log)
```

More information about processing rules:

```js
client.settings.processingRules()
    .then(console.log)
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
        "symmetric": [
            "list",
            "of",
            "lang",
            "codes"
        ],
        "pairs": [
            {
                "from": "en",
                "to": "es"
            },
            {
                "from": "lang",
                "to": "another_lang"
            }
        ]
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

### Providers supporting html input

One can filter providers supporting a specified format in the same way as for other capabilities. Currently supported formats are: `text` (is the default, plain text), `html`, `xml`. The following call will return a list of providers supporting HTML format:

```js
client.ai.text.translate
    .providers({ format: 'html' })
    .then(data => data.forEach(p => console.info(p.name)))
```

Response:

```json
[
    {
        "id": "ai.text.translate.microsoft.translator_text_api.3-0",
        "name": "Microsoft Translator API v3.0",
        "score": 0,
        "price": 0
    },
    {
        "id": "ai.text.translate.google.translate_api.2-0",
        "name": "Google Cloud Translation API",
        "score": 0,
        "price": 0
    },
    ...
]
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
    .language('he', { locale: 'ru' })
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

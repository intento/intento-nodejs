# Sentiment analysis features

This is an intent to analyze the sentiment of the provided text.

More on that in the [documentation](https://github.com/intento/intento-api/blob/master/ai.text.sentiment.md)

<!-- TOC depthFrom:2 -->

- [Basic usage](#basic-usage)
- [Bulk mode](#bulk-mode)
    - [:lock: Multi mode](#lock-multi-mode)
- [Explore sentiment analysis providers](#explore-sentiment-analysis-providers)
    - [Response structure for provider-related requests](#response-structure-for-provider-related-requests)
- [Filtering providers by capabilities](#filtering-providers-by-capabilities)
    - [Providers with language detect feature](#providers-with-language-detect-feature)
    - [Provider supporting bulk sentiment analysis](#provider-supporting-bulk-sentiment-analysis)
    - [Providers able to analyze sentiment in Afrikaans](#providers-able-to-analyze-sentiment-in-afrikaans)
    - [Combine filters](#combine-filters)
- [Getting information about a provider](#getting-information-about-a-provider)

<!-- /TOC -->

## Basic usage

To analyze a text for sentiments, specify the text, the language of the text, and the desired provider as in the following example:

```js
client.ai.text.sentiment
    .fulfill({
        text: 'We love this place',
        lang: 'en',
        provider: 'ai.text.sentiment.meaningcloud.sentiment_analysis_api.2-1',
    })
    .then(data => {
        console.log('Sentiment analysis results:\n', data, '\n\n')
    })
```

The response contains the processed text and a service information:

```json
{
    "results": [
        {
            "sentiment_label": "positive",
            "sentiment_score": 1.0,
            "sentiment_confidence": 1.0,
            "sentiment_subjectivity": "subjective",
            "agreement": true,
            "irony": false
        }
    ],
    "meta": {},
    "service": {
        "provider": {
            "id": "ai.text.sentiment.meaningcloud.sentiment_analysis_api.2-1",
            "name": "MeaningCloud Sentiment Analysis API"
        }
    }
}
```

If the provider doesn't have capabilities (e.g. does not support a specific language) to process request, 413 error will be returned:

```json
{
    "error": {
        "code": 413,
        "message": "Provider ai.text.sentiment.meaningcloud.sentiment_analysis_api.2-1 constraint(s) violated: lang (Source language)"
    }
}
```

## Bulk mode

We provide a bulk fulfillment mode to process an array of texts at once. The mode is activated by sending an array of strings to the `text` parameter. The bulk mode is supported for some of the providers (see [Provider supporting bulk sentiment analysis](#provider-supporting-bulk-sentiment-analysis) section).

```js
client.ai.text.sentiment
    .fulfill({
        text: [
            'We love this shop!',
            'The quality is not as good as it should'
        ],
        lang: 'en',
        provider: 'ai.text.sentiment.ibm.natural_language_understanding',
    })
    .then(console.log)
```

The response contains the processed texts and a service information:

```json
{
    "results": [
        {
            "sentiment_label": "positive",
            "sentiment_score": 0.931392
        },
        {
            "sentiment_label": "neutral",
            "sentiment_score": 0.535453
        }
    ],
    "meta": {},
    "service": {
        "provider": {
            "id": "ai.text.sentiment.ibm.natural_language_understanding",
            "name": "IBM Watson Natural Language Understanding"
        }
    }
}
```

### :lock: Multi mode

In the multi mode, the processing of the text is performed using a list of providers. The mode is activated by passing an array of provider identificators.

```js
client.ai.text.sentiment
    .fulfill({
        text: [
            'We love this trail and make the trip every year. The views are breathtaking and well worth the hike!'
        ],
        lang: 'en',
        provider: [
            'ai.text.sentiment.ibm.natural_language_understanding',
            'ai.text.sentiment.aylien.text_analysis_api.1-0'
        ],
    })
    .then(console.log)
```

The response contains the analyzed text and a service information:          ↑

```json
[
    {
        "results": [
            {
                "sentiment_label": "positive",
                "sentiment_score": 0.931392
            }
        ],
        "meta": {},
        "service": {
            "provider": {
                "id": "ai.text.sentiment.ibm.natural_language_understanding",
                "name": "IBM Watson Natural Language Understanding"
            }
        }
    },
    {
        "results": [
            {
                "sentiment_label": "positive",
                "sentiment_score": 1.0,
                "sentiment_confidence": 0.9975973963737488,
                "sentiment_subjectivity": "unknown",
                "subjectivity_confidence": 0.0
            }
        ],
        "meta": {},
        "service": {
            "provider": {
                "id": "ai.text.sentiment.aylien.text_analysis_api.1-0",
                "name": "AYLIEN Text Analysis API"
            }
        }
    }
]
```

## Explore sentiment analysis providers

List all providers:

```js
client.ai.text.sentiment
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
        "lang": [...]
    },
    "lang_detect": false,
    "bulk": false
}
```

`lang` - is a list of language codes for which sentiment analysis in both directions is available.

## Filtering providers by capabilities

The list of providers may be further constrained by adding desired parameter values.

### Providers with language detect feature

```js
client.ai.text.sentiment
    .providers({ lang_detect: true })
    .then(data => data.forEach(p => console.info(p.name)))
```

### Provider supporting bulk sentiment analysis

```js
client.ai.text.sentiment
    .providers({ bulk: true })
    .then(data => data.forEach(p => console.info(p.name)))
```

### Providers able to analyze sentiment in Afrikaans

See more on ([language codes](http://www.loc.gov/standards/iso639-2/php/code_list.php) -- see ISO 639-1 Code)

```js
client.ai.text.sentiment
    .providers({ lang: 'af' })
    .then(data => data.forEach(p => console.info(p.name)))
```

### Combine filters

Retrieve providers able to analyze sentiment in Italian, for an array of segments at once, detecting source language:

```js
client.ai.text.sentiment
    .providers({ lang: 'it', bulk: true, lang_detect: true })
    .then(data => data.forEach(p => console.info(p.name)))
```

## Getting information about a provider

To get information about a provider pass provider id to `client.ai.text.sentiment.provider`.

```js
client.ai.text.sentiment
    .provider('ai.text.sentiment.microsoft.text_analytics_api.2-0')
    .then(console.log)
```

The response contains a list of the metadata fields and values available for the provider:

```json
{
    "id": "ai.text.sentiment.microsoft.text_analytics_api.2-0",
    "name": "Microsoft",
    "logo": "https://inten.to/static/img/api/mcs_translate.png",
    "billing": true,
    "languages": {
        "lang": [
            "en"
        ]
    },
    "lang_detect": false,
    "bulk": false
}
```

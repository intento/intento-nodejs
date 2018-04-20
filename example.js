'use strict'

const IntentoConnector = require('./src/index')

const DEBUG = false
const apikey = process.env.INTENTO_API_KEY
const google_api_key = process.env.GOOGLE_API_KEY

if (!apikey) {
    console.error(
        'Missing Intento API key in the environment. Consider one of the options https://github.com/intento/intento-nodejs#how-to-pass-your-api-keys-to-your-environment'
    )
    process.exit(1)
}

if (!google_api_key) {
    console.warn('Missing Google api key. Some examples might not work.')
}

const client = new IntentoConnector({ apikey }, DEBUG)
// in debug mode there will be more information related to API requests during API calls
// also sample callback will be used to visialize responses

// Simple translate text `text` to language `to`.
// - source language will be detected automatically
// - provider for the translation will be smart-selected based on the Smart routing feature
//   see more on that here https://github.com/intento/intento-api#smart-routing
client.ai.text.translate.fulfill(
    { text: "How's it going?", to: 'es' },
    defaultCallback
)

// Analyze text for sentiments
// https://github.com/intento/intento-api/blob/master/ai.text.sentiment.md#basic-usage
client.ai.text.sentiment.fulfill({
    text: 'We love this',
    lang: 'en',
    provider: 'ai.text.sentiment.ibm.natural_language_understanding',
})

/* Get information on providers */

client.ai.text.translate.providers({}, prettyPrintProviders)

// More on providers https://github.com/intento/intento-api/blob/master/ai.text.translate.md#advanced-usage
client.ai.text.translate.providers({ lang_detect: true }, (err, data) => {
    console.log('\nProvider with language detect feature')
    prettyPrintProviders(err, data)
})

// Also source language (`from`), target language(`to`) and bulk mode feature availability (`bulk: true`) can be specified as params
client.ai.text.translate.providers(
    { to: 'ru', bulk: true, lang_detect: true },
    (err, data) => {
        console.log(
            '\nProvider supporting bulk translation to russian with language detect feature'
        )
        prettyPrintProviders(err, data)
    }
)

// Providers for sentiment analysys
client.ai.text.sentiment.providers(prettyPrintProviders)

// Providers to get meanings of texts in selected languages
client.ai.text.dictionary.providers(prettyPrintProviders)

/* Advanced usage */

// Translate with specific strategy
client.ai.text.translate.fulfill(
    {
        text: "How's it going?",
        to: 'pt',
        bidding: 'best_price',
    },
    (err, data) => {
        console.log('\nTranslate with a "best_price" strategy \n')
        defaultCallback(err, data)
    }
)

/* Advanced general examples */

client.makeRequest({
    path: '/ai/text/translate',
    method: 'POST',
    content: {
        context: {
            text: 'A sample text',
            to: 'es',
        },
        service: {
            provider: 'ai.text.translate.microsoft.translator_text_api.2-0',
        },
    },
    fn: (err, data) => {
        console.log('Basic usage example\n')
        defaultCallback(err, data)
    },
})

// With custom google api key
client.makeRequest({
    path: '/ai/text/translate',
    method: 'POST',
    content: {
        context: {
            text: 'A sample text!',
            to: 'es',
        },
        service: {
            provider: 'ai.text.translate.google.translate_api.2-0',
            auth: {
                'ai.text.translate.google.translate_api.2-0': [
                    { key: `${google_api_key}` },
                ],
            },
        },
    },
    fn: (err, data) => {
        console.log('Example with your google api key\n')
        defaultCallback(err, data)
    },
})

// Specify request parameters as raw json passed as a `data` parameter
// Make sure your json is valid. For example one can validate json online  here https://jsonformatter.curiousconcept.com/
client.makeRequest({
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
    fn: (err, data) => {
        console.log('Basic usage with params passwd as raw json \n')
        defaultCallback(err, data)
    },
})

/* helpers */

function defaultCallback(err, data) {
    if (err) {
        console.log('\nerror:' + err.message)
        return
    }
    console.log('API response:\n', data, '\n\n')
}

function prettyPrintProviders(err, data) {
    if (err) {
        console.log('error:' + err.message)
    } else {
        console.log(`\nThere are overall ${data.length} providers:`)
        data.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}`))
    }
    console.log('\n\n')
}

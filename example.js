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
//   see more on that in the documentation here https://github.com/intento/intento-api#smart-routing
client.ai.text.translate
    .fulfill({ text: "How's it going?", to: 'es' })
    .then(defaultCallback)
    .catch(prettyCatch)

// Analyze text for sentiments.
// More on that in the documentation here https://github.com/intento/intento-api/blob/master/ai.text.sentiment.md#basic-usage
client.ai.text.sentiment
    .fulfill({
        text: 'We love this place',
        lang: 'en',
        provider: 'ai.text.sentiment.ibm.natural_language_understanding',
    })
    .then(defaultCallback)
    .catch(prettyCatch)

/* Explore providers */

client.ai.text.translate
    .providers()
    .then(prettyPrintProviders)
    .catch(prettyCatch)

// More on providers https://github.com/intento/intento-api/blob/master/ai.text.translate.md#advanced-usage
client.ai.text.translate
    .providers({ lang_detect: true })
    .then(data => {
        console.log('\nProvider with language detect feature')
        prettyPrintProviders(data)
    })
    .catch(prettyCatch)

// Also source language (`from`), target language(`to`) and bulk mode feature availability (`bulk: true`) can be specified as params
client.ai.text.translate
    .providers({ to: 'ru', bulk: true, lang_detect: true })
    .then(data => {
        console.log(
            '\nProvider supporting bulk translation to russian with language detect feature'
        )
        prettyPrintProviders(data)
    })
    .catch(prettyCatch)

// Providers for sentiment analysys
client.ai.text.sentiment
    .providers()
    .then(prettyPrintProviders)
    .catch(prettyCatch)

// Providers to get meanings of texts in selected languages
client.ai.text.dictionary
    .providers()
    .then(prettyPrintProviders)
    .catch(prettyCatch)

/* Advanced usage */

// Translate with specific strategy
client.ai.text.translate
    .fulfill({
        text: "How's it going?",
        to: 'pt',
        bidding: 'best_price',
    })
    .then(data => {
        console.log('\nTranslate with a "best_price" strategy \n')
        defaultCallback(data)
    })
    .catch(prettyCatch)

/* Advanced general examples */

client
    .makeRequest({
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
    })
    .then(data => {
        console.log('Basic usage example\n')
        defaultCallback(data)
    })
    .catch(prettyCatch)

// With custom google api key
client
    .makeRequest({
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
    })
    .then(data => {
        console.log('Example with your google api key\n')
        defaultCallback(data)
    })
    .catch(prettyCatch)

// One can pass request parameters as raw json specified as a `data` parameter
// Make sure your json is valid. For example one can validate json online  here https://jsonformatter.curiousconcept.com/
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
    .then(defaultCallback)
    .catch(prettyCatch)

/* helpers */

function defaultCallback(data) {
    console.log('API response:\n', JSON.stringify(data, null, 4), '\n\n')
}

function prettyPrintProviders(data) {
    console.log(`\nThere are overall ${data.length} providers:`)
    data.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}`))
    console.log('\n\n')
}

function prettyCatch(errorResponse) {
    console.log('\nError:' + errorResponse.message)
    console.log('\n\n')
}

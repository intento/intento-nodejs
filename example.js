'use strict'

const Intentor = require('./src/index')

const api_key = process.env.INTENTO_API_KEY
const google_api_key = process.env.GOOGLE_API_KEY

if (!api_key) {
    console.error('Missing Intento api key')
    process.exit(1)
}

if (!google_api_key) {
    console.warn('Missing Google api key. Some examples might not work.')
}

const context = {
    text: 'How\'s it going?',
    from: 'en',
    to: 'es'
}

function defaultCallback(err, data) {
    if (err) console.log('error:' + err.message)
    console.log(data)
    console.log('\n\n')
}

const client = new Intentor({ api_key: api_key })

// example GET
client.allTranslationProviders(function(err, data) {
    console.log('Show all translation provider names example\n')
    if (err) {
        console.log('error:' + err.message)
    } else {
        console.log(`There are ${data.length} providers:`)
        data.forEach(p => console.log('\t' + p.name))
    }
    console.log('\n\n')
})

// example POST
client.translateWithStrategy('best_quality', context, (err, data) => {
    console.log('Translate with a strategy example\n')
    defaultCallback(err, data)
})

// example whatever
client.makeRequest({
    path: '/ai/text/translate',
    method: 'POST',
    data: `{
        "context": {
            "text": "A sample text",
            "to": "es"
        },
        "service": {
            "provider": "ai.text.translate.microsoft.translator_text_api.2-0"
        }
    }`,
    fn: (err, data) => {
        console.log('Basic usage example\n')
        defaultCallback(err, data)
    },
})

// example with your google api key
client.makeRequest({
    path: '/ai/text/translate',
    method: 'POST',
    data: `{
        "context": {
            "text": "A sample text!",
            "to": "es"
        },
        "service": {
            "provider": "ai.text.translate.google.translate_api.2-0",
            "auth": {
                "ai.text.translate.google.translate_api.2-0": [
                    { "key": "${google_api_key}" }
                ]
            }
        }
    }`,
    fn: (err, data) => {
        console.log('Example with your google api key\n')
        defaultCallback(err, data)
    },
})

// example for sentiment analysis
client.allSentimentProviders(function (err, data) {
    console.log('Show all sentiment provider names example\n')
    if (err) {
        console.log('error:' + err.message)
    } else {
        console.log(`There are ${data.length} providers:`)
        data.forEach(p => console.log('\t' + p.name))
    }
    console.log('\n\n')
})


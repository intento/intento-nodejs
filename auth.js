'use strict'

const IntentoConnector = require('./src/index')

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

const client = new IntentoConnector({ apikey })

// Using a service provider with your own keys

client.ai.text.translate
    .fulfill({
        text: 'A sample text',
        to: 'es',
        provider: 'ai.text.translate.google.translate_api.2-0',
        auth: {
            'ai.text.translate.google.translate_api.2-0': [
                { key: google_api_key },
            ],
        },
    })
    .then(console.log)
    .catch(console.error)

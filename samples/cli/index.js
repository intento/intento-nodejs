'use strict'

const parseArgs = require('minimist')
// const IntentoConnector = require('intento-nodejs')
const IntentoConnector = require('../../src/index')

const argv = parseArgs(process.argv.slice(2), {
    /* options */
    boolean: ['debug', 'verbose'],
    alias: {
        debug: ['d'],
        verbose: ['v'],
        apikey: ['k', 'key'],
        host: ['h'],
        intent: ['i'],
    },
})
const { debug = false, verbose = false, apikey, host, intent, _ = [], ...rest } = argv

const DEBUG = debug
let VERBOSE = verbose

if (!apikey) {
    console.error(
        'Missing Intento API key. Consider one of the options https://github.com/intento/intento-nodejs#how-to-pass-your-api-keys-to-your-environment'
    )
    process.exit(1)
}

if (!host && (DEBUG || VERBOSE)) {
    console.warn('No host specified. Default host will be used')
}

const client = new IntentoConnector({ apikey, host }, DEBUG)

const intentMap = {
    translate: client.ai.text.translate,
    sentiment: client.ai.text.sentiment,
    dictionary: client.ai.text.dictionary,
    settings: client.settings,
    usage: client.usage,
}

const validIntents = Object.keys(intentMap)

if (!intent || validIntents.indexOf(intent) === -1) {
    if (intent) {
        console.error('Unknown intent: ', intent, '. Valid intents are ', validIntents.join(', '))
    } else {
        console.error('No intent specified. For example, add `--intent=translate` or `-i translate`')
    }
}

if (intent === 'translate') {
    const text = _[0]

    client.ai.text.translate
        .fulfill({ text, ...rest })
        .then(defaultCallback)
        .catch(prettyCatch)
}

/* helpers */

function defaultCallback(data) {
    if (data.message) {
        console.log('\nError: ' + data.message)
        console.log('\n\n')
    } else  if (data.error) {
        console.log('\nError from provider: ' + data.error.message)
        console.log('\n\n')
    } else {
        console.log('API response:\n', JSON.stringify(data, null, 4), '\n\n')
    }
}

function prettyCatch(errorResponse) {
    if (errorResponse.message) {
        console.log('\nError: ' + errorResponse.message)
        console.log('\n\n')
    } else if (errorResponse.error) {
        console.log('\nError: ' + errorResponse.error.message)
        console.log('\n\n')
    } else {
        errorResponse.setEncoding('utf8')
        let body = ''
        errorResponse.on('data', function (chunk) {
            body += chunk
            console.log(chunk)
        })
        errorResponse.on('end', function () {
            try {
                let data = null
                if (body.length > 0) {
                    data = JSON.parse(body)
                }
                console.error(data)
            } catch (e) {
                if (DEBUG) {
                    console.error('Failed reading response body', body)
                }
            }
        })
    }
}


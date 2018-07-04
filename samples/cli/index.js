'use strict'

const parseArgs = require('minimist')
const IntentoConnector = require('../../src/index')

const argv = parseArgs(process.argv.slice(2), {
    /* options */
    boolean: ['debug', 'verbose', 'async'],
    alias: {
        debug: ['d'],
        verbose: ['v'],
        apikey: ['k', 'key'],
        host: ['h'],
        intent: ['i'],
    },
})

const {
    debug = false,
    verbose = false,
    apikey,
    host,
    intent,
    output = 'responseAsIs',
    async,
    d, // eslint-disable-line no-unused-vars
    v, // eslint-disable-line no-unused-vars
    k, // eslint-disable-line no-unused-vars
    key, // eslint-disable-line no-unused-vars
    h, // eslint-disable-line no-unused-vars
    i, // eslint-disable-line no-unused-vars
    _ = [],
    provider,
    ...rest
} = argv

const DEBUG = debug
const VERBOSE = verbose

const outputFn = {
    responseAsIs,
    listIdsFromResponse,
}[output]

if (!apikey) {
    console.error(
        'Missing Intento API key. Consider one of the options https://github.com/intento/intento-nodejs#how-to-pass-your-api-keys-to-your-environment'
    )
    process.exit(1)
}

if (!intent) {
    console.error(
        'No intent specified. For example, add `--intent=translate` or `-i translate`'
    )
    process.exit(1)
}

if (!host && (DEBUG || VERBOSE)) {
    console.warn('No host specified. Default host will be used')
}

const client = new IntentoConnector({ apikey, host }, DEBUG)

const intentShortcuts = {
    translate: client.ai.text.translate,
    sentiment: client.ai.text.sentiment,
    dictionary: client.ai.text.dictionary,
    settings: client.settings.languages,
    usage: client.usage.intento,
}

const intentProcessor = getIntentProcessor(intent)

const validIntents = Object.keys(intentShortcuts)

if (!intentProcessor) {
    console.error(
        'Unknown intent: ',
        intent,
        '. Valid intent examples are ',
        validIntents.join(', '),
        ' or settings.processingRules, ai/text/translate, etc.'
    )
    process.exit(1)
}

try {
    const options = {}
    if (_.length > 0) {
        if (_.length === 1) {
            // avoid errors from providers without bulk support
            options.text = _[0]
        } else {
            options.text = _
        }
    }

    if (async) {
        options.async = async
    }

    if (provider) {
        const providerList = provider.split(',')
        if (providerList.length === 1) {
            options.provider = providerList[0]
        } else {
            options.provider = providerList
        }
    }

    intentProcessor({ ...options, ...rest })
        .then(errorFriendlyCallback)
        .catch(prettyCatch)
} catch (e) {
    console.error(e.message)
}

/* helpers */

// more here https://github.com/intento/intento-api/blob/master/README.md#errors
const errorCodes = {
    401: 'Auth key is missing',
    403: 'Auth key is invalid',
    404: 'Intent/Provider not found',
    413: 'Capabilities mismatch for the chosen provider (too long text, unsupported languages, etc)',
    429: 'API rate limit exceeded',
}

function errorFriendlyCallback(data) {
    if (data.message) {
        console.log('\nError: ' + data.message)
        console.log('\n\n')
    } else if (data.error) {
        if (data.error.code === 400) {
            console.log('\nError from provider: ' + data.error.message)
        } else {
            console.log(
                `\nError: ${data.error.code} ${errorCodes[data.error.code]}\n${
                    data.error.message
                }`
            )
        }
        console.log('\n\n')
    } else {
        if (typeof outputFn === 'function') {
            outputFn(data)
        } else {
            if (DEBUG) {
                console.log('Output results using default output')
            }
            responseAsIs(data)
        }
    }
}

function responseAsIs(data) {
    console.log('API response:\n', JSON.stringify(data, null, 4), '\n\n')
}

function listIdsFromResponse(data) {
    console.log('API response:')
    data.forEach(p => {
        console.log(p.id)
    })
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
        errorResponse.on('data', function(chunk) {
            body += chunk
            console.log(chunk)
        })
        errorResponse.on('end', function() {
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

function getIntentProcessor(value) {
    let shortcut = intentShortcuts[value]
    if (shortcut) {
        if (shortcut.hasOwnProperty('fulfill')) {
            shortcut = shortcut.fulfill
        }
        return shortcut
    }

    let resultFn = client
    const elements = value.split(/[./]/)

    var MethodDoesntExist = {}

    try {
        elements.forEach(element => {
            if (resultFn.hasOwnProperty(element)) {
                resultFn = resultFn[element]
            } else {
                throw MethodDoesntExist
            }
        })
    } catch (e) {
        if (e !== MethodDoesntExist) {
            throw e
        }
    }

    if (resultFn.hasOwnProperty('fulfill')) {
        resultFn = resultFn.fulfill
    }

    if (typeof resultFn === 'function') {
        return resultFn
    }

    return
}

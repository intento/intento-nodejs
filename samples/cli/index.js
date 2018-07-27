'use strict'

const currentNodeJSVersion = Number(process.version.match(/^v?(\d+\.\d+)/)[1])
const minimalNodeJSVersion = '8.0'
if (currentNodeJSVersion < Number(minimalNodeJSVersion)) {
    console.error(`\nMinimal node version required for this script is ${minimalNodeJSVersion}.0.`)
    console.error(`Your node version is ${currentNodeJSVersion}.`)
    console.log('Please, upgrade your node\n')
    process.exit(1)
}

const IntentoConnector = require('../../src/index')

const fs = require('fs')
const util = require('util')
const parseArgs = require('minimist')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const argv = parseArgs(process.argv.slice(2), {
    /* options */
    boolean: ['debug', 'verbose', 'async', 'help', 'curl'],
    alias: {
        help: ['h'],
        debug: ['d'],
        verbose: ['v'],
        apikey: ['key'],
        intent: ['i'],
    },
})

const {
    help = false,
    debug = false,
    verbose = false,
    curl = false,
    apikey = process.env.INTENTO_API_KEY,
    host,
    intent = 'translate',
    responseMapper,
    async = false,
    h = false, // eslint-disable-line no-unused-vars
    d, // eslint-disable-line no-unused-vars
    v, // eslint-disable-line no-unused-vars
    i, // eslint-disable-line no-unused-vars
    key, // eslint-disable-line no-unused-vars
    _ = [],
    provider,
    input,
    bulk = false,
    output,
    encoding = 'utf-8',
    pre_processing,
    post_processing,
    ...OTHER_OPTION
} = argv

// prettier-ignore
if (help) {
    console.info('Command Line Interface for Intento API')
    console.info('  more examples here https://github.com/intento/intento-nodejs/tree/master/samples/cli#examples')
    console.info('\nUSAGE')
    console.info('  node index.js [ARGUMENTS] [text to process]')
    console.info('\nARGUMENTS')
    console.info('  --help             (boolean) display help')
    console.info('  --key              [REQUIRED] your intento API key (visit https://console.inten.to to get one)')
    console.info('  --intent           (string) any available intent like translate (default) or sentiment or ai.text.translate or ai/text/dictionary (more in docs https://github.com/intento/intento-api#intents)')
    console.info('  --to               (language code)')
    console.info('  --from             (language code)')
    console.info('  --async            (boolean) process large pieces in a deferred way (more in docs https://github.com/intento/intento-api#async-mode)')
    console.info('  --provider         (string|list) use specific provider(s), list provider ids separated by comma, no spaces (more in docs https://github.com/intento/intento-api#basic-usage)')
    console.info("  --input            (string) relative path to a file you'd like to process")
    console.info('  --bulk             (boolean) treat each line of the input file as a separate segment, sending an array of segments for translation')
    console.info('  --output           (string) relative path to a file where results will be stored')
    console.info('  --post_processing  (string|list) content processing for `--intent=translate` (more in docs https://github.com/intento/intento-api/blob/master/ai.text.translate.md#content-processing)')
    console.info("  --format           ('text'|'html'|'xml') default to 'text' (more in docs https://github.com/intento/intento-api/blob/master/ai.text.translate.md#supported-formats)")
    console.info('  --id               (string) job id for `--intent=operations`')
    console.info('')
    process.exit(1)
}

const DEBUG = debug
const VERBOSE = verbose

if (!apikey) {
    // prettier-ignore
    console.error('Missing Intento API key. Consider one of the options https://github.com/intento/intento-nodejs#how-to-pass-your-api-keys-to-your-environment')
    process.exit(1)
}

if (!intent) {
    console.error('No intent specified. For example, add `--intent=translate` or `-i translate`')
    process.exit(1)
}

if (!host && DEBUG) {
    console.warn('No host specified. Default host will be used')
}

// Initialize Intento connector object
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, verbose: VERBOSE, curl })

// Define which Inten.to endpoint will be used to process the request
const intentProcessor = getIntentProcessor(client, intent)
if (!intentProcessor) {
    process.exit(1)
}

// Here we begin to form an object with query parameters
const options = {}

// async mode option. More here https://github.com/intento/intento-nodejs#async-mode
if (async) {
    options.async = async
}

// Form provider list if needed
if (provider) {
    const providerList = provider.split(',')
    if (providerList.length === 1) {
        options.provider = providerList[0]
    } else {
        options.provider = providerList
    }
}

// Check if there is a conflict in options
if (options.async && !provider) {
    warnAsyncSmartAndExit()
}

// Form processing parameter object
if (pre_processing || post_processing) {
    options.processing = options.processing || {}
    if (pre_processing) {
        options.processing.pre = pre_processing.split(',')
    }
    if (post_processing) {
        options.processing.post = post_processing.split(',')
    }
}

processRequest(intentProcessor, options, {
    intent,
    apikey,
    input,
    output,
    encoding,
    async,
    bulk,
    _,
})

// ---------------------------------- utils -----------------------------------

async function processRequest(intentProcessor, options, argv) {
    let data
    try {
        const text = await getText(argv)
        data = await intentProcessor({ text, ...options, ...OTHER_OPTION })
    } catch (e) {
        prettyCatch(e)
    }

    if (data) {
        errorFriendlyCallback(data, argv)
    }
}

async function getText({ input, encoding, bulk, _ }) {
    if (input) {
        const path = require('path')
        let filePath
        try {
            filePath = path.join(__dirname, input)
        } catch (e) {
            console.error(`Error creating file path`, e.message)
            return ''
        }

        try {
            const data = await readFile(filePath, { encoding })
            if (bulk) {
                return data.split('\n')
            }
            return data
        } catch (err) {
            console.error(`Error reading ${input} file\n`, err)
            return ''
        }
    } else {
        if (_.length > 0) {
            if (_.length === 1) {
                if (bulk) {
                    return _[0].split('\n')
                }

                // avoid errors from providers without bulk support
                return _[0]
            }
            return _
        }
    }
    return ''
}

// more here https://github.com/intento/intento-api/blob/master/README.md#errors
const ERROR_CODES = {
    401: 'Auth key is missing',
    403: 'Auth key is invalid',
    404: 'Intent/Provider not found',
    413: 'Capabilities mismatch for the chosen provider (too long text, unsupported languages, etc)',
    429: 'API rate limit exceeded',
}

async function errorFriendlyCallback(data, { input, output, async, intent, apikey, encoding }) {
    if (data.message) {
        console.error('\nError:', data.message, '\n\n')
        if (DEBUG) {
            console.error(data)
        }
        return
    }

    if (data.error) {
        // prettier-ignore
        console.error(`\nError: ${data.error.code} ${ERROR_CODES[data.error.code]}\n${data.error.message}`)
        if (input && !async) {
            console.log('Consider using --async option')
        }
        console.log('\n')
        if (DEBUG) {
            console.error(data)
        }
        return
    }

    if (data.id && !data.done) {
        // prettier-ignore
        if (intent.indexOf('operations') === -1) {
            // async job was registered with `id`
            console.log('\noperation id', data.id)
            console.log(`\nRequest operation results later with a command`)
            console.log(`\tnode index.js --key=${apikey} --intent=operations --id=${data.id} --output=${output || `${Date.now()}_output.txt`}`)
            const fname = `${input}_operation_id.txt`
            try {
                await writeFile(fname, data.id, { encoding })
                console.log(`\nOperation id was written to the ${input}_operation_id.txt file`)
            } catch (e) {
                console.error(`Errors while writing to the ${fname} file`)
                console.log('Response:\n', data)
            }
        } else {
            // it is an operation/id request with empty response ~ same as done = false
            console.log(`Operation ${data.id} is still in progress`)
        }
    }

    if (output) {
        if (data.results) {
            try {
                await writeFile(output, data.results.join('\n'), { encoding })
                console.log(`Results were written to the ${output} file`)
            } catch (e) {
                console.error(`Errors while writing to the ${output} file`)
                console.log('Response:\n', data)
            } finally {
                if (VERBOSE || DEBUG) {
                    console.log('meta', data.meta)
                    console.log('service', data.service)
                }
            }
            return
        }

        if (data.id && data.done) {
            // it is an operation/id request with response ~ same as done = true

            data.response.forEach(async (resp, idx) => {
                const fname = output + (idx > 0 ? `_${idx}_.txt` : '')
                try {
                    await writeFile(fname, resp.results.join('\n'), { encoding })
                    console.log(`Results were written to the ${fname} file`)
                } catch (e) {
                    console.error(`Errors while writing to the ${fname} file`)
                    console.log('Response:\n', resp)
                } finally {
                    if (VERBOSE || DEBUG) {
                        console.log('meta', resp.meta)
                        console.log('service', resp.service)
                    }
                }
            })
            return
        }

        try {
            await writeFile(output, JSON.stringify(data, null, 4), { encoding })
            console.log(`Results were written to the ${output} file`)
        } catch (e) {
            console.error(`Errors while writing to the ${output} file`)
            console.log('Response:\n', data)
        } finally {
            if (DEBUG) {
                console.log(data)
            }
        }

        return
    }

    const defaultOutputFn = getDefaultOuputFn(intent)
    if (typeof defaultOutputFn === 'function') {
        defaultOutputFn(data)
        return
    }

    if (DEBUG) {
        console.log('Output results using default responseMapper')
    }

    responseAsIs(data)
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

function getDefaultOuputFn(intent) {
    if (responseMapper) {
        if (intent.indexOf('providers') === -1) {
            // not requesting for providers
            return responseAsIs
        } else {
            return listIdsFromResponse
        }
    } else {
        return {
            responseAsIs,
            listIdsFromResponse,
        }[responseMapper]
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

function getIntentProcessor(connector, value) {
    if (!connector || !connector.ai) {
        console.error("Intento connector wasn't initialized properly.")
        return
    }

    const intentShortcuts = {
        translate: connector.ai.text.translate,
        providers: connector.ai.text.translate.providers,
        ['translate.providers']: connector.ai.text.translate.providers,
        sentiment: connector.ai.text.sentiment,
        ['sentiment.providers']: connector.ai.text.sentiment.providers,
        dictionary: connector.ai.text.dictionary,
        ['dictionary.providers']: connector.ai.text.dictionary.providers,
        settings: connector.settings.languages,
    }

    let shortcut = intentShortcuts[value]
    if (shortcut) {
        if (shortcut.hasOwnProperty('fulfill')) {
            shortcut = shortcut.fulfill
        }
        return shortcut
    }

    let resultFn = client
    const elements = value.split(/[./]/)

    const MethodDoesntExist = {}

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

    const validIntents = Object.keys(intentShortcuts)
    console.error(
        'Unknown intent: ',
        intent,
        '. Valid intent examples are ',
        validIntents.join(', '),
        ' or settings/processing-rules, ai/text/translate, etc.'
    )
    return
}

// prettier-ignore
function warnAsyncSmartAndExit() {
    const PROVIDERS_EXAMPLE = 'https://github.com/intento/intento-nodejs/tree/master/samples/cli#list-available-providers'

    console.error("Smart mode for async operations currently isn't supported")
    console.log('Please specify a provider with `--provider` option.')
    console.log(`To get available providers try an example ${PROVIDERS_EXAMPLE}`)

    process.exit(1)
}

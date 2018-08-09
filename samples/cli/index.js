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
const path = require('path')
const util = require('util')
const parseArgs = require('minimist')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

// Return an argument object populated with the array arguments from args
const argv = parseArgs(process.argv.slice(2), {
    /* options */
    boolean: ['debug', 'verbose', 'help', 'curl', 'usage'],
    alias: {
        help: ['h'],
        debug: ['d'],
        verbose: ['v'],
        apikey: ['key'],
        intent: ['i'],
        usage: ['u'],
    },
})

// All command line arguments
const {
    help = false,
    debug = false,
    verbose = false,
    curl = false,
    usage = false,
    viewpoint = 'intento',
    apikey = process.env.INTENTO_API_KEY,
    host,
    intent,
    responseMapper,
    _ = [],
    input,
    bulk = false,
    output,
    encoding = 'utf-8',
    secret_credentials_file,
    auth_file,
    ...OTHER_OPTIONS
} = argv

// Show command line help
// prettier-ignore
if (help) {
    console.info('Command Line Interface for Intento API')
    console.info('  more examples here https://github.com/intento/intento-nodejs/tree/master/samples/cli#examples')
    console.info('\nUSAGE')
    console.info('  node index.js [ARGUMENTS] [text to process]')
    console.info('\nARGUMENTS')
    console.info('  --help                    (boolean) display help')
    console.info('  --key                     [REQUIRED] your intento API key (visit https://console.inten.to to get one)')
    console.info('  --intent                  (string) any available intent like translate (default) or sentiment or ai.text.translate or ai/text/dictionary (more in docs https://github.com/intento/intento-api#intents)')
    console.info('  --to                      (string|number) for ai.text.* it is used as a language code; for `--usage` requests it is used as timestamp (in seconds)')
    console.info('  --from                    (string|number) for ai.text.* it is used as a language code; for `--usage` requests it is used as timestamp (in seconds)')
    console.info('  --async                   (boolean) process large pieces in a deferred way (more in docs https://github.com/intento/intento-api#async-mode)')
    console.info('  --usage                   (boolean) get usage statistics on specified intents or providers')
    console.info('  --viewpoint               (string) for `--usage` requests, values: intento|provider|distinct, default to "intento"')
    console.info('  --provider                (string|list) use specific provider(s), list provider ids separated by comma, no spaces (more in docs https://github.com/intento/intento-api#basic-usage)')
    console.info("  --input                   (string) relative path to a file you'd like to process")
    console.info('  --bulk                    (boolean) treat each line of the input file as a separate segment, sending an array of segments for translation')
    console.info('  --output                  (string) relative path to a file where results will be stored')
    console.info('  --post_processing         (string|list) content processing for `--intent=translate` (more in docs https://github.com/intento/intento-api/blob/master/ai.text.translate.md#content-processing)')
    console.info("  --format                  ('text'|'html'|'xml') default to 'text' (more in docs https://github.com/intento/intento-api/blob/master/ai.text.translate.md#supported-formats)")
    console.info('  --id                      (string) job id for `--intent=operations`')
    console.info('  --secret_credentials_file (string) relative path to a json file with credentials config to be delegated to autogenerate auth tokens')
    console.info('  --auth_file               (string) relative path to a json file with own keys')
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

if (!host && DEBUG) {
    console.warn('No host specified. Default host will be used')
}

// Initialize Intento connector object
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, verbose: VERBOSE, curl })

// Define which Inten.to endpoint will be used to process the request
const intentProcessor = getIntentProcessor(client, usage ? 'usage/' + viewpoint : intent)
if (!intentProcessor) {
    process.exit(1)
}

// Check if there is a conflict in options
if (OTHER_OPTIONS.async && !OTHER_OPTIONS.provider) {
    warnAsyncSmartAndExit()
}

// Run main processing function
processRequest(intentProcessor, {
    intent,
    apikey,
    input,
    output,
    encoding,
    bulk,
    usage,
    _,
})

// ---------------------------------- utils -----------------------------------

// General Intento error codes
// more here https://github.com/intento/intento-api/blob/master/README.md#errors
const ERROR_CODES = {
    401: 'Auth key is missing',
    403: 'Auth key is invalid',
    404: 'Intent/Provider not found',
    413: 'Capabilities mismatch for the chosen provider (too long text, unsupported languages, etc)',
    429: 'API rate limit exceeded',
}

/**
 * Main function to run an intent job
 * @param {Function} intentProcessor an intent
 * @param {object} options request parameters related to how the intent should work
 * @param {object} argv command line arguments related to text processing
 */
async function processRequest(intentProcessor, argv) {
    let data

    if (secret_credentials_file) {
        OTHER_OPTIONS.secret_credentials = await getDataFromFile(secret_credentials_file, encoding)
    }

    if (auth_file) {
        OTHER_OPTIONS.auth = await getDataFromFile(auth_file, encoding)
    }

        const params = { ...OTHER_OPTIONS }
        if (argv.usage) {
            params.intent = argv.intent
        } else {
        try {
            const text = await getText(argv)
            params.text = text
        } catch (e) {
            params.text = ''
            prettyCatch(e, 'Error while getting text to process')
        }
    }

    try {
        data = await intentProcessor(params)
    } catch (e) {
        prettyCatch(e, 'Error while processing a request to API')
    }

    if (data) {
        errorFriendlyCallback(data, argv)
    }
}

/**
 * Read file content
 * @param {string} filename relative path to a file
 * @param {string} [encoding='utf-8'] character encoding
 * @returns content of a file
 */
async function getDataFromFile(filename, encoding = 'utf-8') {
    let filePath
    try {
        filePath = path.join(__dirname, filename)
    } catch (e) {
        console.error(`Error creating file path`, e.message)
        return ''
    }

    try {
        const data = await readFile(filePath, { encoding })
        return data
    } catch (err) {
        console.error(`Error reading ${filename} file\n`, err)
        return ''
    }
}

/**
 * Prepare given data to pass as a text field
 * @param {object} { input, encoding, bulk, _ } arguments from command line
 * @returns {string|array} text to process
 */
async function getText({ input, encoding, bulk, _ }) {
    if (input) {
        const data = await getDataFromFile(input, encoding)
        if (bulk) {
            return data.split('\n')
        }
        return data
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

/**
 * Log response results to the console or write them to a specified file
 * @param {object} data request response
 * @param {object} { input, output, intent, apikey, encoding } arguments from command line
 */
async function errorFriendlyCallback(data, { input, output, intent, apikey, encoding }) {
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
        if (input && !OTHER_OPTIONS.async) {
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

/**
 * Log response results as pretty printed JSON object
 * @param {array|object} data
 */
function responseAsIs(data) {
    console.log('API response:\n', JSON.stringify(data, null, 4), '\n\n')
}

/**
 * Log response showing only provider ids
 * @param {array} data
 */
function listIdsFromResponse(data) {
    console.log('API response:')
    data.forEach(p => {
        console.log(p.id)
    })
}

/**
 * Log usage response as a table
 * @param {array} data
 */
function usageResponse(data) {
    console.log('API response:')
    const values = data.data
    if (values[0].group ) {
        Object.keys(values[0].metrics).forEach(metric => {
            const data2 = {}
            values.forEach(({ metrics, timestamp, group }) => {
                if (!data2[timestamp]) {
                    data2[timestamp] = {}
                }
                Object.keys(group).forEach(g => {
                    data2[timestamp][group[g]] = metrics[metric]
                })
            })
            const list = Object.keys(data2).map(timestamp => ({ ...data2[timestamp], timestamp: new Date(1000 * timestamp) }))
            console.log(`\n${Array(40).join('-')}> ${metric}`)
            console.table(list, ['timestamp', ...Object.keys(data2[Object.keys(data2)[0]])])
        })
    } else {
        const list = values.map(({ metrics, timestamp, group }) => ({ ...metrics, timestamp, ...group }))
        console.table(list, ['requests', 'items', 'len', 'errors', 'timestamp'])
    }
}

/**
 * Choose a function to log response results
 * @param {string} intent name
 * @returns
 */
function getDefaultOuputFn(intent) {
    if (responseMapper) {
        return {
            responseAsIs,
            listIdsFromResponse,
            usageResponse,
        }[responseMapper]
    }

    if (usage && viewpoint === 'intento') {
        return usageResponse
    }

    if (intent && intent.indexOf('providers') !== -1) {
        return listIdsFromResponse
    }

    return responseAsIs
}

/**
 * Log errors to the console
 * @param {object} errorResponse
 * @returns
 */
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

/**
 * Select SDK function to make requests to the Intento API
 * @param {object} connector an IntentoConnector instance
 * @param {string} value intent name
 * @returns {Function} function that can make http requests to a certain Intento API endpoint
 */
function getIntentProcessor(connector, value = 'translate') {
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
        usage: connector.usage.intento,
    }

    let shortcut = intentShortcuts[value]
    if (shortcut) {
        if (shortcut.hasOwnProperty('fulfill')) {
            shortcut = shortcut.fulfill
        }
        return shortcut
    }

    let resultFn = client

    if (typeof value !== 'string') {
        console.error('Unexpected intent description: ', value)
        intentHelp(intentShortcuts)
        return
    }

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

    console.error('Unknown intent: ', intent)
    intentHelp(intentShortcuts)
    return
}

/**
 * Log help on how to specify an intent
 *
 * @param {object} intentShortcuts - description for most popular intents
 */
function intentHelp(intentShortcuts) {
    const validIntents = Object.keys(intentShortcuts)
    console.log(
        'Valid intent examples are ',
        validIntents.join(', '),
        ' or settings/processing-rules, ai/text/translate, etc.'
    )
}

/**
 * Explain why the script execution was stopped
 * @returns
 */
function warnAsyncSmartAndExit() {
    // prettier-ignore
    const PROVIDERS_EXAMPLE = 'https://github.com/intento/intento-nodejs/tree/master/samples/cli#list-available-providers'

    console.error("Smart mode for async operations currently isn't supported")
    console.log('Please specify a provider with `--provider` option.')
    console.log(`To get available providers try an example ${PROVIDERS_EXAMPLE}`)

    process.exit(1)
}

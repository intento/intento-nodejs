'use strict'

const VERSION = '0.1.0'
const SDK_NAME = 'Intento.CLI'

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
const neatCsv = require('neat-csv')
const parseArgs = require('minimist')
const ProgressBar = require('progress')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const NOW_TS = Date.now() // helps to distinguish output from different script runs
const ATTEMPTS_TO_REQUEST_ASYNC_RESULTS = 15 // how many times send request
const INTERVAL_TO_REQUEST_ASYNC_RESULTS = 1000 // milliseconds between consecutive requests
const DEFAULT_INTENT = 'translate'

// Return an argument object populated with the array arguments from args
const argv = parseArgs(process.argv.slice(2), {
    /* options */
    alias: {
        apikey: ['key'],
    },
})

// All command line arguments
const {
    help = false,
    debug = false,
    verbose = false,
    curl = false,
    usage = false,
    dryRun = false,
    viewpoint = 'intento',
    apikey = process.env.INTENTO_API_KEY,
    key, // eslint-disable-line no-unused-vars
    host,
    intent,
    responseMapper,
    _ = [],
    csv,
    csv_col = 'a',
    input,
    bulk = false,
    output,
    encoding = 'utf-8',
    secret_credentials_file,
    auth_file,
    only_operation_id,
    attempts = ATTEMPTS_TO_REQUEST_ASYNC_RESULTS,
    timedelta = INTERVAL_TO_REQUEST_ASYNC_RESULTS,
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
    console.info('  --only_operation_id       (boolean) for `--async` requests do not send next requests, return operation id to request results later')
    console.info('  --attempts                (number) for `--async` requests how many times send request')
    console.info('  --timedelta               (number) for `--async` requests milliseconds between consecutive requests')
    console.info('  --usage                   (boolean) get usage statistics on specified intents or providers')
    console.info('  --viewpoint               (string) for `--usage` requests, values: intento|provider|distinct, default to "intento"')
    console.info('  --provider                (string|list) use specific provider(s), list provider ids separated by comma, no spaces (more in docs https://github.com/intento/intento-api#basic-usage)')
    console.info("  --input                   (string) relative or absolute path to a file you'd like to process")
    console.info('  --bulk                    (boolean) treat each line of the input file as a separate segment, sending an array of segments for translation')
    console.info('  --csv                     (boolean) use csv parser to split text into lines')
    console.info('  --csv_col                 (string) csv column to translate, as a letter from a to z, default - first column')
    console.info('  --output                  (string) relative or absolute path to a file where results will be stored')
    console.info('  --post_processing         (string|list) content processing for `--intent=translate` (more in docs https://github.com/intento/intento-api/blob/master/ai.text.translate.md#content-processing)')
    console.info("  --format                  ('text'|'html'|'xml') default to 'text' (more in docs https://github.com/intento/intento-api/blob/master/ai.text.translate.md#supported-formats)")
    console.info('  --id                      (string) job id for `--intent=operations`')
    console.info('  --secret_credentials_file (string) relative or absolute path to a json file with credentials config to be delegated to autogenerate auth tokens')
    console.info('  --auth_file               (string) relative or absolute path to a json file with own keys')
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
const client = new IntentoConnector(
    { apikey, host },
    {
        debug: DEBUG,
        verbose: VERBOSE,
        curl,
        dryRun,
        userAgent: `${SDK_NAME}/${VERSION}`,
    }
)

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
    csv,
    csvCol: csv_col.toLowerCase(),
    usage,
    only_operation_id,
    attempts,
    timedelta,
    _,
})

// ---------------------------------- utils -----------------------------------

// General Intento error codes
// more here https://github.com/intento/intento-api/blob/master/README.md#errors
const ERROR_CODES = {
    400: 'Provider-related error',
    401: 'Auth key is missing',
    403: 'Auth key is invalid',
    404: 'Intent/Provider not found',
    413: 'Capabilities mismatch for the chosen provider (too long text, unsupported languages, etc)',
    429: 'API rate limit exceeded',
}

/**
 * Main function to run an intent job
 *
 * @param {Function} intentProcessor an intent
 * @param {object} argv command line arguments related to how the intent should work
 * @returns {undefined}
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
            if (intentRequiresText(argv.intent)) {
                const text = await getText(argv)
                if (!text || text === '' || (text.join && text.join('') === '')) {
                    console.error('No text or an input file to process. Stop.')
                    return
                }
                params.text = text
            }
        } catch (e) {
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
 *
 * @param {string} filename relative or absolute path to a file
 * @param {string} [encoding='utf-8'] character encoding
 * @returns {string} content of a file
 */
async function getDataFromFile(filename, encoding = 'utf-8') {
    let filePath

    if (!filename) {
        return 'Please specify path to a file as a first argument'
    }

    if (path.isAbsolute(filename)) {
        filePath = filename
    } else {
        try {
            filePath = path.join(__dirname, filename)
        } catch (e) {
            console.error('Error creating file path', e.message)
            return ''
        }
    }

    try {
        const data = await readFile(filePath, { encoding })
        return data
    } catch (err) {
        console.error(`Error reading ${filename} file.`)
        if (DEBUG) {
            console.error(err)
        }
        return ''
    }
}

/**
 * Prepare given data to pass as a text field
 *
 * @param {object} { input, encoding, bulk, _ } arguments from command line
 * @returns {string|array} text to process
 */
async function getText({ input, encoding, bulk, csv, csvCol, _ }) {
    if (input) {
        const data = await getDataFromFile(input, encoding)
        if (bulk) {
            return splitIntoLines(data)
        } else if (csv) {
            const lines = await neatCsv(data, { headers: 'abcdefghijklmnopqrstuvwxyz'.split('') })
            return lines.map(line => line[csvCol] || '')
        }
        return data
    } else {
        if (_.length > 0) {
            if (_.length === 1) {
                if (bulk) {
                    return splitIntoLines(_[0])
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
 * Splits a string into array of lines. OS independent
 *
 * @param {String} str multiline string
 * @returns {array} lines
 */
function splitIntoLines(str) {
    if (str.indexOf('\r') === -1) {
        // Mac OS ir Linux line breaks
        return str.split('\n')
    }

    // Windows line breaks
    return str.replace(/\n/g, '').split('\r')
}

/**
 * Log response results to the console or write them to a specified file
 *
 * @param {object} data request response
 * @param {object} { input, output, intent, apikey, encoding } arguments from command line
 * @returns {undefined}
 */
async function errorFriendlyCallback(
    data,
    {
        input,
        output,
        csv,
        intent = 'translate',
        apikey,
        encoding,
        only_operation_id,
        attempts,
        timedelta,
    }
) {
    if (printError(data, 'success response with some error message')) {
        if (input && !OTHER_OPTIONS.async) {
            console.log('Consider using --async option')
        }
        return
    }

    if (intent === 'operations' && !data.done) {
        // it is an operation/id request with empty response ~ same as done = false
        console.log(`Operation ${data.id} is still in progress`)
        return
    }

    // prettier-ignore
    if (data.id && intent !== 'operations') {
        // it must be response on some async request
        if (only_operation_id) {
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
        } else if (Object.keys(data).length === 1) {
            // this is a response to an async operation request (like ai.text.translate with `async:true`)
            // send next request
            let resultsWerePrinted = false

            const bar = new ProgressBar(':bar  :current/:total :percent', {
                total: attempts,
                complete: '.',
                incomplete: ' ',
            })
            const timer = setInterval(async function () {
                bar.tick()

                let results
                try {
                    results = await client.operations.fulfill(data)
                } catch (err) {
                    clearInterval(timer)
                    printError(err, `Problem requesting operation results:\n${data}`)
                    return true
                }

                if (results.done) {
                    clearInterval(timer)
                    console.log('\n')
                    if (results.response === null) {
                        let prefix = ''
                        if (output) {
                            prefix = `${output}_`
                        }
                        const logFilename = `${prefix}${NOW_TS}_errors.txt`
                        const content = {
                            error: 'We are collecting errors from provider(s). Repeat this request later to get more info.',
                            ...results,
                        }
                        await writeFile(logFilename, prettyJSON(content), { encoding }, () => {
                            console.log(`Job finished with errors. More in the ${logFilename} file\n`)
                        })
                    } else {
                        if (!resultsWerePrinted) {
                            resultsWerePrinted = true
                            const resultsTransformer = {
                                translate: prettyTranslationResults,
                                'ai.text.translate': prettyTranslationResults,
                            }[intent] || prettyJSON
                            if (output) {
                                if (csv) {
                                    writeResultsToFile(output, results, csvifyResults)
                                } else {
                                    writeResultsToFile(output, results, resultsTransformer)
                                }
                            } else {
                                printResults(intent, results.response)
                            }
                        }
                    }
                }

                if (bar.complete) {
                    clearInterval(timer)
                    if (!resultsWerePrinted) {
                        resultsWerePrinted = true
                        console.log('\nStop sending operation requests\n')
                        if (!results || results.done === false) {
                            console.log(`Operation ${data.id} is still in progress`)
                            console.log(`Request operation results later with a command`)
                            console.log(`\tnode index.js --key=${apikey} --intent=operations --id=${data.id} --output=${output || `${Date.now()}_output.txt`}`)
                        }
                    }
                }
            }, timedelta)
        }

        // return
    }

    if (output) {
        if (data.results) {
            writeResultsToFile(output, data)
            return
        }

        if (data.id && data.done) {
            // it is an operation/id request with response ~ same as done = true

            data.response.forEach(async (resp, idx) => {
                const fname = output + (idx > 0 ? `_${idx}_.txt` : '')
                writeResultsToFile(fname, resp)
            })
            return
        }

        writeResultsToFile(output, data, prettyJSON)
        return
    }

    printResults(intent, data)
}

/**
 * Transforms complex response structure to a multiline string
 *
 * @param {array} data response results
 * @returns {string} multiline string
 */
function prettyTranslationResults(data) {
    if (data.response.length === 1) {
        return data.response[0].results.join('\n')
    }
    return data.response.map(resp => resp.results.join('')).join('\n')
}

/**
 *
 *
 * @param {object} data response with processed input
 * @returns {string} multiline string
 */
function csvifyResults(data) {
    if (data.response.length === 1) {
        return data.response[0].results.map(JSON.stringify).join('\n')
    }
    return data.response
        .map(resp => resp.results.join(''))
        .map(JSON.stringify)
        .join('\n')
}

/**
 * Logs human-readable json
 *
 * @param {array} data response results
 * @returns {undefined}
 */
function prettyJSON(data) {
    return JSON.stringify(data, null, 4)
}

/**
 * Transforms results array to a multiline string
 *
 * @param {array} data response results
 * @returns {string} response results as oneliner
 */
function joinLines(data) {
    return data.results.join('\n')
}

/**
 * Log results depending on intent
 *
 * @param {string} intent (ai) intent
 * @param {array} data response results
 * @returns {undefined}
 */
function printResults(intent, data) {
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
 * Writes results to a specified file
 *
 * @param {string} output relative path to filename, from cli arguments
 * @param {array} data response results
 * @param {function} [resultsGetter=joinLines] how to extract valuable results from API response (may depend on type of intent, etc.)
 * @returns {undefined}
 */
async function writeResultsToFile(output, data, resultsGetter = joinLines) {
    try {
        await writeFile(output, resultsGetter(data), { encoding })
        console.log(`Results were written to the ${output} file`)
    } catch (e) {
        console.error(`Errors while writing to the ${output} file`)
        console.log('Response:\n', data)
    } finally {
        if (VERBOSE || DEBUG) {
            if (data.meta) {
                console.log('meta', data.meta)
            }
            if (data.service) {
                console.log('service', data.service)
            }
            if (!data.meta && !data.service) {
                console.log(data)
            }
        }
    }
}

/**
 * Log response results as pretty printed JSON object
 *
 * @param {array|object} data response data
 * @returns {undefined}
 */
function responseAsIs(data) {
    console.log('API response:\n', prettyJSON(data), '\n\n')
}

/**
 * Log response showing only provider ids
 *
 * @param {array} data response data
 * @returns {undefined}
 */
function listIdsFromResponse(data) {
    console.log('API response:')
    data.forEach(p => {
        console.log(p.id)
    })
}

/**
 * Log usage response as a table
 *
 * @param {array} data response results
 * @returns {undefined}
 */
function usageResponse(data) {
    console.log('API response:')
    const values = data.data
    if (values[0].group) {
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
            const list = Object.keys(data2).map(timestamp => ({
                ...data2[timestamp],
                timestamp: new Date(1000 * timestamp),
            }))
            console.log(`\n${Array(40).join('-')}> ${metric}`)
            console.table(list, ['timestamp', ...Object.keys(data2[Object.keys(data2)[0]])])
        })
    } else {
        const list = values.map(({ metrics, timestamp, group }) => ({
            ...metrics,
            timestamp,
            ...group,
        }))
        console.table(list, ['requests', 'items', 'len', 'errors', 'timestamp'])
    }
}

/**
 * Log response showing a provider info except for languages
 *
 * @param {array} data response data
 * @returns {undefined}
 */
function shortProviderInfoResponse(data = {}) {
    const {
        languages, // eslint-disable-line no-unused-vars
        ...other
    } = data
    console.log('API response:\n', prettyJSON(other), '\n\n')
}

/**
 * Choose a function to log response results
 *
 * @param {string} intent name
 * @returns {function} how to output response results
 */
function getDefaultOuputFn(intent) {
    if (responseMapper) {
        return {
            responseAsIs,
            listIdsFromResponse,
            usageResponse,
            shortProviderInfoResponse,
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
 *
 * @param {object} errorResponse - http response object
 * @param {string} [explanation=''] description of a context where an error might be happening
 * @returns {undefined}
 */
function prettyCatch(errorResponse, explanation = '') {
    if ((printError(errorResponse), explanation)) {
        return
    }

    errorResponse.setEncoding('utf8')
    let body = ''
    errorResponse.on('data', function(chunk) {
        body += chunk
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

/**
 * Select SDK function to make requests to the Intento API
 *
 * @param {object} connector an IntentoConnector instance
 * @param {string} value intent name
 * @returns {Function} function that can make http requests to a certain Intento API endpoint
 */
function getIntentProcessor(connector, value = DEFAULT_INTENT) {
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
 * @returns {undefined}
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
 *
 * @returns {undefined}
 */
function warnAsyncSmartAndExit() {
    // prettier-ignore
    const PROVIDERS_EXAMPLE = 'https://github.com/intento/intento-nodejs/tree/master/samples/cli#list-available-providers'

    console.error("Smart mode for async operations currently isn't supported")
    console.log('Please specify a provider with `--provider` option.')
    console.log(`To get available providers try an example ${PROVIDERS_EXAMPLE}`)

    process.exit(1)
}

/**
 * Log error message if one was found
 *
 * @param {object} data response object
 * @param {string} [explanation=''] description of a context where an error might be happening
 * @returns true if some error message was detected
 * @returns {bool} return true if error was printed
 */
function printError(data, explanation = '') {
    if (DEBUG) {
        console.error(Object.keys(data))
    }

    const bang = 'CLI error report'
    if (data.message) {
        console.error(`${bang}: ${explanation}\n${data.message}`)
        return true
    }
    if (data.error) {
        console.error(
            `${bang}: ${explanation}\n ${data.error.code} ${ERROR_CODES[data.error.code] || ''}\n${
                data.error.message
            }`
        )
        return true
    }
    if (data.statusCode && data.statusCode !== 200) {
        console.error(`${bang}: ${explanation}\n ${data.statusCode} ${data.statusMessage}`)
        return true
    }

    return false
}

/**
 * Tests if given intent requires non-empty text field.
 * For example all `ai.text.*` (or `ai/text/*`) intents require the text parameter (or the input file parameter).
 * Also their aliases - translate, dictionary and sentiment - require the text parameter (or the input file parameter).
 * In the same time `(translate|dictionary|sentiment).providers` intent does not require the text parameter.
 *
 * @param {string} intent intent name
 * @returns {bool} true when text value is required
 */
function intentRequiresText(intent = DEFAULT_INTENT) {
    if (intent === 'translate') {
        return true
    }
    if (intent === 'dictionary') {
        return true
    }
    if (intent === 'sentiment') {
        return true
    }
    if (intent.indexOf('provider') !== -1) {
        return false
    }
    if (intent.indexOf('language') !== -1) {
        return false
    }

    return intent.indexOf('text') !== -1
}

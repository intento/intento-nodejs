'use strict'

const fs = require('fs')
const parseArgs = require('minimist')
const IntentoConnector = require('../../src/index')

const argv = parseArgs(process.argv.slice(2), {
    /* options */
    boolean: ['debug', 'verbose', 'async', 'help', 'bulk'],
    alias: {
        help: ['h'],
        debug: ['d'],
        verbose: ['v'],
        apikey: ['k', 'key'],
        intent: ['i'],
        bulk: ['b'],
    },
})

const {
    help = false,
    debug = false,
    verbose = false,
    apikey,
    host,
    intent = 'translate',
    responseMapper,
    async,
    h = false, // eslint-disable-line no-unused-vars
    d, // eslint-disable-line no-unused-vars
    v, // eslint-disable-line no-unused-vars
    k, // eslint-disable-line no-unused-vars
    key, // eslint-disable-line no-unused-vars
    i, // eslint-disable-line no-unused-vars
    _ = [],
    provider,
    input,
    bulk = false,
    output,
    encoding = 'utf-8',
    pre_processing,
    post_processing,
    ...rest
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

// prettier-ignore
const PROVIDERS_EXAMPLE = 'https://github.com/intento/intento-nodejs/tree/master/samples/cli#list-available-providers'

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

let responseMapperFnName = responseMapper
if (!responseMapperFnName) {
    if (intent.indexOf('providers') === -1) {
        // not requesting for providers
        responseMapperFnName = 'responseAsIs'
    } else {
        responseMapperFnName = 'listIdsFromResponse'
    }
}
const outputFn = {
    responseAsIs,
    listIdsFromResponse,
}[responseMapperFnName]

const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, verbose: VERBOSE })

const intentShortcuts = {
    translate: client.ai.text.translate,
    providers: client.ai.text.translate.providers,
    ['translate.providers']: client.ai.text.translate.providers,
    sentiment: client.ai.text.sentiment,
    ['sentiment.providers']: client.ai.text.sentiment.providers,
    dictionary: client.ai.text.dictionary,
    ['dictionary.providers']: client.ai.text.dictionary.providers,
    settings: client.settings.languages,
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

const options = {}

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

if (pre_processing || post_processing) {
    options.processing = options.processing || {}
    if (pre_processing) {
        options.processing.pre = pre_processing.split(',')
    }
    if (post_processing) {
        options.processing.post = post_processing.split(',')
    }
}

if (input) {
    if (options.async && !provider) {
        console.error("Smart mode for async operations currently isn't supported")
        console.log('Please specify a provider with `--provider` option.')
        console.log(`To get available providers try an example ${PROVIDERS_EXAMPLE}`)

        process.exit(1)
    }

    const path = require('path')
    let filePath
    try {
        filePath = path.join(__dirname, input)
    } catch (e) {
        console.error(e.message)
    }

    fs.readFile(filePath, { encoding }, (err, data) => {
        if (!err) {
            options.text = data

            if (bulk) {
                options.text = options.text.split('\n')
            }

            try {
                intentProcessor({ ...options, ...rest })
                    .then(errorFriendlyCallback)
                    .catch(prettyCatch)
            } catch (e) {
                console.error(e.message)
            }
        } else {
            console.log(`Error reading ${input} file\n`, err)
        }
    })
} else {
    if (_.length > 0) {
        if (_.length === 1) {
            // avoid errors from providers without bulk support
            options.text = _[0]
        } else {
            options.text = _
        }
    }

    try {
        intentProcessor({ ...options, ...rest })
            .then(errorFriendlyCallback)
            .catch(prettyCatch)
    } catch (e) {
        console.error(e.message)
    }
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
        if (DEBUG) {
            console.error(data)
        }
    } else if (data.error) {
        // prettier-ignore
        console.error( `\nError: ${data.error.code} ${errorCodes[data.error.code]}\n${data.error.message}`)
        if (input && !async) {
            console.log('Consider using --async option')
        }
        console.log('\n')
        if (DEBUG) {
            console.error(data)
        }
    } else {
        if (output) {
            try {
                if (data.id && !data.done) {
                    // prettier-ignore
                    if (intent.indexOf('operations') === -1) {
                        // async job was registered with `id`
                        console.log('\noperation id', data.id)
                        console.log(`\nRequest operation results later with a command`)
                        if (output) {
                            console.log(`\tnode index.js --key=${apikey} --intent=operations --id=${data.id} --output=${output}`)
                        } else {
                            console.log(`\tnode index.js --key=${apikey} --intent=operations --id=${data.id} --output=output.txt`)
                        }
                        fs.writeFile(`${input}_operation_id.txt`, data.id, { encoding }, () => {
                            console.log(`\nOperation id was written to the ${input}_operation_id.txt file`)
                        })
                    } else {
                        // it is an operation/id request with empty response ~ same as done = false
                        console.log(`Operation ${data.id} is still in progress`)
                    }
                }

                if (data.results) {
                    fs.writeFile(output, data.results.join('\n'), { encoding }, () => {
                        console.log(`Results were written to the ${output} file`)
                        if (VERBOSE || DEBUG) {
                            console.log('meta', data.meta)
                            console.log('service', data.service)
                        }
                    })
                } else if (data.id && data.done) {
                    // it is an operation/id request with response ~ same as done = true
                    data.response.forEach(resp => {
                        fs.writeFile(output, resp.results.join('\n'), { encoding }, () => {
                            console.log(`\nResults were written to the ${output} file\n`)
                            if (VERBOSE || DEBUG) {
                                console.log('meta', resp.meta)
                                console.log('service', resp.service)
                            }
                        })
                    })
                } else {
                    fs.writeFile(output, JSON.stringify(data, null, 4), { encoding }, () => {
                        console.log(`\nResults were written to the ${output} file\n`)
                    })
                }
            } catch (e) {
                console.error(`Errors while writing to the ${output} file`)
                console.log('Response:\n', data)
            } finally {
                if (DEBUG) {
                    console.log(data)
                }
            }
        } else if (typeof outputFn === 'function') {
            outputFn(data)
        } else {
            if (DEBUG) {
                console.log('Output results using default responseMapper')
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

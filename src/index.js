/* global window */
'use strict'

const VERSION = '0.9.0'
const SDK_NAME = 'Intento.NodeJS'

const DEFAULT_AWAIT_DELAY = 1000

const https = require('https')
const querystring = require('querystring')
const {
    responseHandler,
    customErrorLog,
    stringToList,
    ownCredentials,
} = require('./utils')
const HOST = process.env.INTENTO_API_HOST || 'api.inten.to'

/**
 * Main class for connectiong to Intento API
 * Typical usage:
 *      const client = new IntentoConnector({ apikey: YOUR_APIKEY })
 *
 * @param {*} [credentials={}] credentials like apikey
 * @param {*} [options={}] options for logging and debug mostly
 * @returns {undefined}
 */
function IntentoConnector(credentials = {}, options = {}) {
    const {
        debug = false,
        verbose = false,
        curl = false,
        dryRun = false,
        userAgent,
    } = options
    if (typeof credentials === 'string') {
        this.credentials = { apikey: credentials }
    } else {
        this.credentials = credentials
    }

    this.version = VERSION
    this.debug = debug
    this.curl = curl
    this.verbose = verbose
    this.dryRun = dryRun
    this.userAgent = userAgent

    const { apikey, host = HOST } = this.credentials

    if (!apikey) {
        if (debug || verbose) {
            console.error('Missing Intento API key')
        }
        this.error = 'No Intento API key provided'
        return
    }

    this.apikey = apikey
    this.host = host

    this.settings = Object.freeze({
        languages: params => {
            return this.settingsLanguages(params)
        },
        processingRules: params => {
            return this.processingRules(params)
        },
        'processing-rules': params => {
            return this.processingRules(params)
        },
    })

    /**
     * Generates functions typical for all intents
     *
     * @param {String} [slug] intent path like `/ai/image/ocr`
     * @returns {Object} intent API
     */
    const anyIntentGenerator = slug => {
        return {
            fulfill: params => {
                // POST /ai/text/translate with params
                // Example params: `from`, `to`, `text
                return this.fulfill(slug, params)
            },
            providers: params => {
                // GET /ai/text/translate with params
                // Example param: `lang_detect`
                return this.providers(slug, params)
            },
            provider: (providerId, params = {}) => {
                // GET /ai/text/translate/{providerId} without params, may accept params in the future
                if (typeof providerId === 'string') {
                    return this.provider(slug, { id: providerId, ...params })
                }
                // assume that all params are passed in second parameter
                return this.provider(slug, providerId)
            },
        }
    }

    /**
     * Generates functions typical for text intents
     *
     * @param {String} [slug] intent path like `/ai/image/ocr`
     * @returns {Object} intent API
     */
    const textIntentGenerator = slug => {
        return {
            ...anyIntentGenerator(slug),
            languages: params => {
                // GET <slug>/languages with params
                // Example param: `locale`
                return this.languages(slug, params)
            },
            language: (langCode, params) => {
                // GET <slug>/languages/{id} with params
                // Example param: `locale`
                return this.language(slug, langCode, params)
            },
        }
    }

    this.ai = Object.freeze({
        text: {
            translate: textIntentGenerator('/ai/text/translate'),
            sentiment: textIntentGenerator('/ai/text/sentiment'),
            dictionary: textIntentGenerator('/ai/text/dictionary'),
            classify: textIntentGenerator('/ai/text/classify'),
            transliterate: textIntentGenerator('/ai/text/transliterate'),
            'detect-intent': textIntentGenerator('/ai/text/detect-intent'),
            'detect-language': textIntentGenerator('/ai/text/detect-language'),
        },
        image: {
            tagging: anyIntentGenerator('/ai/image/tagging'),
            ocr: anyIntentGenerator('/ai/image/ocr'),
        },
        speech: {
            transcribe: anyIntentGenerator('/ai/speech/transcribe'),
        },
    })

    this.operations = Object.freeze({
        fulfill: params => {
            return this.asyncOperations(params)
        },
    })

    this.usage = Object.freeze({
        intento: params => {
            return this.usageFulfill(
                '/usage/intento',
                params // --> range: obj, filter: obj
            )
        },
        provider: params => {
            return this.usageFulfill(
                '/usage/provider',
                params // --> range: obj, filter: obj
            )
        },
        distinct: params => {
            return this.usageFulfill(
                '/usage/distinct',
                params // --> range: obj, fields: list
            )
        },
    })

    this.delegatedCredentials = Object.freeze({
        list: params => this.listCredentials('/delegated_credentials', params),
        add: params => this.addCredentials('/delegated_credentials', params),
        remove: params =>
            this.removeCredentials('/delegated_credentials', params),
    })
}

module.exports = IntentoConnector

module.exports.default = Object.assign({}, module.exports)

IntentoConnector.prototype.version = VERSION

IntentoConnector.prototype.makeRequest = function(options = {}) {
    const { path = '', params, content, data, method = 'GET' } = options

    const urlParams = querystring.stringify(params)

    const requestOptions = {
        host: this.host,
        headers: {
            'content-type': 'application/json',
            'User-Agent': this.getUserAgent(),
            'X-User-Agent': this.getUserAgent({ customHeader: true }),
            apikey: this.apikey,
        },
        path: path + (urlParams ? '?' + urlParams : ''),
        method,
    }
    if (this.debug) {
        console.log('\nAPI request requestOptions\n', requestOptions)
    }
    if (this.verbose) {
        console.log(
            `\nAPI request\n 'apikey: ${requestOptions.headers.apikey}' https://${requestOptions.host}${requestOptions.path}`
        )
    }

    if (data && content) {
        console.warn(
            'Specify either `data` or `content` to pass data to POST request. \n For now `data` will be used.'
        )
    }
    if (data) {
        if (typeof data === 'string') {
            try {
                JSON.parse(data)
            } catch ({ message }) {
                console.error(message)
                console.log('No request will be made')
                return Promise.resolve({ error: message })
            }
        } else {
            console.error('`data` must be a string')
            console.log('No request will be made')
            return Promise.resolve({ error: '`data` must be a string' })
        }
    }
    if (this.debug) {
        console.log('\nAPI request content\n', content)
    }

    if (this.curl) {
        const { host, path, headers } = requestOptions
        let requestString = `curl -X${method} -H 'apikey: ${headers.apikey}' https://${host}${path}`
        const curlData = data || JSON.stringify(content, null, 4) || ''

        if (curlData) {
            requestString += ` -d '${curlData}'`
        }

        console.log(`\nTest request\n${requestString}`)
    }

    return new Promise((resolve, reject) => {
        if (this.dryRun) {
            resolve(data || content || requestOptions.path || '')
        }

        try {
            const req = https.request(requestOptions, resp =>
                responseHandler(resp, resolve, reject, this.debug, this.verbose)
            )

            req.on('error', function(err) {
                if (err.code === 'ENOTFOUND') {
                    console.error('Host look up failed: \n', err)
                    console.log('\nPlease, check internet connection\n')
                } else {
                    customErrorLog(err, 'Fails getting a response from the API')
                }
            })
            req.on('timeout', function(err) {
                customErrorLog(err, 'Are you offline?')
            })
            req.write(data || JSON.stringify(content) || '')
            req.end()
        } catch (e) {
            customErrorLog(e, 'Fails to send a request to the API')
        }
    })
}

IntentoConnector.prototype.fulfill = function(slug, parameters = {}) {
    const {
        text,
        to,
        from,
        lang,
        format,
        category,
        provider,
        bidding,
        routing,
        failover,
        failover_list,
        auth,
        // prettier-ignore
        'async': asyncMode,
        awaitAsync,
        awaitDelay = DEFAULT_AWAIT_DELAY,
        multiple_translations,
        input_format,
        output_format,
        pretty_print,
        processing = {},
        trace,
        userdata,
        ...other
    } = parameters
    const providerList = stringToList(provider)

    const content = {
        context: { text, from, to, lang, category, format, ...other },
        service: {
            provider: providerList,
            auth: ownCredentials(auth, providerList),
            // prettier-ignore
            'async': asyncMode,
            bidding,
            routing,
            failover,
            failover_list,
            multiple_translations,
            input_format,
            output_format,
            pretty_print,
            trace, // https://github.com/intento/intento-api/blob/edaefaa932267d7b09f0e07a74a0731c96e5c7bc/README.md#request-body-in-service
        },
        userdata,
    }

    if (processing && (processing.pre || processing.post)) {
        content.service.processing = {
            pre: stringToList(processing.pre),
            post: stringToList(processing.post),
        }
    }

    if (!content.service.provider) {
        if (slug === 'dictionary') {
            content.service.provider =
                'ai.text.dictionary.yandex.dictionary_api.1-0'
        } else if (slug === 'sentiment') {
            console.error('Please specify a provider')
            console.log(
                'You can look up for providers by calling `client.ai.text.sentiment.providers()`.',
                '\nProvider `id` is needed to be specified as a `provider` parameter'
            )
            console.log('No request will be made')
            this.ai.text.sentiment.providers().then(data => {
                console.log('Select one of the provider ids')
                data.forEach(p => console.log(`    ${p.id}`))
                console.log(`(total ${data.length} providers)`)
            })
            throw new Error('Please specify a provider')
        }
    }

    const that = this
    // RECURSION
    /**
     *  @param {number} [delay] time in milliseconds
     *  @param {object} [data] any object with id key
     *  @returns {promise} promise
    */
    function later(delay, data) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                that.makeRequest({
                    path: `/operations/${data.id}`,
                    method: 'GET',
                }).then(operationResponse => {
                    if (operationResponse.done) {
                        resolve(operationResponse)
                    } else {
                        return later(delay, data)
                    }
                })
            }, delay)
        })
    }
    if (asyncMode && awaitAsync) {
        return this.makeRequest({
            path: slug,
            content,
            method: 'POST',
        }).then(data => {
            return later(awaitDelay, data)
        })
    }

    return this.makeRequest({
        path: slug,
        content,
        method: 'POST',
    })
}

IntentoConnector.prototype.getUserAgent = function(params = {}) {
    const { customHeader = false } = params
    const markers = []

    if (this.userAgent) {
        markers.push(this.userAgent)
    }

    markers.push(`${SDK_NAME}/${this.version}`)

    if (process && process.version) {
        // running from node environment (from terminal)
        markers.push(`(NodeJS/${process.version})`)
    } else if (window && window.navigator && !customHeader) {
        // running from a browser
        // there is a problem with setting custom user-agent
        // short description: https://stackoverflow.com/a/42815264/2412719
        // spec https://fetch.spec.whatwg.org/#forbidden-header-name (changing user-agent was allowed lately)
        // firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=1188932 (resolved fixed)
        // chrome bug https://bugs.chromium.org/p/chromium/issues/detail?id=571722 (not fixed, Oct 2018)
        markers.push(window.navigator.userAgent)
    }

    return markers.join(' ')
}

IntentoConnector.prototype.providers = function(slug, params) {
    if (params && params.id) {
        // a description of a provider was requested
        return this.provider(slug, params)
    }
    return this.makeRequest({
        path: slug,
        params,
        method: 'GET',
    })
}

IntentoConnector.prototype.provider = function(slug, params = {}) {
    const { id, ...otherParams } = params

    return this.makeRequest({
        path: slug + '/' + id,
        params: otherParams,
        method: 'GET',
    })
}

IntentoConnector.prototype.language = function(slug, langCode, params) {
    return this.languages(slug, { ...params, id: langCode })
}

IntentoConnector.prototype.languages = function(slug, params = {}) {
    const { id, language, ...other } = params
    let path = slug + '/languages'

    if (language) {
        path += '/' + language
    } else if (id) {
        path += '/' + id
    }

    return this.makeRequest({
        path,
        params: other,
        method: 'GET',
    })
}

IntentoConnector.prototype.settingsLanguages = function(params) {
    return this.makeRequest({
        path: '/settings/languages',
        content: params,
        method: params ? 'POST' : 'GET',
    })
}

IntentoConnector.prototype.processingRules = function(params) {
    return this.makeRequest({
        path: '/settings/processing-rules',
        params,
        method: 'GET',
    })
}

IntentoConnector.prototype.asyncOperations = function(params) {
    let path = '/operations/'
    const { id, ...other } = params
    if (id) {
        path += id
    }
    return this.makeRequest({
        path,
        params: other,
        method: 'GET',
    })
}

IntentoConnector.prototype.usageFulfill = function(path, parameters = {}) {
    const {
        from,
        to,
        bucket,
        items,
        provider,
        intent,
        status,
        client,
        fields,
        group,
    } = parameters
    const content = {
        group: stringToList(group),
        range: { from, to, bucket, items },
    }

    content.filter = {
        provider: stringToList(provider),
        intent: stringToList(intent),
        status: stringToList(status),
        client: stringToList(client),
    }

    if (fields && path.indexOf('distinct') !== -1) {
        if (Array.isArray(fields)) {
            content.fields = fields
        } else if (typeof fields === 'string') {
            content.fields = [fields]
        }
    }

    return this.makeRequest({
        path,
        content,
        method: 'POST',
    })
}

IntentoConnector.prototype.listCredentials = function(path) {
    return this.makeRequest({
        path,
        method: 'GET',
    })
}

IntentoConnector.prototype.addCredentials = function(path, parameters = {}) {
    const { credential_id, credential_type, secret_credentials } = parameters
    return this.makeRequest({
        path: path,
        content: {
            credential_id,
            credential_type,
            secret_credentials,
        },
        method: 'POST',
    })
}

IntentoConnector.prototype.removeCredentials = function(path, parameters = {}) {
    const { credential_id } = parameters
    return this.makeRequest({
        path: path + '/' + credential_id,
        method: 'DELETE',
    })
}

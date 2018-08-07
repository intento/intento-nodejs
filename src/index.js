/* global window */
'use strict'

const VERSION = '0.3.0-beta'

const https = require('https')
const querystring = require('querystring')

const HOST = process.env.INTENTO_API_HOST || 'api.inten.to'

function IntentoConnector(credentials = {}, options = {}) {
    const {
        debug = false,
        verbose = false,
        curl = false,
        dryRun = false,
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

    this.ai = Object.freeze({
        text: {
            translate: {
                fulfill: params => {
                    // POST /ai/text/translate with params
                    // Example params: `from`, `to`, `text
                    return this.fulfill('translate', params)
                },
                providers: params => {
                    // GET /ai/text/translate with params
                    // Example param: `lang_detect`
                    return this.providers('translate', params)
                },
                provider: (providerId, params) => {
                    // GET /ai/text/translate/{id} without params, may accept params in the future
                    return this.provider('translate', providerId, params)
                },
                languages: params => {
                    // GET /ai/text/translate/languages with params
                    // Example param: `locale`
                    return this.languages('translate', params)
                },
                language: (langCode, params) => {
                    // GET /ai/text/translate/languages/{id} with params
                    // Example param: `locale`
                    return this.language('translate', langCode, params)
                },
            },
            sentiment: {
                fulfill: params => {
                    return this.fulfill('sentiment', params)
                },
                providers: params => {
                    return this.providers('sentiment', params)
                },
                provider: (providerId, params) => {
                    return this.provider('sentiment', providerId, params)
                },
            },
            dictionary: {
                fulfill: params => {
                    return this.fulfill('dictionary', params)
                },
                providers: params => {
                    return this.providers('dictionary', params)
                },
                provider: (providerId, params) => {
                    return this.provider('dictionary', providerId, params)
                },
                languages: params => {
                    return this.languages('dictionary', params)
                },
            },
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
}

module.exports = IntentoConnector

module.exports.default = Object.assign({}, module.exports)

IntentoConnector.prototype.version = VERSION

IntentoConnector.prototype.makeRequest = function(options = {}) {
    const { path = '', params, content, data, method = 'GET' } = options

    const urlParams = querystring.stringify(params)

    let userAgent = ''
    if (process) {
        userAgent = `NodeJS SDK client (sdk version ${VERSION}; node version ${
            process.version
        })`
    } else if (window && window.navigator) {
        userAgent =
            `NodeJS SDK client (sdk version ${VERSION}) ` +
            window.navigator.userAgent
    } else {
        userAgent = `NodeJS SDK client (sdk version ${VERSION})`
    }

    const requestOptions = {
        host: this.host,
        headers: {
            'User-Agent': userAgent,
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
            `\nAPI request\n 'apikey: ${
                requestOptions.headers.apikey
            }' https://${requestOptions.host}${requestOptions.path}`
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
        const requestString = `curl -X${method} -H 'apikey: ${
            requestOptions.headers.apikey
        }' https://${requestOptions.host}${requestOptions.path} -d '${data ||
            JSON.stringify(content, null, 4) ||
            ''}'`
        console.log(`\nTest request\n${requestString}`)
    }

    if (this.dryRun) {
        return data || content || ''
    }

    return new Promise((resolve, reject) => {
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
        failover,
        failover_list,
        auth,
        // prettier-ignore
        'async': asyncMode,
        multiple_translations,
        input_format,
        output_format,
        pretty_print,
        processing = {},
    } = parameters
    const providerList = stringToList(provider)

    const content = {
        context: { text, from, to, lang, category, format },
        service: {
            provider: providerList,
            auth: ownCredentials(auth, providerList),
            // prettier-ignore
            'async': asyncMode,
            bidding,
            failover,
            failover_list,
            multiple_translations,
            input_format,
            output_format,
            pretty_print,
        },
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

    return this.makeRequest({
        path: getPath(slug, this.debug, this.verbose),
        content,
        method: 'POST',
    })
}

IntentoConnector.prototype.providers = function(slug, options = {}) {
    const validParams = ['from', 'to', 'bulk', 'lang_detect']
    const params = {}
    validParams.forEach(p => {
        if (options[p]) {
            params[p] = options[p]
        }
    })

    return this.makeRequest({
        path: getPath(slug, this.debug, this.verbose),
        params,
        method: 'GET',
    })
}

IntentoConnector.prototype.provider = function(slug, providerId, params) {
    return this.makeRequest({
        path: getPath(slug, this.debug, this.verbose) + '/' + providerId,
        params,
        method: 'GET',
    })
}

IntentoConnector.prototype.language = function(slug, langCode, params) {
    return this.makeRequest({
        path:
            getPath(slug, this.debug, this.verbose) + '/languages/' + langCode,
        params,
        method: 'GET',
    })
}

IntentoConnector.prototype.languages = function(slug, params = {}) {
    const { language, locale } = params
    let path = getPath(slug, this.debug, this.verbose) + '/languages'
    if (language) {
        path += '/' + language
    }
    return this.makeRequest({
        path,
        params: { locale },
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
    const { id } = params
    return this.makeRequest({
        path: '/operations/' + id,
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

// ---------------------------------- utils -----------------------------------

/**
 * Return url to send request to
 *
 * @param {string} slug intent short name
 * @param {boolean} [debug=false] debug mode (more logging)
 * @param {boolean} [verbose=false] verbose mode (more pretty logs)
 * @returns {string}
 */
function getPath(slug, debug = false, verbose = false) {
    const pathBySlug = {
        sentiment: '/ai/text/sentiment',
        translate: '/ai/text/translate',
        dictionary: '/ai/text/dictionary',
    }
    let path = pathBySlug[slug]
    if (!path) {
        path = pathBySlug.translate
        if (debug || verbose) {
            console.error(
                `Unknown intent ${slug}. Translate intent will be used`
            )
        }
    }

    return path
}

/**
 * Process request response
 *
 * @param {object} response any http response (JSON)
 * @param {Function} resolve Promise resolve
 * @param {Function} reject Promise reject
 * @param {boolean} [debug=false] debug mode (more logging)
 * @param {boolean} [verbose=false] verbose mode (more pretty logs)
 */
function responseHandler(
    response,
    resolve,
    reject,
    debug = false,
    verbose = false
) {
    response.setEncoding('utf8')

    if (response.statusCode >= 500) {
        if (debug) {
            customErrorLog(response)
        }
        reject(response)
    }

    let body = ''
    response.on('data', function(chunk) {
        body += chunk
    })
    response.on('end', function() {
        try {
            let data = null
            if (body.length > 0) {
                if (body[0] === '{' || body[0] === '[') {
                    data = JSON.parse(body)
                } else if (body[0] === '<') {
                    if (response.statusCode >= 400) {
                        throw new Error('HTML 4xx response: ' + body)
                    } else {
                        throw new Error(
                            'Unexpected 2xx or 3xx response: ' + body
                        )
                    }
                } else {
                    throw new Error('Unexpected response: ' + body)
                }
            }
            if (response.statusCode >= 400 && !data.error) {
                reject({
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                    ...data,
                })
            } else {
                resolve(data)
            }
        } catch (e) {
            if (debug || verbose) {
                customErrorLog(e)
            }
            reject(response)
        }
    })
}

/**
 * Log error description.
 *
 * @param {object} err javacsript error object or custom error object
 * @param {string} [explanation=''] some details on a context in which this error occurs
 */
function customErrorLog(err, explanation = '') {
    if (err.statusCode) {
        console.error(explanation, err.statusCode, err.statusMessage)
    } else {
        console.error(explanation, err)
    }
}

/**
 * Transform a comma-separated string into a list.
 * Do nothing if array is passed.
 * @param {string|array} value query parameter value
 * @returns array of strings
 */
function stringToList(value) {
    if (Array.isArray(value)) {
        return value
    }

    if (typeof value !== 'string') {
        return
    }

    return value.split(',').map(s => s.trim())
}

/**
 * Form auth object if some custom/own keys were passed
 * Accepts
 * - auth="{\"key\": \"$SOME_PROVIDER_APIKEY\" }" - JSON decoded object, any structure accepted
 * - auth="{\"user\": \"$SOME_PROVIDER_USERNAME\", \"password\": \"$SOME_PROVIDER_PASSWORD\" }" - JSON decoded object, any structure accepted
 * - auth="[{\"key\": \"$SOME_PROVIDER_APIKEY\" }]" - JSON decoded list of objects, , any structure accepted
 * - auth="{\"some-provider-id\":[{\"key\": \"$SOME_PROVIDER_APIKEY\" }]}" - JSON decoded full auth object, where keys are provider ids
 * - auth={'some-provider-id':[{ key: $SOME_PROVIDER_APIKEY }] } - javascript object, where keys are provider ids
 * @param {string|object} auth - credential description
 * @param {array} providerList - list of provider ids as strings
 * @returns {object} - correct auth object
 */
function ownCredentials(auth, providerList) {
    if (!auth) {
        return
    }
    if (typeof auth === 'object') {
        return auth
    }

    let authObj
    let authKeys

    if (auth[0] === '{') {
        const authKeysParsed = JSON.parse(auth)

        if (providerList.indexOf(Object.keys(authKeysParsed)[0]) !== -1) {
            authObj = authKeysParsed
            // keep authKeys undefined
        } else {
            // keep authObj undefined
            authKeys = [authKeysParsed]
        }
    } else if (auth[0] === '[') {
        authKeys = JSON.parse(auth)
    }

    if (authKeys) {
        if (providerList.length > 1) {
            throw new Error(
                'Unclear auth parameter: specify one provider or clarify provider inside auth object'
            )
        }
        if (!authObj) {
            authObj = { [providerList[0]]: authKeys }
        }
    }

    return authObj
}

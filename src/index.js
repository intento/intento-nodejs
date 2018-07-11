'use strict'

const https = require('https')
const querystring = require('querystring')

const HOST = process.env.INTENTO_API_HOST || 'api.inten.to'

function IntentoConnector(credentials = {}, options = {}) {
    const { debug = false, verbose = false } = options
    if (typeof credentials === 'string') {
        this.credentials = { apikey: credentials }
    } else {
        this.credentials = credentials
    }

    this.debug = debug
    this.verbose = verbose

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

IntentoConnector.prototype.makeRequest = function(options = {}) {
    const { path = '', params, content, data, method = 'GET' } = options

    const urlParams = querystring.stringify(params)

    const requestOptions = {
        host: this.host,
        headers: {
            'User-Agent': 'NodeJS SDK client',
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
    const requestData = data || JSON.stringify(content) || ''

    if (this.debug || this.verbose) {
        console.log(`\nAPI request data\n${requestData}\n`)
    }

    return new Promise((resolve, reject) => {
        const req = https.request(requestOptions, resp =>
            response_handler(resp, resolve, reject, this.debug, this.verbose)
        )

        req.write(requestData)
        req.end()
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
        async,
        multiple_translations,
        input_format,
        output_format,
        pretty_print,
        processing,
    } = parameters
    const content = {
        context: { text, from, to, lang, category, format },
        service: {
            provider,
            auth,
            async,
            bidding,
            failover,
            failover_list,
            multiple_translations,
            input_format,
            output_format,
            pretty_print,
            processing,
        },
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
            params[p] = p
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
        to = Math.ceil(Date.now() / 1000),
        bucket,
        provider,
        fields,
    } = parameters
    const content = {
        range: { from, to, bucket },
    }

    if (provider) {
        content.filter = { provider }
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

// helpers

const pathBySlug = {
    sentiment: '/ai/text/sentiment',
    translate: '/ai/text/translate',
    dictionary: '/ai/text/dictionary',
}

function getPath(slug, debug = false, verbose = false) {
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

function response_handler(
    response,
    resolve,
    reject,
    debug = false,
    verbose = false
) {
    response.setEncoding('utf8')

    if (response.statusCode >= 500) {
        if (debug) {
            console.log(response.statusCode, response.statusMessage)
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
                if (body[0] === '{') {
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
            resolve(data)
        } catch (e) {
            if (debug || verbose) {
                console.error(e)
                console.log(response.statusCode, response.statusMessage)
            }
            reject(response)
        }
    })
}

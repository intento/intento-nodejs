'use strict'

const https = require('https')
const querystring = require('querystring')

const HOST = process.env.INTENTO_API_HOST || 'api.inten.to'

function IntentoConnector(credentials = {}, debug = false) {
    if (typeof credentials === 'string') {
        this.credentials = { apikey: credentials }
    } else {
        this.credentials = credentials
    }

    this.debug = debug

    const { apikey, host = HOST } = this.credentials

    if (!apikey) {
        console.error('Missing Intento API key')
        return {
            error: 'No Intento API key provided',
        }
    }

    this.options = {
        host,
        headers: {
            'User-Agent': 'NodeJS SDK client',
            apikey,
        },
    }

    this.settings = Object.freeze({
        languages: function(params) {
            return this.settingsLanguages(params)
        }.bind(this),
    })

    this.ai = Object.freeze({
        text: {
            translate: {
                fulfill: function(params) {
                    // POST /ai/text/translate with params
                    // Example params: `from`, `to`, `text
                    return this.fulfill('translate', params)
                }.bind(this),
                providers: function(params) {
                    // GET /ai/text/translate with params
                    // Example param: `lang_detect`
                    return this.providers('translate', params)
                }.bind(this),
                provider: function(providerId, params) {
                    // GET /ai/text/translate/{id} without params, may accept params in the future
                    return this.provider('translate', providerId, params)
                }.bind(this),
                languages: function(params) {
                    // GET /ai/text/translate/languages with params
                    // Example param: `locale`
                    return this.languages('translate', params)
                }.bind(this),
                language: function(langCode, params) {
                    // GET /ai/text/translate/languages/{id} with params
                    // Example param: `locale`
                    return this.language('translate', langCode, params)
                }.bind(this),
            },
            sentiment: {
                fulfill: function(params) {
                    return this.fulfill('sentiment', params)
                }.bind(this),
                providers: function(params) {
                    return this.providers('sentiment', params)
                }.bind(this),
                provider: function(providerId) {
                    return this.provider('sentiment', providerId)
                }.bind(this),
            },
            dictionary: {
                fulfill: function(params) {
                    return this.fulfill('dictionary', params)
                }.bind(this),
                providers: function(params) {
                    return this.providers('dictionary', params)
                }.bind(this),
                provider: function(providerId) {
                    return this.provider('dictionary', providerId)
                }.bind(this),
                languages: function(params) {
                    return this.languages('dictionary', params)
                }.bind(this),
            },
        },
    })
}

module.exports = IntentoConnector

module.exports.default = Object.assign({}, module.exports)

IntentoConnector.prototype.makeRequest = function({
    path = '',
    params,
    content,
    data,
    method = 'GET',
}) {
    return new Promise((resolve, reject) => {
        const urlParams = querystring.stringify(params)

        const requestOptions = {
            ...this.options,
            path: path + (urlParams ? '?' + urlParams : ''),
            method,
        }
        if (this.debug) {
            console.log('\nAPI request requestOptions\n', requestOptions)
        }

        if (data && content) {
            console.warn(
                'Specify either `data` or `content` to pass data to POST request. \n For now `data` will be used.'
            )
        }
        if (data && typeof data !== 'string') {
            console.error('`data` must be a string')
            console.log('No request will be made')
            throw new Error('`data` must be a string')
        }
        if (this.debug) {
            console.log('\nAPI request content\n', content)
        }
        const requestData = data || JSON.stringify(content) || ''

        if (this.debug && requestData) {
            console.log('\nAPI request data\n', requestData)
        }
        const req = https.request(requestOptions, resp =>
            response_handler(resp, resolve, reject)
        )

        // do handle with Promise.prototype.catch
        req.on('error', reject)
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
        category,
        provider,
        bidding,
        failover,
        failover_list,
        auth,
        multiple_translations,
        input_format,
        output_format,
        pretty_print,
    } = parameters
    const content = {
        context: { text, from, to, lang, category },
        service: {
            provider,
            auth,
            bidding,
            failover,
            failover_list,
            multiple_translations,
            input_format,
            output_format,
            pretty_print,
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
            this.ai.text.sentiment.providers(function(err, data) {
                if (!err) {
                    console.log('Select one of the provider ids')
                    data.forEach((p, i) => console.log(`  ${i + 1}. ${p.id}`))
                }
            })
            throw new Error('Please specify a provider')
        }
    }

    return this.makeRequest({
        path: getPath(slug, this.debug),
        content,
        method: 'POST',
    })
}

IntentoConnector.prototype.providers = function(slug, params) {
    return this.makeRequest({
        path: getPath(slug, this.debug),
        params,
        method: 'GET',
    })
}

IntentoConnector.prototype.provider = function(slug, providerId, params) {
    return this.makeRequest({
        path: getPath(slug, this.debug) + '/' + providerId,
        params,
        method: 'GET',
    })
}

IntentoConnector.prototype.language = function(slug, langCode, params) {
    return this.makeRequest({
        path: getPath(slug, this.debug) + '/languages/' + langCode,
        params,
        method: 'GET',
    })
}

IntentoConnector.prototype.languages = function(slug, params = {}) {
    const { language, locale } = params
    let path = getPath(slug, this.debug) + '/languages'
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

// helpers

const pathBySlug = {
    sentiment: '/ai/text/sentiment',
    translate: '/ai/text/translate',
    dictionary: '/ai/text/dictionary',
}

function getPath(slug, debug) {
    let path = pathBySlug[slug]
    if (!path) {
        path = pathBySlug.translate
        if (debug) {
            console.error(
                `Unknown intent ${slug}. Translate intent will be used`
            )
        }
    }

    return path
}

function response_handler(response, resolve, reject) {
    if (response.status >= 400) {
        reject(response)
    }

    response.setEncoding('utf8')
    let body = ''
    response.on('data', function(chunk) {
        body += chunk
    })
    response.on('end', function() {
        try {
            let data = null
            if (body.length > 0) {
                data = JSON.parse(body)
            }
            resolve(data)
        } catch (e) {
            reject(e)
        }
    })
    response.on('error', reject)
}

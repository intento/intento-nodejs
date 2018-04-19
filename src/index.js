'use strict'

const https = require('https')
const querystring = require('querystring')

function IntentoConnector(credentials = {}, debug = false) {
    if (typeof credentials === 'string') {
        this.credentials = { apikey: credentials }
    } else {
        this.credentials = credentials
    }

    this.debug = debug

    const { apikey } = this.credentials

    if (!apikey) {
        console.error('Missing Intento API key')
        return {
            error: 'No Intento API key provided',
        }
    }

    this.options = {
        host: 'api.inten.to',
        headers: {
            apikey,
        },
    }

    this.ai = Object.freeze({
        text: {
            translate: {
                fullfill: function(context, fn) {
                    this.fullfill('translate', context, fn)
                }.bind(this),
                getProviders: function(params, fn) {
                    this.getProviders('translate', params, fn)
                }.bind(this),
                withStrategy: function(strategy, context, fn) {
                    this.withStrategy('translate', strategy, context, fn)
                }.bind(this),
            },
            sentiment: {
                fullfill: function(context, fn) {
                    this.fullfill('sentiment', context, fn)
                }.bind(this),
                getProviders: function(params, fn) {
                    this.getProviders('sentiment', params, fn)
                }.bind(this),
                withStrategy: function(strategy, context, fn) {
                    if (this.debug) {
                        console.warn('Experimental feature')
                    }
                    this.withStrategy('sentiment', strategy, context, fn)
                }.bind(this),
            },
            dictionary: {
                fullfill: function(context, fn) {
                    this.fullfill('dictionary', context, fn)
                }.bind(this),
                getProviders: function(params, fn) {
                    this.getProviders('dictionary', params, fn)
                }.bind(this),
                withStrategy: function(strategy, context, fn) {
                    if (this.debug) {
                        console.warn('Experimental feature')
                    }
                    this.withStrategy('dictionary', strategy, context, fn)
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
    fn = defaultCallback,
}) {
    if (!(fn instanceof Function)) {
        if (this.debug) {
            fn = defaultCallback
        } else {
            fn = function() {}
        }
    }
    if (data && content) {
        console.warn(
            'Specify either `data` or `content` to pass data to POST request. \n For now `data` will be used.'
        )
    }
    const urlParams = querystring.stringify(params)
    const settings = {
        ...this.options,
        path: path + (urlParams ? '?' + urlParams : ''),
        method,
    }
    if (this.debug) {
        console.log('\nAPI request settings\n', settings)
    }
    const requestData = data || JSON.stringify(content) || ''
    if (this.debug && requestData) {
        console.log('\nAPI request data\n', requestData)
    }
    const req = https.request(settings, resp => response_handler(resp, fn))
    req.on('error', fn)
    req.write(requestData)
    req.end()
}

IntentoConnector.prototype.fullfill = function(slug, context = {}, fn) {
    const provider = context.provider
    delete context.provider

    const content = { context }

    if (slug === 'dictionary') {
        content.service = {
            provider: 'ai.text.dictionary.yandex.dictionary_api.1-0',
        }
    } else if (slug === 'sentiment') {
        if (!provider) {
            console.error('Please specify a provider')
            console.log(
                'You can look up providers by calling `client.ai.text.sentiment.getProviders()`.',
                '\nProvider `id` is needed to be specified as a provider'
            )
            console.log('No request will be made')
            this.ai.text.sentiment.getProviders(function(err, data) {
                if (!err) {
                    console.log('Select one of the provider ids')
                    data.forEach((p, i) => console.log(`  ${i + 1}. ${p.id}`))
                }
            })
            return
        }

        content.service = { provider }
    }

    this.makeRequest({
        path: getPath(slug, this.debug),
        content,
        method: 'POST',
        fn,
    })
}

IntentoConnector.prototype.getProviders = function(slug, params, fn) {
    if (params instanceof Function) {
        fn = params
        params = {}
    }

    this.makeRequest({
        path: getPath(slug, this.debug),
        params,
        method: 'GET',
        fn,
    })
}

IntentoConnector.prototype.withStrategy = function(
    slug,
    strategy,
    context,
    fn
) {
    const content = {
        context,
        service: {
            bidding: strategy,
        },
    }

    this.makeRequest({
        path: getPath(slug, this.debug),
        content,
        method: 'POST',
        fn,
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
                `getProviders: Unknown intent ${slug}. Translate intent will be used`
            )
        }
    }

    return path
}

function defaultCallback(err, data) {
    if (err) {
        console.log('\nerror:' + err.message)
        return
    }
    console.log('API response:\n', data, '\n\n')
}

function response_handler(response, fn) {
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
            fn(null, data)
        } catch (e) {
            fn(e, null)
        }
    })
    response.on('error', function(e) {
        console.log('Error: ' + e.message)
    })
}

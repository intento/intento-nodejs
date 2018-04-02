'use strict'

const https = require('https')
const querystring = require('querystring')

function Intentor(credentials) {
    this.credentials = credentials

    this.options = {
        host: 'api.inten.to',
        headers: {
            'apikey': this.credentials.api_key
        }
    }
}

module.exports = Intentor

Intentor.prototype.makeRequest = function({
    path = '',
    params,
    content,
    data,
    method = 'GET',
    fn = () => {},
}) {
    if (data && content) {
        console.warn('Specify either `data` or `content` to pass data to POST request. \n For now data will be used.');
    }
    const urlParams = querystring.stringify(params)
    const settings = {
        ...this.options,
        path: path + (urlParams ? '?' + urlParams : ''),
        method,
    }
    const req = https.request(settings, resp => response_handler(resp, fn))
    req.on('error', fn)
    req.write(data || JSON.stringify(content) || '')
    req.end()
}

const response_handler = function (response, fn) {
    response.setEncoding('utf8')
    let body = ''
    response.on('data', function (chunk) {
        body += chunk
    })
    response.on('end', function () {
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
    response.on('error', function (e) {
        console.log('Error: ' + e.message)
    })
}


// Translation specific requests

Intentor.prototype.translationRequest = function ({ params, content, data, method, fn }) {
    this.makeRequest({
        path:'/ai/text/translate', 
        params, 
        content,
        data,
        method, 
        fn
    })
}

Intentor.prototype.allTranslationProviders = function (fn) {
    this.translationRequest({ method: 'GET', fn })
} 

Intentor.prototype.translateWithStrategy = function (strategy, context, fn) {
    const content = {
        context,
        service: {
            bidding: strategy
        }
    }
    this.translationRequest({ content, method:'POST', fn })
} 


// Sentiment Analysis specific requests

Intentor.prototype.sentimentRequest = function ({ params, content, data, method, fn }) {
    this.makeRequest({
        path: '/ai/text/sentiment',
        params,
        content,
        data,
        method,
        fn
    })
}

Intentor.prototype.allSentimentProviders = function (fn) {
    this.sentimentRequest({ method: 'GET', fn })
} 

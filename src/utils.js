const ERROR_MESSAGE_PREFIX = 'Utils error: '
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
        customErrorLog(response)
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
                        throwError('HTML 4xx response: ' + body)
                    } else {
                        throwError('Unexpected 2xx or 3xx response: ' + body)
                    }
                } else {
                    throwError('Unexpected response: ' + body)
                }
            }
            if (response.statusCode >= 400) {
                if (data.error) {
                    customErrorLog(data)
                    reject(data)
                } else {
                    reject({
                        statusCode: response.statusCode,
                        statusMessage:
                            response.statusMessage,
                        ...data,
                    })
                }
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
    if (!providerList || !providerList.length) {
        throwError(
            'Unclear parameters: specify at least one provider'
        )
    }
    if (typeof auth === 'object') {
        return auth
    }

    let authObj
    let authKeys

    if (auth[0] === '{') {
        let authKeysParsed
        try {
            authKeysParsed = JSON.parse(auth)
        } catch (e) {
            throwError(
                'Can not parse `auth` parameter. `auth` should be stringified json.'
            )
        }

        if (providerList.indexOf(Object.keys(authKeysParsed)[0]) !== -1) {
            authObj = authKeysParsed
            // keep authKeys undefined
        } else {
            // keep authObj undefined
            authKeys = [authKeysParsed]
        }
    } else if (auth[0] === '[') {
        try {
            // keep authObj undefined
            authKeys = JSON.parse(auth)
        } catch (e) {
            throwError(
                'Can not parse `auth` parameter. `auth` should be stringified json.'
            )
        }
    }

    if (!authObj) {
        authObj = { [providerList[0]]: authKeys }
    }

    return authObj
}

function throwError(message) {
    throw new Error(ERROR_MESSAGE_PREFIX + message)
}

module.exports = {
    ERROR_MESSAGE_PREFIX,
    getPath,
    responseHandler,
    customErrorLog,
    stringToList,
    ownCredentials,
}

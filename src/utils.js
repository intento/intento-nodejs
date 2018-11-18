const ERROR_MESSAGE_PREFIX = 'Utils error: '

/**
 * Process request response
 *
 * @param {object} response any http response (JSON)
 * @param {Function} resolve Promise resolve
 * @param {Function} reject Promise reject
 * @param {boolean} [debug=false] debug mode (more logging)
 * @param {boolean} [verbose=false] verbose mode (more pretty logs)
 * @returns {undefined}
 */
function responseHandler(
    response,
    resolve,
    reject,
    debug = false,
    verbose = false
) {
    /* istanbul ignore next */
    response.setEncoding('utf8')

    /* istanbul ignore next */
    if (response.statusCode >= 500) {
        customErrorLog(response)
        reject(response)
    }

    /* istanbul ignore next */
    let body = ''
    /* istanbul ignore next */
    response.on('data', function(chunk) {
        body += chunk
    })

    /* istanbul ignore next */
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
                } else if (body === 'OK') {
                    // temporary workaround TODO change API response
                    data = { status: 'OK' }
                } else {
                    throwError('Unexpected response: ' + body)
                }
            }
            if (response.statusCode >= 400) {
                if (data.error) {
                    reject(data)
                } else {
                    reject({
                        statusCode: response.statusCode,
                        statusMessage: response.statusMessage,
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
 * @returns {undefined}
 */
function customErrorLog(err, explanation = '') {
    /* istanbul ignore next */
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
 * @returns {array} array of strings
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
        throwError('Unclear parameters: specify at least one provider')
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

/**
 * throws Error with prefixed message. Depends on global ERROR_MESSAGE_PREFIX
 *
 * @param {string} message error explanation
 * @return {undefined}
 */
function throwError(message) {
    throw new Error(ERROR_MESSAGE_PREFIX + message)
}

module.exports = {
    ERROR_MESSAGE_PREFIX,
    responseHandler,
    customErrorLog,
    stringToList,
    ownCredentials,
}
